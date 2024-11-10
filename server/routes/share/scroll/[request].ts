import { z } from 'zod';
import { promises as fs, createReadStream } from 'fs';
import { shareScrollQueue } from '~/server/queue';
import { db } from '~/server/db';
import { and, eq, sql } from 'drizzle-orm';
import {
  itemsTable,
  userSettingsTable,
  userTable,
  clicksLeaderboardTable,
  hatcheryTable,
} from '~/database/schema';
import { DateTime } from 'luxon';
import path from 'node:path';
import type { H3Event } from 'h3';

const getData = async (userId: number) => {
  const [[weekly], [allTime], dragons] = await Promise.all([
    db
      .select({
        weeklyClicks: clicksLeaderboardTable.clicks_given,
        weeklyRank: clicksLeaderboardTable.rank,
      })
      .from(clicksLeaderboardTable)
      .where(
        and(
          eq(clicksLeaderboardTable.leaderboard, 'weekly'),
          eq(
            clicksLeaderboardTable.start,
            DateTime.now().startOf('week').toJSDate()
          ),
          eq(clicksLeaderboardTable.user_id, userId)
        )
      ),
    db
      .select({
        allTimeClicks: sql<number>`SUM(${clicksLeaderboardTable.clicks_given})`,
        allTimeRank: clicksLeaderboardTable.rank,
      })
      .from(clicksLeaderboardTable)
      .where(
        and(
          eq(clicksLeaderboardTable.leaderboard, 'all time'),
          // Yeah, this is literally just to force mysql to use the index.
          eq(clicksLeaderboardTable.start, DateTime.fromMillis(0).toJSDate()),
          eq(clicksLeaderboardTable.user_id, userId)
        )
      ),
    db
      .select({
        code: hatcheryTable.id,
      })
      .from(hatcheryTable)
      .where(eq(hatcheryTable.user_id, userId)),
  ]);

  return {
    weeklyClicks: weekly?.weeklyClicks ?? 0,
    weeklyRank: weekly?.weeklyRank ?? null,
    allTimeClicks: allTime?.allTimeClicks ?? 0,
    allTimeRank: allTime?.allTimeRank ?? null,
    dragons: dragons.map((dragon) => dragon.code),
  };
};

const getUser = async (userId: number) => {
  const [user] = await db
    .select({
      id: userTable.id,
      username: userTable.username,
      flairUrl: itemsTable.url,
    })
    .from(userTable)
    .innerJoin(userSettingsTable, eq(userTable.id, userSettingsTable.user_id))
    .leftJoin(itemsTable, eq(userSettingsTable.flair_id, itemsTable.id))
    .where(eq(userTable.id, userId));

  if (!user) return null;

  if (user.flairUrl) {
    user.flairUrl = path.resolve('/src/resources/public/items/', user.flairUrl);
  }

  return user;
};

async function exists(file: string) {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

async function sendJob(
  user: { id: number; username: string; flairUrl: string | null },
  filePath: string
) {
  const { weeklyClicks, weeklyRank, allTimeClicks, allTimeRank, dragons } =
    await getData(user.id);

  await shareScrollQueue.add(
    'shareScrollQueue',
    {
      user,
      filePath,
      weeklyClicks,
      weeklyRank,
      allTimeClicks,
      allTimeRank,
      dragons,
    },
    {
      removeOnComplete: false,
      removeOnFail: false,
      deduplication: {
        id: `banner-${user.id}` + filePath.substring(filePath.lastIndexOf('.')),
        ttl: useRuntimeConfig().bannerCacheExpiry * 1000,
      },
    }
  );
}

function sendNotFound(event: H3Event) {
  setHeader(event, 'Content-Type', 'image/gif');
  return sendStream(
    event,
    createReadStream(path.resolve('/src/resources/banner/not_found.gif'))
  );
}

export default defineEventHandler(async (event) => {
  const { request } = getRouterParams(event);

  const contentTypes = {
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };

  const params = await z
    .object({
      id: z.string().min(1).pipe(z.coerce.number()),
      ext: z.union([z.literal('.gif'), z.literal('.webp')]),
    })
    .safeParseAsync({
      id: request.substring(0, request.lastIndexOf('.')),
      ext: request.substring(request.lastIndexOf('.')),
    });

  if (!params.data || !params.success) return sendNotFound(event);

  const filePath = `/cache/scroll/${params.data.id}${params.data.ext}`;
  const contentType = contentTypes[params.data.ext];
  const user = await getUser(params.data.id);

  if (!user) return sendNotFound(event);

  // todo later: it might be better to contain all of these variables
  // into a "data" object instead of threading every single one
  // through multiple funcs.
  await sendJob(user, filePath);

  if (await exists(filePath)) {
    setHeaders(event, {
      'Content-Type': contentType,
      'Cache-Control': `public, max-age=${useRuntimeConfig().bannerCacheExpiry}`,
    });
    return sendStream(event, createReadStream(filePath));
  }

  setHeader(event, 'Content-Type', contentType);

  return sendStream(
    event,
    createReadStream(`/src/resources/banner/in_progress${params.data.ext}`)
  );
});

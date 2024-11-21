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
import type { User } from '~/workers/shareScrollWorkerTypes';

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

const getUser = async (userId: number, username: string) => {
  const [user] = await db
    .select({
      id: userTable.id,
      username: userTable.username,
      flairPath: itemsTable.url,
    })
    .from(userTable)
    .innerJoin(userSettingsTable, eq(userTable.id, userSettingsTable.user_id))
    .leftJoin(itemsTable, eq(userSettingsTable.flair_id, itemsTable.id))
    .where(and(eq(userTable.id, userId), eq(userTable.username, username)));

  if (!user) return null;

  if (user.flairPath) {
    user.flairPath = `items/${user.flairPath}`;
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

async function sendJob(user: User, filePath: string) {
  const { bannerCacheExpiry, clientSecret } = useRuntimeConfig();
  const expires = bannerCacheExpiry * 1000;
  const jobId = `banner-` + filePath.substring(filePath.lastIndexOf('/') + 1);

  // We don't want to rerun these queries if not enough time has passed.
  const existingJob = await shareScrollQueue.getJob(jobId);

  if (existingJob && Date.now() - existingJob.timestamp < expires) {
    console.log('not met expiry threshold yet.');
    return;
  } else {
    existingJob?.remove();
  }

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
      clientSecret,
    },
    {
      removeOnFail: true,
      jobId,
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 10000,
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

  const match = request.match(/^(\d+)-([\w\s-%]+)(\.\w+)?$/);

  if (!match) return setResponseStatus(event, 404);

  const [, userId, username, ext] = match;

  const params = await z
    .object({
      userId: z.coerce.number().min(1),
      username: z.string().min(2).max(30),
      ext: z.union([z.literal('.gif'), z.literal('.webp')]).default('.gif'),
    })
    .safeParseAsync({
      userId,
      username,
      ext,
    });

  if (!params.data || !params.success) return sendNotFound(event);

  const filePath = `/cache/scroll/${params.data.userId}${params.data.ext}`;
  const contentType = contentTypes[params.data.ext];

  const user = await getUser(
    params.data.userId,
    decodeURIComponent(params.data.username)
  );

  if (!user) return sendNotFound(event);

  await sendJob(user, filePath);

  if (await exists(filePath)) {
    setHeaders(event, {
      'Content-Type': contentType,
      'Cache-Control': `public, max-age=1`,
    });
    return sendStream(event, createReadStream(filePath));
  }

  setHeader(event, 'Content-Type', contentType);

  return sendStream(
    event,
    createReadStream(`/src/resources/banner/in_progress${params.data.ext}`)
  );
});

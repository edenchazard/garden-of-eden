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

const getClickStatistics = async (userId: number) => {
  const [
    [{ weeklyClicks = 0, weeklyRank = null }],
    [{ allTimeClicks = 0, allTimeRank = null }],
  ] = await Promise.all([
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
  ]);

  // referenced off of statistics/index.ts but i haven't a clue if this works.
  // at least it's not throwing
  // i should find out how to pull data from prod.
  return {
    weeklyClicks,
    weeklyRank,
    allTimeClicks,
    allTimeRank,
  };
};

const getUser = async (userId: number) => {
  const [user] = await db
    .select({
      id: userTable.id,
      username: userTable.username,
      flairUrl: itemsTable.url,
    })
    .from(userSettingsTable)
    .innerJoin(userTable, eq(userSettingsTable.user_id, userTable.id))
    .leftJoin(itemsTable, eq(userSettingsTable.flair_id, itemsTable.id))
    .where(eq(userSettingsTable.user_id, userId));

  return user;
};

const getDragonCodes = async (userId: number) => {
  const dragons = await db
    .select({
      code: hatcheryTable.id,
    })
    .from(hatcheryTable)
    .where(eq(hatcheryTable.user_id, userId));

  return dragons.map((dragon) => dragon.code);
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
  filePath: string,
  weeklyClicks: number,
  weeklyRank: number | null,
  allTimeClicks: number,
  allTimeRank: number | null,
  dragonCodes: string[]
) {
  await shareScrollQueue.add(
    'shareScrollQueue',
    {
      user,
      filePath,
      weeklyClicks,
      weeklyRank,
      allTimeClicks,
      allTimeRank,
      dragonCodes,
    },
    {
      removeOnComplete: false,
      removeOnFail: false,
      deduplication: {
        id: `banner-${user.id}`,
        ttl: useRuntimeConfig().bannerCacheExpiry * 1000,
      },
    }
  );
}

export default defineEventHandler(async (event) => {
  const schema = z.object({
    id: z
      .string()
      .min(4)
      .endsWith('.gif')
      .transform((v) => {
        const dotIndex = v.indexOf('.');
        return dotIndex !== -1 ? v.substring(0, dotIndex) : v;
      }),
  });

  const params = await getValidatedRouterParams(event, schema.safeParseAsync);

  if (!params.data) {
    setResponseStatus(event, 404);
    return;
  }

  const user = await getUser(parseInt(params.data.id));

  if (!user) {
    setHeader(event, 'Content-Type', 'image/webp');
    return sendStream(
      event,
      createReadStream('/src/public/banner/not_found.webp')
    );
  }

  const [
    { weeklyClicks, weeklyRank, allTimeClicks, allTimeRank },
    dragonCodes,
  ] = await Promise.all([getClickStatistics(user.id), getDragonCodes(user.id)]);

  const filePath = `/cache/scroll/${user.id}.gif`;

  // todo later: it might be better to contain all of these variables
  // into a "data" object instead of threading every single one
  // through multiple funcs.
  await sendJob(
    user,
    filePath,
    weeklyClicks,
    weeklyRank,
    allTimeClicks,
    allTimeRank,
    dragonCodes
  );

  if (await exists(filePath)) {
    setHeaders(event, {
      'Content-Type': 'image/gif',
      'Cache-Control': `public, max-age=${useRuntimeConfig().bannerCacheExpiry}`,
    });

    return sendStream(event, createReadStream(filePath));
  }

  setHeaders(event, {
    'Content-Type': 'image/webp',
  });

  return sendStream(
    event,
    createReadStream('/src/public/banner/in_progress.webp')
  );
  // little thing: the url ends in .gif but this resource is a .webp.
  // it serves just fine. will the filetype discrepancy be a problem later?
});

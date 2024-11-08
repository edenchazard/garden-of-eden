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

const expiry = import.meta.dev ? 1 : 1000 * 60;

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

const getFlairUrl = async (userId: number) => {
  const [{ url }] = await db
    .select({
      url: itemsTable.url,
    })
    .from(userSettingsTable)
    .leftJoin(itemsTable, eq(userSettingsTable.flair_id, itemsTable.id))
    .where(eq(userSettingsTable.user_id, userId));

  return url;
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
  username: string,
  filePath: string,
  weeklyClicks: number,
  weeklyRank: number | null,
  allTimeClicks: number,
  allTimeRank: number | null,
  dragonCodes: string[],
  flairUrl: string | null
) {
  await shareScrollQueue.add(
    'shareScrollQueue',
    {
      username,
      filePath,
      weeklyClicks,
      weeklyRank,
      allTimeClicks,
      allTimeRank,
      dragonCodes,
      flairUrl,
    },
    {
      removeOnComplete: false,
      removeOnFail: false,
      deduplication: {
        id: `banner-${username}`,
        ttl: expiry,
      },
    }
  );
}

export default defineEventHandler(async (event) => {
  const schema = z.object({
    username: z
      .string()
      .min(2)
      .max(36)
      .transform((v) => {
        const dotIndex = v.indexOf('.');
        return dotIndex !== -1 ? v.substring(0, dotIndex) : v;
      }),
  });
  const params = await getValidatedRouterParams(event, schema.parse);

  const [user] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.username, params.username));

  if (!user) {
    setHeaders(event, {
      'Content-Type': 'image/webp',
    });
    return sendStream(
      event,
      createReadStream('/src/public/banner/not_found.webp')
    );
  }

  const [
    { weeklyClicks, weeklyRank, allTimeClicks, allTimeRank },
    dragonCodes,
    flairUrl,
  ] = await Promise.all([
    getClickStatistics(user.id),
    getDragonCodes(user.id),
    getFlairUrl(user.id),
  ]);
  const filePath = `/cache/scroll/${encodeURIComponent(params.username)}.gif`;

  // todo later: it might be better to contain all of these variables
  // into a "data" object instead of threading every single one
  // through multiple funcs.
  await sendJob(
    params.username,
    filePath,
    weeklyClicks,
    weeklyRank,
    allTimeClicks,
    allTimeRank,
    dragonCodes,
    flairUrl
  );

  if (await exists(filePath)) {
    setHeaders(event, {
      'Content-Type': 'image/gif',
      'Cache-Control': `public, max-age=${expiry / 1000}`,
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

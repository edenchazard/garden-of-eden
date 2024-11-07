import { z } from 'zod';
import { promises as fs, createReadStream } from 'fs';
import { shareScrollQueue } from '~/server/queue';
import { db } from '~/server/db';
import { and, eq, gte, sql } from 'drizzle-orm';
import { 
  itemsTable, userSettingsTable, userTable, clicksTable, clicksLeaderboardTable,
  hatcheryTable
} from '~/database/schema';
import { DateTime } from 'luxon';

const expiry = process.env.NODE_ENV === 'development'
  ? 1
  : 1000 * 60;

const getWeeklyClicks = async (userId: number) => {
  const now = DateTime.now();
  const weekStart = now.startOf('week');
  const [{ weeklyClicks }] = await db
    .select({
      weeklyClicks: sql<number>`COUNT(*)`.as('weeklyClicks')
    })
    .from(clicksTable)
    .where(and(
      eq(clicksTable.user_id, userId),
      gte(clicksTable.clicked_on, weekStart.toJSDate()),
    ));

  const [ weeklyRank ]: { rank: number }[] = await db
    .select({
      rank: clicksLeaderboardTable.rank
    })
    .from(clicksLeaderboardTable)
      .innerJoin(userTable, eq(userTable.id, clicksLeaderboardTable.user_id))
    .where(
      and(
        eq(userTable.id, userId),
        eq(clicksLeaderboardTable.leaderboard, 'weekly')
    )); 
    // referenced off of statistics/index.ts but i haven't a clue if this works.
    // at least it's not throwing
    // i should find out how to pull data from prod.

  return {
    weeklyClicks,
    weeklyRank: weeklyRank ? weeklyRank.rank : null
  }
};

const getAllTimeClicks = async (userId: number) => {
  const [{ allTimeClicks }] = await db
    .select({
      allTimeClicks: sql<number>`COUNT(*)`.as('allTimeClicks')
    })
    .from(clicksTable)
    .where(eq(clicksTable.user_id, userId));

  const [ allTimeRank ]: { rank: number }[] = await db
    .select({
      rank: clicksLeaderboardTable.rank
    })
    .from(clicksLeaderboardTable)
      .innerJoin(userTable, eq(userTable.id, clicksLeaderboardTable.user_id))
    .where(eq(userTable.id, userId));

  return {
    allTimeClicks,
    allTimeRank: allTimeRank ? allTimeRank.rank : null
  }
};

const getFlairUrl = async (userId: number) => {
  const [{ url }] = await db
    .select({
      url: itemsTable.url
    })
    .from(userTable)
      .innerJoin(userSettingsTable, eq(userTable.id, userSettingsTable.user_id))
      .leftJoin(itemsTable, eq(userSettingsTable.flair_id, itemsTable.id))
    .where(eq(userTable.id, userId));
  return url
};

const getDragonCodes = async (userId: number) => {
  const dragons = await db
    .select({
      code: hatcheryTable.id
    })
    .from(hatcheryTable)
    .where(eq(hatcheryTable.user_id, userId));

  return dragons.map(dragon => dragon.code);
}

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
      username, filePath, 
      weeklyClicks, weeklyRank,
      allTimeClicks, allTimeRank,
      dragonCodes,
      flairUrl
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
    return sendStream(event, createReadStream(
      '/src/public/banner/not_found.webp'
    ));
  }

  const [
    { weeklyClicks, weeklyRank },
    { allTimeClicks, allTimeRank },
    dragonCodes,
    flairUrl
  ] = await Promise.all([
    getWeeklyClicks(user.id),
    getAllTimeClicks(user.id),
    getDragonCodes(user.id),
    getFlairUrl(user.id)
  ])

  const filePath = `/cache/scroll/${encodeURIComponent(params.username)}.gif`;

  // todo later: it might be better to contain all of these variables
  // into a "data" object instead of threading every single one
  // through multiple funcs.
  await sendJob(
    params.username, filePath, 
    weeklyClicks, weeklyRank,
    allTimeClicks, allTimeRank,
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

  return sendStream(event, createReadStream(
    '/src/public/banner/in_progress.webp'
  ));
  // little thing: the url ends in .gif but this resource is a .webp.
  // it serves just fine. will the filetype discrepancy be a problem later?
});

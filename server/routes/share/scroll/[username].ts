import { z } from 'zod';
import { promises as fs, createReadStream } from 'fs';
import { shareScrollQueue } from '~/server/queue';
import { db } from '~/server/db';
import { and, eq, gte, sql } from 'drizzle-orm';
import { 
  itemsTable, userSettingsTable, userTable, clicksTable, clicksLeaderboardTable
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
  return weeklyClicks
};

const getAllTimeClicks = async (userId: number) => {
  const [{ allTimeClicks }] = await db
    .select({
      allTimeClicks: sql<number>`COUNT(*)`.as('allTimeClicks')
    })
    .from(clicksTable)
    .where(eq(clicksTable.user_id, userId));
  return allTimeClicks
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
  allTimeClicks: number,
  flairUrl: string | null
) {
  await shareScrollQueue.add(
    'shareScrollQueue',
    {
      username,
      filePath,
      weeklyClicks,
      allTimeClicks,
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
    // todo: banner
    return 'no garden account exists with this username, sign in?'
  }

  const [
    weeklyClicks,
    allTimeClicks,
    flairUrl
  ] = await Promise.all([
    getWeeklyClicks(user.id),
    getAllTimeClicks(user.id),
    getFlairUrl(user.id)
  ])

  const filePath = `/cache/scroll/${encodeURIComponent(params.username)}.gif`;

  await sendJob(
    params.username, filePath, weeklyClicks, allTimeClicks, flairUrl
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

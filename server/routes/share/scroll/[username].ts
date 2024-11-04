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

  let stats: {
    weeklyClicks: number,
    allTimeClicks: number,
    flairUrl: null | string
  } = {
    weeklyClicks: 0,
    allTimeClicks: 0,
    flairUrl: null
  }

  await Promise.all([
    async () => {
      const now = DateTime.now();
      const weekStart = now.startOf('week');
      const [{ weeklyClicks }] = await db
        .select({
          weeklyClicks: sql<number>`COUNT(*)`.as('weeklyClicks')
        })
        .from(clicksTable)
        .where(and(
          eq(clicksTable.user_id, user.id),
          gte(clicksTable.clicked_on, weekStart.toJSDate()),
        ));
      stats.weeklyClicks = weeklyClicks
    },
    async () => {
      const [{ allTimeClicks }] = await db
        .select({
          allTimeClicks: sql<number>`COUNT(*)`.as('allTimeClicks')
        })
        .from(clicksTable)
        .where(eq(clicksTable.user_id, user.id));
      stats.allTimeClicks = allTimeClicks
    },
    async () => {
      const [{ url }] = await db
        .select({
          url: itemsTable.url
        })
        .from(userTable)
          .innerJoin(userSettingsTable, eq(userTable.id, userSettingsTable.user_id))
          .leftJoin(itemsTable, eq(userSettingsTable.flair_id, itemsTable.id))
        .where(eq(userTable.id, user.id));
      stats.flairUrl = url
    }
  ])

  const filePath = `/cache/scroll/${encodeURIComponent(params.username)}.gif`;

  await sendJob(
    params.username, filePath, stats.weeklyClicks, stats.allTimeClicks, stats.flairUrl
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

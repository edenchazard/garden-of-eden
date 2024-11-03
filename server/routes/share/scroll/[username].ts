import { z } from 'zod';
import { promises as fs, createReadStream } from 'fs';
import { shareScrollQueue } from '~/server/queue';
import { db } from '~/server/db';
import { and, eq, gte, sql } from 'drizzle-orm';
import { 
  itemsTable, userSettingsTable, userTable, clicksTable, clicksLeaderboardTable
} from '~/database/schema';
import { DateTime } from 'luxon';

//const expiry = 1000 * 60;
const expiry = 1;

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

  // first, does user exist?
  const userId = await db
  // one could shorten this to `[{ id }]` for convenience like i saw you do elsewhere
  // but this could throw an error if a user can't actually be found.
  // or maybe we can get around that by wrapping all this db-touching in a try/catch?
    .select({
      id: userTable.id,
    })
    .from(userTable)
    .where(eq(userTable.username, params.username));

  if (userId.length === 0) {
    // todo: banner
    return 'no garden account exists with this username, sign in?'
  }

  // second, get user clicks
  const now = DateTime.now();
  const weekStart = now.startOf('week');
  const { length: weeklyClicks } = await db
    .select()
    .from(clicksTable)
    .where(
      and(
        gte(clicksTable.clicked_on, weekStart.toJSDate()),
        eq(clicksTable.user_id, userId[0].id)
      )
    );
  const { length: allTimeClicks } = await db
    .select()
    .from(clicksTable)
    .where(
      eq(clicksTable.user_id, userId[0].id)
    )
  // these are almost the same query, how do i keep this a little drier?

  // get flair
  const [{ url: flairUrl }] = await db
    .select({
      url: itemsTable.url
    })
    .from(userTable)
      .leftJoin(userSettingsTable, eq(userTable.id, userSettingsTable.user_id))
      .leftJoin(itemsTable, eq(userSettingsTable.flair_id, itemsTable.id))
    .where(eq(userTable.id, userId[0].id));

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

  // todo: what if banner generation fails (nonexistent scrollname)?
  // i want to render the 'scroll not found' banner in that case
  // but when and where to trigger that...?

  setHeaders(event, {
    'Content-Type': 'image/webp',
  });

  return sendStream(event, createReadStream(
    '/src/public/banner/in_progress.webp'
  ));
  // little thing: the url ends in .gif but this resource is a .webp.
  // it serves just fine. will the filetype discrepancy be a problem later?
});

import { defineCronHandler } from '#nuxt/cron';
import Parser from 'rss-parser';
import {
  dragCaveFeedTable,
  userNotificationsTable,
  userSettingsTable,
  userTable,
} from '~/database/schema';
import { db } from '../db';
import chunkArray from '~/utils/chunkArray';
import { DateTime } from 'luxon';
import { eq } from 'drizzle-orm';

const parser = new Parser<
  unknown,
  {
    title: string;
    guid: number;
    link: string;
    pubDate: string;
  }
>();

export default defineCronHandler('everyMinute', async () => {
  const feed = await parser.parseURL(
    'https://forums.dragcave.net/forum/1-news.xml'
  );

  const searchTerms = [
    // '02-14 - Happy Valentine',
    "02-08 - Valentine's Begins",
    // '12-25 - Happy Holidays',
    '12-19 - Holiday Event Begins',
    // '10-31 - Happy Halloween',
    '10-25 - Halloween Event Begins',
    'Dragon Release',
    '05-21 - Dragon Cave', // Birthday
  ].map((term) => term.toLowerCase().trim());

  const latestRelease = feed.items.find((item) =>
    searchTerms.some((term) => item.title.toLowerCase().includes(term))
  );

  const matchedSearchTerm = searchTerms.find((term) =>
    latestRelease?.title.toLowerCase().includes(term)
  );

  if (!latestRelease || !matchedSearchTerm || !latestRelease.guid) {
    return;
  }

  const now = DateTime.fromRFC2822(latestRelease.pubDate).startOf('day');

  try {
    await db.transaction(async (tx) => {
      await tx.insert(dragCaveFeedTable).values({
        guid: latestRelease.guid,
        link: latestRelease.link,
      });

      // Only fetch users that have newReleaseAlerts enabled.
      const users = await tx
        .select({
          id: userTable.id,
        })
        .from(userTable)
        .where(eq(userSettingsTable.newReleaseAlerts, true))
        .innerJoin(
          userSettingsTable,
          eq(userTable.id, userSettingsTable.user_id)
        );

      const validUntil = (() => {
        if (
          ['dragon release', '05-21 - dragon cave'].includes(matchedSearchTerm)
        ) {
          return now.plus({ days: 7 });
        }
        // Event periods should be two weeks.
        return now.plus({ days: 14 });
      })();

      const notificationChunks = chunkArray(
        users.map((user) => ({
          userId: user.id,
          guid: latestRelease.guid,
          type: 'dragcave' as const,
          content: `Garden traffic is currently higher than usual due to an ongoing <a href="${latestRelease.link}">Dragon Cave event or new release</a>. Dragons are more likely to become sick.`,
          validUntil: validUntil.toJSDate(),
        })),
        500
      );

      await Promise.all(
        notificationChunks.map((chunks) =>
          tx.insert(userNotificationsTable).values(chunks)
        )
      );
    });
  } catch (_) {
    _;
  }
});

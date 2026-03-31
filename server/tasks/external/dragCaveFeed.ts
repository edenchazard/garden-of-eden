import Parser from 'rss-parser';
import {
  dragCaveFeedTable,
  userNotificationTable,
  usersSettingsTable,
  usersTable,
} from '~~/database/schema';
import { db } from '~~/server/db';
import chunkArray from '~/utils/chunkArray';
import { DateTime } from 'luxon';
import { eq } from 'drizzle-orm';

export default defineTask({
  meta: {
    description:
      'Check the Dragon Cave RSS feed for new releases and events, and notify users.',
  },
  async run() {
    const parser = new Parser<
      unknown,
      {
        title: string;
        guid: number;
        link: string;
        pubDate: string;
      }
    >();

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

    if (!matchedSearchTerm || !latestRelease?.guid) {
      return {
        result: 'success',
      };
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
            id: usersTable.id,
          })
          .from(usersTable)
          .where(eq(usersSettingsTable.newReleaseAlerts, true))
          .innerJoin(
            usersSettingsTable,
            eq(usersTable.id, usersSettingsTable.userId)
          );

        const validUntil = (() => {
          if (
            ['dragon release', '05-21 - dragon cave'].includes(
              matchedSearchTerm
            )
          ) {
            return now.plus({ days: 7 });
          }
          // Event periods should be two weeks.
          return now.plus({ days: 14 });
        })();

        if (DateTime.now() > validUntil) {
          // If the validUntil date is in the past, do not send notifications.
          return {
            result: 'success',
          };
        }

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
            tx.insert(userNotificationTable).values(chunks)
          )
        );
      });
    } catch (_) {
      _;
    }

    return {
      result: 'success',
    };
  },
});

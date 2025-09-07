import { itemsTable } from '~/database/schema';
import { db } from '~/server/db';
import { and, sql, eq, isNotNull, lt } from 'drizzle-orm';
import { DateTime } from 'luxon';

export default defineTask({
  meta: {
    description:
      'Reset expired limited-time flairs to next year based on release_date and days_available.',
  },
  async run() {
    const expiredFlairs = await db
      .select({
        id: itemsTable.id,
        releaseDate: sql<string>`${itemsTable.releaseDate}`,
        daysAvailable: sql<number>`${itemsTable.daysAvailable}`,
        availableFrom: itemsTable.availableFrom,
        availableTo: itemsTable.availableTo,
        name: itemsTable.name,
      })
      .from(itemsTable)
      .where(
        and(
          eq(itemsTable.category, 'flair'),
          isNotNull(itemsTable.availableFrom),
          isNotNull(itemsTable.availableTo),
          isNotNull(itemsTable.releaseDate),
          isNotNull(itemsTable.daysAvailable),
          lt(itemsTable.availableTo, sql`NOW()`)
        )
      );

    const currentDate = DateTime.now();

    await db.transaction(async (tx) => {
      expiredFlairs.forEach(async (flair) => {
        const releaseDate = DateTime.fromSQL(flair.releaseDate);

        // Find the next year when this flair should be available
        const nextYear =
          currentDate < releaseDate.set({ year: currentDate.year })
            ? currentDate.year
            : currentDate.year + 1;

        const newAvailableFrom = releaseDate.set({ year: nextYear });

        const newAvailableTo = newAvailableFrom.plus({
          days: flair.daysAvailable,
        });

        await tx
          .update(itemsTable)
          .set({
            availableFrom: newAvailableFrom.toSQL({ includeOffset: true }),
            availableTo: newAvailableTo.toSQL({ includeOffset: true }),
          })
          .where(eq(itemsTable.id, flair.id));
      });
    });

    return {
      result: 'success',
    };
  },
});

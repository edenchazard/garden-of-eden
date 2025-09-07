import { itemsTable } from '~/database/schema';
import { db } from '~/server/db';
import { and, sql, eq, isNotNull, lt } from 'drizzle-orm';

export default defineTask({
  meta: {
    description:
      'Reset expired limited-time flairs to next year based on release_date and days_available.',
  },
  async run() {
    // Reset expired limited-time flairs to next year
    // Find flairs that have expired (available_to < NOW()) and have both available_from and available_to set
    const expiredFlairs = await db
      .select({
        id: itemsTable.id,
        releaseDate: itemsTable.releaseDate,
        daysAvailable: itemsTable.daysAvailable,
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

    const updatedFlairs: string[] = [];

    for (const flair of expiredFlairs) {
      if (!flair.releaseDate || !flair.daysAvailable) continue;

      // Calculate the next release year based on current date and release date
      const currentDate = new Date();
      const releaseDate = new Date(flair.releaseDate);
      
      // Find the next year when this flair should be available
      let nextYear = currentDate.getFullYear();
      if (currentDate.getMonth() < releaseDate.getMonth() || 
          (currentDate.getMonth() === releaseDate.getMonth() && currentDate.getDate() < releaseDate.getDate())) {
        // If we haven't reached this year's release date yet, use this year
        nextYear = currentDate.getFullYear();
      } else {
        // Otherwise, use next year
        nextYear = currentDate.getFullYear() + 1;
      }

      // Create new available_from date
      const newAvailableFrom = new Date(releaseDate);
      newAvailableFrom.setFullYear(nextYear);

      // Create new available_to date by adding days_available
      const newAvailableTo = new Date(newAvailableFrom);
      newAvailableTo.setDate(newAvailableTo.getDate() + flair.daysAvailable);

      // Update the flair with new dates
      await db
        .update(itemsTable)
        .set({
          availableFrom: newAvailableFrom.toISOString().slice(0, 19).replace('T', ' '),
          availableTo: newAvailableTo.toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(eq(itemsTable.id, flair.id));

      updatedFlairs.push(flair.name);
    }

    return {
      result: 'success',
      expiredFlairsUpdated: expiredFlairs.length,
      updatedFlairs,
    };
  },
});
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { clicksTable, hatcheryTable } from '~~/database/schema';
import { db } from '~~/server/db';
import { getToken } from '#auth';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  const startOfToday = new Date();
  startOfToday.setDate(startOfToday.getDate() - 1);

  const personalStats = (
    await Promise.all([
      db
        .select({ clicked24: sql<number>`COUNT(*)`.as('clicked_24') })
        .from(clicksTable)
        .where(
          and(
            eq(clicksTable.userId, token.userId),
            gt(clicksTable.clickedOn, startOfToday)
          )
        ),
      db
        .select({ notClicked: sql<number>`COUNT(*)`.as('not_clicked') })
        .from(hatcheryTable)
        .leftJoin(
          clicksTable,
          and(
            eq(hatcheryTable.id, clicksTable.hatcheryId),
            eq(clicksTable.userId, token.userId)
          )
        )
        .where(
          and(
            isNull(clicksTable.userId),
            or(
              eq(hatcheryTable.inGarden, true),
              eq(hatcheryTable.inSeedTray, true)
            )
          )
        ),
    ])
  )
    .flat()
    .reduce<{ clicked24: number; notClicked: number }>(
      (acc, val) => ({ ...acc, ...val }),
      {
        clicked24: 0,
        notClicked: 0,
      }
    );

  return personalStats;
});

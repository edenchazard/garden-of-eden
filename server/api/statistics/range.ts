import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { z } from 'zod';
import { recordingsTable } from '~/database/schema';
import { db } from '~/server/db';

const querySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  recordType: z.enum(['total_dragons', 'total_scrolls', 'clean_up', 'user_count', 'api_request']).optional(),
});

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse);
  
  // Default to last 24 hours if no dates provided
  const startDate = query.start 
    ? DateTime.fromISO(query.start)
    : DateTime.now().minus({ hours: 24 });
  const endDate = query.end 
    ? DateTime.fromISO(query.end)
    : DateTime.now();

  // Build the where conditions
  const whereConditions = [
    gte(recordingsTable.recordedOn, startDate.toSQL()!),
    lte(recordingsTable.recordedOn, endDate.toSQL()!),
  ];

  if (query.recordType) {
    whereConditions.push(eq(recordingsTable.recordType, query.recordType));
  }

  const data = await db
    .select()
    .from(recordingsTable)
    .where(and(...whereConditions))
    .orderBy(asc(recordingsTable.recordedOn));

  // Group by record type for easier consumption
  const grouped = data.reduce((acc, record) => {
    if (!acc[record.recordType]) {
      acc[record.recordType] = [];
    }
    acc[record.recordType].push(record);
    return acc;
  }, {} as Record<string, typeof data>);

  return {
    startDate: startDate.toISO(),
    endDate: endDate.toISO(),
    data: grouped,
  };
});
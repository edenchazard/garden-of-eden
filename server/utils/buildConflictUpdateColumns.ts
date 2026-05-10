import { getTableColumns, sql, type SQL } from 'drizzle-orm';
import type { MySqlTable } from 'drizzle-orm/mysql-core';

export default function buildConflictUpdateColumns<
  T extends MySqlTable,
  Q extends keyof T['_']['columns'],
>(table: T, columns: Q[]) {
  const cls = getTableColumns(table);
  return columns.reduce(
    (acc, column) => {
      acc[column] = sql`values(${cls[column]})`;
      return acc;
    },
    {} as Record<Q, SQL>
  );
}

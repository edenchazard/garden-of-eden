import { caretakerInviteTable } from '~~/database/schema';
import { db } from '~~/server/db';
import { lt, sql } from 'drizzle-orm';

export default defineTask({
  meta: {
    description: 'Delete invitation links that expired more than 24 hours ago.',
  },
  async run() {
    await db
      .delete(caretakerInviteTable)
      .where(lt(caretakerInviteTable.expiresAt, sql`NOW() - INTERVAL 24 HOUR`));

    return {
      result: 'success',
    };
  },
});

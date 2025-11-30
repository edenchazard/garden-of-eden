import 'next-auth';
import 'next-auth/jwt';
import type { usersTable } from '~~/database/schema';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: number;
      username: string;
      role: UserRole;
      settings: UserSettings;
      money: typeof usersTable.$inferSelect.money;
      flair: Pick<Item, 'id' | 'name' | 'url'> | null;
      apiBlocked: typeof usersTable.$inferSelect.apiBlocked;
    };
  }

  interface User {
    username: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string;
    sessionToken?: string;
    userId: number;
    lastActivityTimestamp?: number;
  }
}

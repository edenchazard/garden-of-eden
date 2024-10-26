import 'next-auth';
import 'next-auth/jwt';
import type { userTable } from '~/database/schema';

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string;
    sessionToken?: string;
    userId: number;
    lastActivityTimestamp?: number;
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      username: string;
      role: UserRole;
      settings: UserSettings;
      money: typeof userTable.$inferSelect.money;
      flair: Pick<Item, 'id' | 'name' | 'url'> | null;
    };
  }

  interface User {
    username: string;
  }
}

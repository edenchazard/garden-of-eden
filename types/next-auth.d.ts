import 'next-auth';
import 'next-auth/jwt';

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
    };
  }

  interface User {
    username: string;
  }
}

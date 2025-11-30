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

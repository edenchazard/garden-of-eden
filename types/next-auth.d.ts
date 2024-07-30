import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    sessionToken?: string;
    userId?: number;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      username: string;
      role: UserRole;
    };
  }

  interface User {
    username: string;
  }
}
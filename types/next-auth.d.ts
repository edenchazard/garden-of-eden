import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    sessionToken?: string;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      username: string;
    };
  }

  interface User {
    username: string;
  }
}

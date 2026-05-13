import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      designation?: string;
    } & DefaultSession["user"];
  }
}

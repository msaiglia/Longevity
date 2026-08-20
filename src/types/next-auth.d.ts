import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "athlete" | "admin";
      status: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: "athlete" | "admin";
    status: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "athlete" | "admin";
    status: string;
  }
}

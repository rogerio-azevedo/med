import NextAuth, { DefaultSession } from "next-auth";

// Tipagem estendida para User
declare module "next-auth" {
    interface User {
        role?: string;
    }

    interface Session {
        user: {
            role?: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string;
    }
}

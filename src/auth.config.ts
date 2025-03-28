import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserByEmail } from "./data/user";
import bcrypt from 'bcryptjs';
import Google from "next-auth/providers/google";

export default {
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET
        }),
        Credentials({
            async authorize(credentials: Record<string, any>) {
                try {
                    if (!credentials?.email) {
                        return null;
                    }

                    const user = await getUserByEmail(credentials.email);
                    if (!user) return null;

                    // Verification sonrası direkt user'ı döndür
                    return user;

                } catch {
                    return null;
                }
            }
        })
    ],
} satisfies NextAuthConfig
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { authConfig } from "./auth.config";
import { accounts, sessions, users, verificationTokens, clinicUsers, patients, clinicPatients, doctors } from "@/db/schema";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    session: { strategy: "jwt" },
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    const user = await db.query.users.findFirst({
                        where: eq(users.email, email),
                    });

                    if (!user) return null;
                    if (!user.password) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);

                    if (passwordsMatch) {
                        let clinicId: string | undefined;
                        let doctorId: string | undefined;
                        let clinicRole: string | undefined;

                        if (user.role === "patient") {
                            const patient = await db.query.patients.findFirst({
                                where: eq(patients.userId, user.id),
                            });
                            if (patient) {
                                const clinicLink = await db.query.clinicPatients.findFirst({
                                    where: eq(clinicPatients.patientId, patient.id),
                                });
                                clinicId = clinicLink?.clinicId;
                            }
                        } else {
                            const clinicLink = await db.query.clinicUsers.findFirst({
                                where: eq(clinicUsers.userId, user.id),
                            });
                            clinicId = clinicLink?.clinicId;
                            clinicRole = clinicLink?.role ?? undefined;

                            if (user.role === "doctor") {
                                const doctor = await db.query.doctors.findFirst({
                                    where: eq(doctors.userId, user.id),
                                });
                                doctorId = doctor?.id;
                            }
                        }

                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            clinicId: clinicId,
                            doctorId: doctorId,
                            clinicRole,
                        };
                    }
                }

                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.clinicId = (user as any).clinicId;
                token.doctorId = (user as any).doctorId;
                token.clinicRole = (user as any).clinicRole;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token && session.user) {
                session.user.role = token.role as string | undefined;
                session.user.clinicId = token.clinicId as string | undefined;
                session.user.doctorId = token.doctorId as string | undefined;
                session.user.clinicRole = token.clinicRole as string | undefined;
            }
            return session;
        },
    },
});


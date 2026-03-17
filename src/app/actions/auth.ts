"use server";

import { signIn } from "@/auth";
import { db } from "@/db";
import { inviteLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { z } from "zod";
import { registerUser } from "@/services/auth";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export async function login(prevState: unknown, formData: FormData) {
    const data = Object.fromEntries(formData);
    const parsed = loginSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Campos inválidos" };
    }

    const { email, password } = parsed.data;

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { 
                        error: "Credenciais inválidas.",
                        email,
                        password
                    };
                default:
                    return { 
                        error: "Algo deu errado.",
                        email,
                        password
                    };
            }
        }
        throw error;
    }
}

export async function getInvite(code: string) {
    if (!code) return null;

    const invite = await db.query.inviteLinks.findFirst({
        where: eq(inviteLinks.code, code),
        with: {
            clinic: true,
        },
    });

    if (!invite) return null;

    return {
        ...invite,
        clinicName: invite.clinic?.name,
    };
}

export async function register(prevState: unknown, formData: FormData) {
    const specialtyIdsRaw = formData.getAll("specialtyIds");
    const data = {
        ...Object.fromEntries(formData),
        specialtyIds: specialtyIdsRaw.length > 0 ? specialtyIdsRaw : undefined,
    };

    const parsed = registerSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: z.flattenError(parsed.error) };
    }

    const result = await registerUser(parsed.data);

    if (!result.success) {
        return { error: result.error };
    }

    return { success: true };
}

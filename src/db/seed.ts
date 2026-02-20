import "dotenv/config";
import { db } from "./index";
import { users } from "./schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Seeding database...");

    const email = "admin@med.com";
    const password = "password123";
    const hashedPassword = await hash(password, 10);

    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        console.log("SuperAdmin user already exists.");
        await db.update(users)
            .set({ role: "super_admin", password: hashedPassword })
            .where(eq(users.email, email));
        console.log("SuperAdmin user updated.");
    } else {
        await db.insert(users).values({
            email,
            password: hashedPassword,
            name: "Super Admin",
            role: "super_admin",
            emailVerified: new Date(),
        });
        console.log("SuperAdmin user created.");
    }

    console.log("Seeding complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});

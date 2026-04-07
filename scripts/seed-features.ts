import { config } from "dotenv";
config({ path: ".env" });

import { db } from "../src/db";
import { features } from "../src/db/schema";
import { ALL_FEATURES } from "../src/lib/features";

async function main() {
    console.log("Seeding features...");
    for (const feature of ALL_FEATURES) {
        await db
            .insert(features)
            .values({
                slug: feature.slug,
                name: feature.name,
                description: feature.description,
            })
            .onConflictDoUpdate({
                target: features.slug,
                set: {
                    name: feature.name,
                    description: feature.description,
                },
            });
        console.log(`✓ Seeded feature: ${feature.name} (${feature.slug})`);
    }
    console.log("Done!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Error seeding features:", err);
    process.exit(1);
});

import { execFileSync } from "node:child_process";
import { normalizeJournalOrder } from "./drizzle-migration-utils.mjs";

execFileSync("pnpm", ["exec", "drizzle-kit", "generate"], { stdio: "inherit" });

const changes = normalizeJournalOrder();

if (changes.length === 0) {
    console.log("Journal de migrations já estava em ordem.");
} else {
    console.log("Journal de migrations normalizado:");
    for (const change of changes) {
        console.log(
            `- ${change.tag}: ${change.oldWhen} -> ${change.newWhen} (após ${change.previousTag})`
        );
    }
}

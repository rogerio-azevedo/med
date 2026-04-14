import process from "node:process";
import { auditMigrations, getJournalOrderIssues, getLocalMigrations } from "./drizzle-migration-utils.mjs";

function printList(title, items, formatter) {
    if (!items.length) {
        return;
    }

    console.error(`\n${title}`);
    for (const item of items) {
        console.error(`- ${formatter(item)}`);
    }
}

async function main() {
    const local = getLocalMigrations();
    const localOrderIssues = getJournalOrderIssues(local);
    const allowMissingOnRemote = process.argv.includes("--allow-missing-remote");

    if (process.argv.includes("--local-only")) {
        if (!localOrderIssues.length) {
            console.log("Journal de migrations OK.");
            return;
        }

        printList(
            "Journal fora de ordem:",
            localOrderIssues,
            (item) =>
                `${item.tag} (${item.when}) <= ${item.previousTag} (${item.previousWhen})`
        );
        process.exit(1);
    }

    const report = await auditMigrations();
    const hasIssues =
        report.journalOrderIssues.length > 0 ||
        (!allowMissingOnRemote && report.missingOnRemote.length > 0) ||
        report.remoteOnly.length > 0 ||
        report.timestampMismatch.length > 0;

    if (!hasIssues) {
        console.log("Migrations locais e remotas estão sincronizadas.");
        return;
    }

    printList(
        "Journal fora de ordem:",
        report.journalOrderIssues,
        (item) =>
            `${item.tag} (${item.when}) <= ${item.previousTag} (${item.previousWhen})`
    );
    printList(
        "Migrations locais ausentes no banco:",
        report.missingOnRemote,
        (item) => `${item.tag} [idx=${item.idx}]`
    );
    printList(
        "Hashes remotos sem equivalente local:",
        report.remoteOnly,
        (item) => `id=${item.id} created_at=${item.createdAt} hash=${item.hash}`
    );
    printList(
        "Migrations com timestamp divergente:",
        report.timestampMismatch,
        (item) => `${item.tag}: local=${item.localWhen} remote=${item.remoteCreatedAt}`
    );

    process.exit(1);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

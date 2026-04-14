import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

loadEnv();

const rootDir = process.cwd();
const journalPath = path.join(rootDir, "drizzle", "meta", "_journal.json");
const drizzleDir = path.join(rootDir, "drizzle");

export function loadJournal() {
    return JSON.parse(fs.readFileSync(journalPath, "utf8"));
}

export function saveJournal(journal) {
    fs.writeFileSync(journalPath, `${JSON.stringify(journal, null, 2)}\n`);
}

export function getLocalMigrations() {
    const journal = loadJournal();

    return journal.entries.map((entry) => {
        const fileName = `${entry.tag}.sql`;
        const filePath = path.join(drizzleDir, fileName);
        const hash = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

        return {
            idx: entry.idx,
            tag: entry.tag,
            when: entry.when,
            fileName,
            filePath,
            hash,
        };
    });
}

export function getJournalOrderIssues(entries) {
    const issues = [];

    for (let index = 1; index < entries.length; index += 1) {
        const previous = entries[index - 1];
        const current = entries[index];

        if (current.when <= previous.when) {
            issues.push({
                tag: current.tag,
                idx: current.idx,
                when: current.when,
                previousTag: previous.tag,
                previousWhen: previous.when,
            });
        }
    }

    return issues;
}

export function normalizeJournalOrder() {
    const journal = loadJournal();
    const changes = [];

    for (let index = 1; index < journal.entries.length; index += 1) {
        const previous = journal.entries[index - 1];
        const current = journal.entries[index];

        if (current.when <= previous.when) {
            const oldWhen = current.when;
            current.when = previous.when + 1;

            changes.push({
                tag: current.tag,
                idx: current.idx,
                oldWhen,
                newWhen: current.when,
                previousTag: previous.tag,
                previousWhen: previous.when,
            });
        }
    }

    if (changes.length > 0) {
        saveJournal(journal);
    }

    return changes;
}

export async function getRemoteMigrations() {
    const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL_UNPOOLED ou DATABASE_URL não configurada.");
    }

    const sql = postgres(connectionString, { ssl: "require" });

    try {
        const rows = await sql.unsafe(
            "select id, hash, created_at from drizzle.__drizzle_migrations order by created_at asc, id asc"
        );

        return rows.map((row) => ({
            id: Number(row.id),
            hash: String(row.hash),
            createdAt: Number(row.created_at),
        }));
    } finally {
        await sql.end();
    }
}

export async function auditMigrations() {
    const local = getLocalMigrations();
    const localByHash = new Map(local.map((entry) => [entry.hash, entry]));
    const remote = await getRemoteMigrations();
    const remoteByHash = new Map(remote.map((entry) => [entry.hash, entry]));

    const missingOnRemote = local
        .filter((entry) => !remoteByHash.has(entry.hash))
        .map((entry) => ({
            tag: entry.tag,
            idx: entry.idx,
            when: entry.when,
            hash: entry.hash,
        }));

    const remoteOnly = remote
        .filter((entry) => !localByHash.has(entry.hash))
        .map((entry) => ({
            id: entry.id,
            createdAt: entry.createdAt,
            hash: entry.hash,
        }));

    const timestampMismatch = local
        .filter((entry) => remoteByHash.has(entry.hash))
        .map((entry) => ({
            tag: entry.tag,
            localWhen: entry.when,
            remoteCreatedAt: remoteByHash.get(entry.hash).createdAt,
        }))
        .filter((entry) => entry.localWhen !== entry.remoteCreatedAt);

    return {
        localCount: local.length,
        remoteCount: remote.length,
        journalOrderIssues: getJournalOrderIssues(local),
        missingOnRemote,
        remoteOnly,
        timestampMismatch,
    };
}

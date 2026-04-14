import { execFileSync } from "node:child_process";

execFileSync("node", ["scripts/check-drizzle-migrations.mjs", "--local-only"], {
    stdio: "inherit",
});

try {
    execFileSync("node", ["scripts/check-drizzle-migrations.mjs", "--allow-missing-remote"], {
        stdio: "inherit",
    });
} catch {
    console.error(
        "\nDrift detectado entre migrations locais e banco remoto. Reconciliar antes de executar novas migrations."
    );
    process.exit(1);
}

execFileSync("pnpm", ["exec", "drizzle-kit", "migrate"], { stdio: "inherit" });

execFileSync("node", ["scripts/check-drizzle-migrations.mjs"], { stdio: "inherit" });

import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
    // Atualiza por nome exato (case-insensitive) para evitar colisão entre typos similares
    const slugMap = [
        { slug: "consultation",       pattern: "Consulta"       },
        { slug: "video_consultation", pattern: "Video Consulta" },
        { slug: "exam",               pattern: "Exame"          },
        { slug: "surgery",            pattern: "Cirurgia"       },
    ];

    for (const { slug, pattern } of slugMap) {
        const result = await sql`
            UPDATE service_types
            SET slug = ${slug}
            WHERE LOWER(name) = LOWER(${pattern})
              AND slug IS NULL
            RETURNING id, name, slug
        `;
        if (result.length > 0) {
            console.log(`✓ slug="${slug}" → ${result.map(r => `"${r.name}"`).join(", ")}`);
        } else {
            console.log(`– slug="${slug}" → sem alterações (já definido ou nome não encontrado)`);
        }
    }

    // Estado final
    const all = await sql`
        SELECT name, slug, workflow, is_active
        FROM service_types
        ORDER BY name
    `;
    console.log("\n=== Estado final ===");
    for (const row of all) {
        console.log(`  ${String(row.name).padEnd(25)} slug=${String(row.slug ?? "NULL").padEnd(22)} workflow=${row.workflow}`);
    }

    await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });

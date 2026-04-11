import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env" });

async function check() {
    const sql = postgres(process.env.DATABASE_URL!);
    try {
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'doctors';
        `;
        console.log("Columns in 'doctors' table:");
        console.table(columns);
    } catch (e) {
        console.error("Error checking columns:", e);
    } finally {
        await sql.end();
    }
}

check();

import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("DATABASE_URL or POSTGRES_URL is required.");
  process.exit(1);
}

const sql = postgres(connectionString, {
  max: 1,
  ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
});

const migrationDir = path.resolve(process.cwd(), "database/migrations");
const files = (await fs.readdir(migrationDir))
  .filter((file) => /^\d+_.*\.sql$/.test(file))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

try {
  await sql.begin(async (tx) => {
    await tx.unsafe(`
      CREATE TABLE IF NOT EXISTS ycm_schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await tx.unsafe("SELECT pg_advisory_xact_lock(hashtext('ycm-one-schema-migrations'))");
  });

  for (const file of files) {
    const existing = await sql`SELECT filename FROM ycm_schema_migrations WHERE filename = ${file}`;
    if (existing.length) {
      console.log(`SKIP ${file}`);
      continue;
    }

    const migration = await fs.readFile(path.join(migrationDir, file), "utf8");
    console.log(`APPLY ${file}`);
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(migration);
        await tx`INSERT INTO ycm_schema_migrations (filename) VALUES (${file})`;
      });
    } catch (error) {
      console.error(`FAILED ${file}`);
      throw error;
    }
  }

  console.log("YCM database migrations complete.");
} finally {
  await sql.end({ timeout: 5 });
}

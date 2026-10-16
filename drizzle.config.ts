import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

const databasePath = process.env.CABBOOK_DATABASE_PATH ?? "./data/cabbook.sqlite";
if (databasePath !== ":memory:") mkdirSync(dirname(resolve(databasePath)), { recursive: true });

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/server/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databasePath,
  },
});

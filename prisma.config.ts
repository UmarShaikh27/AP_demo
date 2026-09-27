import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // ORM section (required by Prisma 8)
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  // Datasource for migrations/db commands
  datasource: {
    url: process.env["TURSO_DATABASE_URL"] || process.env["DATABASE_URL"],
  },
});

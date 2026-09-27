import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// Auto-detect: use Turso if TURSO_DATABASE_URL is set, otherwise local SQLite
const isTurso = !!process.env.TURSO_DATABASE_URL;

const adapter = isTurso
  ? new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  : new PrismaLibSql({
      url: `file:${path.resolve(process.cwd(), "dev.db")}`,
    });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

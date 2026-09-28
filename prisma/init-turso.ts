import { createClient } from "@libsql/client";
import "dotenv/config";

async function initTurso() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("TURSO_DATABASE_URL is not set in .env");
    process.exit(1);
  }

  console.log(`Connecting to Turso database: ${url}...`);

  const client = createClient({ url, authToken });

  const schemaStatements = [
    // ── Core tables (idempotent) ─────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS "Account" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "account_holder_name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "account_status" TEXT NOT NULL DEFAULT 'active'
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Account_email_key" ON "Account"("email");`,

    `CREATE TABLE IF NOT EXISTS "Line" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "account_id" INTEGER NOT NULL,
      "phone_number" TEXT NOT NULL,
      "iccid" TEXT NOT NULL,
      "imei" TEXT NOT NULL DEFAULT '',
      "esim_or_physical" TEXT NOT NULL,
      "plan_name" TEXT NOT NULL,
      "plan_data_limit_gb" REAL NOT NULL,
      "data_used_gb_this_cycle" REAL NOT NULL DEFAULT 0,
      "sim_status" TEXT NOT NULL DEFAULT 'active',
      "network_provider" TEXT NOT NULL,
      "signal_status" TEXT NOT NULL DEFAULT 'normal',
      "activation_date" DATETIME NOT NULL,
      "billing_cycle_start_day" INTEGER NOT NULL DEFAULT 1,
      CONSTRAINT "Line_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Line_phone_number_key" ON "Line"("phone_number");`,

    `CREATE TABLE IF NOT EXISTS "Order" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "order_id" TEXT NOT NULL,
      "line_id" INTEGER NOT NULL,
      "plan_name" TEXT NOT NULL,
      "plan_data_limit_gb" REAL NOT NULL,
      "order_type" TEXT NOT NULL DEFAULT 'new_plan',
      "purchased_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "cycle_start" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Order_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "Line" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Order_order_id_key" ON "Order"("order_id");`,

    `CREATE TABLE IF NOT EXISTS "LineFeature" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "line_id" INTEGER NOT NULL,
      "feature_name" TEXT NOT NULL,
      "enabled" BOOLEAN NOT NULL DEFAULT false,
      CONSTRAINT "LineFeature_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "Line" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "LineFeature_line_id_feature_name_key" ON "LineFeature"("line_id", "feature_name");`,

    `CREATE TABLE IF NOT EXISTS "ActionHistory" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "line_id" INTEGER NOT NULL,
      "action_type" TEXT NOT NULL,
      "performed_by" TEXT NOT NULL DEFAULT 'agent_demo',
      "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "details" TEXT NOT NULL,
      "result" TEXT NOT NULL,
      CONSTRAINT "ActionHistory_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "Line" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS "AgentLog" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "line_id" INTEGER,
      "case_type" TEXT NOT NULL,
      "action_taken" TEXT NOT NULL,
      "confidence_score" REAL NOT NULL,
      "handle_time_seconds" INTEGER NOT NULL,
      "outcome" TEXT NOT NULL,
      "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AgentLog_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "Line" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );`,

    // ── Additive migrations (safe on existing DBs) ───────────────────────────
    // Add imei column if it doesn't exist yet
    `ALTER TABLE "Line" ADD COLUMN "imei" TEXT NOT NULL DEFAULT '';`,
  ];

  console.log("Applying schema to Turso...");
  for (const sql of schemaStatements) {
    try {
      await client.execute(sql);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Skip "already exists" and "duplicate column" errors — those are safe
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate column name") ||
        msg.includes("UNIQUE constraint") // index already exists
      ) {
        continue;
      }
      console.warn(`  ⚠ Skipped: ${msg.split("\n")[0]}`);
    }
  }

  console.log("✅ Schema successfully applied to Turso database!");
}

initTurso().catch((err) => {
  console.error("Failed to initialize Turso database:", err);
  process.exit(1);
});

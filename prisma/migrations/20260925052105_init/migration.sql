-- CreateTable
CREATE TABLE "Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "account_holder_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "account_status" TEXT NOT NULL DEFAULT 'active'
);

-- CreateTable
CREATE TABLE "Line" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "account_id" INTEGER NOT NULL,
    "phone_number" TEXT NOT NULL,
    "iccid" TEXT NOT NULL,
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
);

-- CreateTable
CREATE TABLE "LineFeature" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "line_id" INTEGER NOT NULL,
    "feature_name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "LineFeature_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "Line" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "line_id" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL DEFAULT 'agent_demo',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    CONSTRAINT "ActionHistory_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "Line" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "line_id" INTEGER,
    "case_type" TEXT NOT NULL,
    "action_taken" TEXT NOT NULL,
    "confidence_score" REAL NOT NULL,
    "handle_time_seconds" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentLog_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "Line" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Line_phone_number_key" ON "Line"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "LineFeature_line_id_feature_name_key" ON "LineFeature"("line_id", "feature_name");

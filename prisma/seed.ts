import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";
import "dotenv/config";

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

const prisma = new PrismaClient({ adapter });

// ── Constants ─────────────────────────────────────────────────────────────────

const PLANS = [
  { name: "Unlimited Premium", limit: -1 },   // unlimited = -1 sentinel, display as "Unlimited"
  { name: "Unlimited Starter", limit: 70 },
  { name: "Unlimited Flex",    limit: 10 },
] as const;

const PLAN_DATA_DISPLAY: Record<string, number> = {
  "Unlimited Premium": 999, // sentinel for "unlimited"
  "Unlimited Starter": 70,
  "Unlimited Flex":    10,
};

const NETWORKS = ["T-Mobile", "AT&T", "Verizon"] as const;

// All lines share exactly this feature set
const ALL_FEATURES = [
  "VoLTE",
  "WiFi Calling",
  "Roaming",
  "Visual Voicemail",
  "Hotspot",
  "Spam Filter",
  "Data Saver",
];

const ACTION_TYPES = [
  "sim_swap",
  "network_change",
  "plan_change",
  "feature_toggle",
  "troubleshoot_reset",
];
const PERFORMERS = ["agent_demo", "agent_sarah", "agent_mike", "system_auto"];

// ── Helpers ───────────────────────────────────────────────────────────────────

let orderCounter = 1;

function nextOrderId(): string {
  return `ORD-${String(orderCounter++).padStart(5, "0")}`;
}

function randomDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateICCID(): string {
  let iccid = "8901";
  for (let i = 0; i < 16; i++) iccid += Math.floor(Math.random() * 10);
  return iccid; // 20 digits total
}

function generateIMEI(): string {
  let imei = "";
  for (let i = 0; i < 15; i++) imei += Math.floor(Math.random() * 10);
  return imei; // 15 digits
}

function generatePhone(): string {
  const areaCodes = [
    "212", "310", "312", "415", "469", "571", "602",
    "678", "718", "786", "817", "832", "904", "917", "949", "972",
  ];
  const ac  = randomPick(areaCodes);
  const mid = String(Math.floor(Math.random() * 900) + 100);
  const end = String(Math.floor(Math.random() * 9000) + 1000);
  return `+1${ac}${mid}${end}`;
}

/** Generate features for a line — VoLTE always ON, rest randomised */
function generateFeatures() {
  return ALL_FEATURES.map((name) => ({
    feature_name: name,
    enabled: name === "VoLTE" ? true : Math.random() > 0.45,
  }));
}

/** Pseudo-realistic action history per scenario */
function generateActionHistory(scenario: string) {
  const templates: Record<string, { action_type: string; details: string; result: string }[]> = {
    sim_issue: [
      { action_type: "sim_swap",          details: "Customer requested SIM swap from physical to eSIM",               result: "success" },
      { action_type: "sim_swap",          details: "SIM swap initiated — awaiting customer verification",              result: "failed"  },
      { action_type: "troubleshoot_reset",details: "Network reset performed after SIM swap failure",                   result: "success" },
      { action_type: "feature_toggle",    details: "Enabled WiFi Calling as workaround for SIM issues",               result: "success" },
    ],
    network_issue: [
      { action_type: "troubleshoot_reset",details: "Network connectivity reset initiated by customer",                 result: "success" },
      { action_type: "network_change",    details: "Attempted carrier network switch for better coverage",             result: "failed"  },
      { action_type: "troubleshoot_reset",details: "Full network profile refresh performed",                           result: "success" },
      { action_type: "feature_toggle",    details: "Toggled WiFi Calling to troubleshoot signal issues",               result: "success" },
    ],
    billing_issue: [
      { action_type: "plan_change",       details: "Customer inquired about upgrading plan due to data overuse",       result: "success" },
      { action_type: "feature_toggle",    details: "Disabled Hotspot to conserve data usage",                          result: "success" },
      { action_type: "plan_change",       details: "Temporary data boost applied for billing cycle",                   result: "success" },
      { action_type: "troubleshoot_reset",details: "Data usage counter verification requested",                        result: "failed"  },
    ],
    healthy: [
      { action_type: "feature_toggle",    details: "Customer enabled Roaming for upcoming trip",                       result: "success" },
      { action_type: "plan_change",       details: "Routine plan review — no changes needed",                          result: "success" },
      { action_type: "feature_toggle",    details: "Enabled VoLTE feature per customer request",                       result: "success" },
      { action_type: "troubleshoot_reset",details: "Routine network optimisation performed",                           result: "success" },
    ],
  };

  const pool = templates[scenario] ?? templates.healthy;
  const count = Math.floor(Math.random() * 3) + 2;
  return Array.from({ length: count }, (_, i) => ({
    ...pool[i % pool.length],
    performed_by: randomPick(PERFORMERS),
  }));
}

// ── Seed data definitions ─────────────────────────────────────────────────────

interface LineSeed {
  phone_number: string;
  esim_or_physical: string;
  plan: (typeof PLANS)[number];
  data_used_gb: number;
  sim_status: string;
  network_provider: string;
  signal_status: string;
  billing_cycle_start_day: number;
  scenario: string;
  activated_days_ago: number;
}

interface AccountSeed {
  name: string;
  email: string;
  phone: string;
  status: string;
  scenario: string;
  lines: LineSeed[];
}

const accounts: AccountSeed[] = [
  // ── SIM / eSIM Issue Accounts ───────────────────────────────────────────────
  {
    name: "Marcus Johnson", email: "marcus.johnson@email.com",
    phone: "+12125551001", status: "active", scenario: "sim_issue",
    lines: [{
      phone_number: "+12125559101", esim_or_physical: "esim",
      plan: PLANS[0], data_used_gb: 22.4,
      sim_status: "swap_pending", network_provider: "T-Mobile",
      signal_status: "limited", billing_cycle_start_day: 1, scenario: "sim_issue", activated_days_ago: 120,
    }],
  },
  {
    name: "Priya Patel", email: "priya.patel@email.com",
    phone: "+13105551002", status: "active", scenario: "sim_issue",
    lines: [{
      phone_number: "+13105559102", esim_or_physical: "physical",
      plan: PLANS[2], data_used_gb: 8.1,
      sim_status: "inactive", network_provider: "Verizon",
      signal_status: "no_service", billing_cycle_start_day: 15, scenario: "sim_issue", activated_days_ago: 200,
    }],
  },
  {
    name: "Angela Torres", email: "angela.torres@email.com",
    phone: "+14155551003", status: "active", scenario: "sim_issue",
    lines: [{
      phone_number: "+14155559103", esim_or_physical: "esim",
      plan: PLANS[1], data_used_gb: 31.7,
      sim_status: "swap_pending", network_provider: "AT&T",
      signal_status: "normal", billing_cycle_start_day: 5, scenario: "sim_issue", activated_days_ago: 85,
    }],
  },
  {
    name: "David Kim", email: "david.kim@email.com",
    phone: "+14695551004", status: "active", scenario: "sim_issue",
    lines: [{
      phone_number: "+14695559104", esim_or_physical: "physical",
      plan: PLANS[2], data_used_gb: 3.2,
      sim_status: "inactive", network_provider: "T-Mobile",
      signal_status: "no_service", billing_cycle_start_day: 20, scenario: "sim_issue", activated_days_ago: 310,
    }],
  },
  {
    name: "Rachel Green", email: "rachel.green@email.com",
    phone: "+15715551005", status: "active", scenario: "sim_issue",
    lines: [
      {
        phone_number: "+15715559105", esim_or_physical: "esim",
        plan: PLANS[0], data_used_gb: 45.3,
        sim_status: "swap_pending", network_provider: "Verizon",
        signal_status: "limited", billing_cycle_start_day: 10, scenario: "sim_issue", activated_days_ago: 60,
      },
      {
        phone_number: "+15715559106", esim_or_physical: "physical",
        plan: PLANS[2], data_used_gb: 2.1,
        sim_status: "active", network_provider: "Verizon",
        signal_status: "normal", billing_cycle_start_day: 10, scenario: "healthy", activated_days_ago: 60,
      },
    ],
  },

  // ── Network / No-Service Issue Accounts ────────────────────────────────────
  {
    name: "James Carter", email: "james.carter@email.com",
    phone: "+16025551006", status: "active", scenario: "network_issue",
    lines: [{
      phone_number: "+16025559107", esim_or_physical: "physical",
      plan: PLANS[1], data_used_gb: 12.8,
      sim_status: "active", network_provider: "AT&T",
      signal_status: "no_service", billing_cycle_start_day: 1, scenario: "network_issue", activated_days_ago: 400,
    }],
  },
  {
    name: "Sofia Rodriguez", email: "sofia.rodriguez@email.com",
    phone: "+16785551007", status: "active", scenario: "network_issue",
    lines: [{
      phone_number: "+16785559108", esim_or_physical: "esim",
      plan: PLANS[0], data_used_gb: 55.2,
      sim_status: "active", network_provider: "T-Mobile",
      signal_status: "limited", billing_cycle_start_day: 7, scenario: "network_issue", activated_days_ago: 150,
    }],
  },
  {
    name: "William Chen", email: "william.chen@email.com",
    phone: "+17185551008", status: "active", scenario: "network_issue",
    lines: [{
      phone_number: "+17185559109", esim_or_physical: "physical",
      plan: PLANS[1], data_used_gb: 18.4,
      sim_status: "active", network_provider: "Verizon",
      signal_status: "no_service", billing_cycle_start_day: 12, scenario: "network_issue", activated_days_ago: 275,
    }],
  },
  {
    name: "Olivia Washington", email: "olivia.washington@email.com",
    phone: "+17865551009", status: "active", scenario: "network_issue",
    lines: [
      {
        phone_number: "+17865559110", esim_or_physical: "esim",
        plan: PLANS[1], data_used_gb: 33.6,
        sim_status: "active", network_provider: "AT&T",
        signal_status: "no_service", billing_cycle_start_day: 3, scenario: "network_issue", activated_days_ago: 95,
      },
      {
        phone_number: "+17865559111", esim_or_physical: "physical",
        plan: PLANS[2], data_used_gb: 7.9,
        sim_status: "active", network_provider: "AT&T",
        signal_status: "limited", billing_cycle_start_day: 3, scenario: "network_issue", activated_days_ago: 95,
      },
    ],
  },
  {
    name: "Daniel Brooks", email: "daniel.brooks@email.com",
    phone: "+18175551010", status: "active", scenario: "network_issue",
    lines: [{
      phone_number: "+18175559112", esim_or_physical: "physical",
      plan: PLANS[2], data_used_gb: 1.2,
      sim_status: "active", network_provider: "T-Mobile",
      signal_status: "limited", billing_cycle_start_day: 25, scenario: "network_issue", activated_days_ago: 190,
    }],
  },

  // ── Billing / Usage Issue Accounts ─────────────────────────────────────────
  {
    name: "Christina Lee", email: "christina.lee@email.com",
    phone: "+18325551011", status: "past_due", scenario: "billing_issue",
    lines: [{
      phone_number: "+18325559113", esim_or_physical: "physical",
      plan: PLANS[1], data_used_gb: 68.9,
      sim_status: "active", network_provider: "Verizon",
      signal_status: "normal", billing_cycle_start_day: 1, scenario: "billing_issue", activated_days_ago: 500,
    }],
  },
  {
    name: "Robert Martinez", email: "robert.martinez@email.com",
    phone: "+19045551012", status: "active", scenario: "billing_issue",
    lines: [{
      phone_number: "+19045559114", esim_or_physical: "esim",
      plan: PLANS[2], data_used_gb: 9.8,
      sim_status: "active", network_provider: "AT&T",
      signal_status: "normal", billing_cycle_start_day: 8, scenario: "billing_issue", activated_days_ago: 230,
    }],
  },
  {
    name: "Jennifer Adams", email: "jennifer.adams@email.com",
    phone: "+19175551013", status: "active", scenario: "billing_issue",
    lines: [
      {
        phone_number: "+19175559115", esim_or_physical: "physical",
        plan: PLANS[2], data_used_gb: 9.9,
        sim_status: "active", network_provider: "T-Mobile",
        signal_status: "normal", billing_cycle_start_day: 18, scenario: "billing_issue", activated_days_ago: 180,
      },
      {
        phone_number: "+19175559116", esim_or_physical: "esim",
        plan: PLANS[0], data_used_gb: 300.0,
        sim_status: "active", network_provider: "T-Mobile",
        signal_status: "normal", billing_cycle_start_day: 18, scenario: "billing_issue", activated_days_ago: 180,
      },
      {
        phone_number: "+19175559117", esim_or_physical: "physical",
        plan: PLANS[1], data_used_gb: 69.5,
        sim_status: "active", network_provider: "T-Mobile",
        signal_status: "normal", billing_cycle_start_day: 18, scenario: "billing_issue", activated_days_ago: 180,
      },
    ],
  },
  {
    name: "Andrew Nguyen", email: "andrew.nguyen@email.com",
    phone: "+19495551014", status: "active", scenario: "billing_issue",
    lines: [{
      phone_number: "+19495559118", esim_or_physical: "esim",
      plan: PLANS[1], data_used_gb: 70.0,
      sim_status: "active", network_provider: "Verizon",
      signal_status: "normal", billing_cycle_start_day: 22, scenario: "billing_issue", activated_days_ago: 365,
    }],
  },
  {
    name: "Michelle Thompson", email: "michelle.thompson@email.com",
    phone: "+19725551015", status: "suspended", scenario: "billing_issue",
    lines: [{
      phone_number: "+19725559119", esim_or_physical: "physical",
      plan: PLANS[1], data_used_gb: 69.2,
      sim_status: "suspended", network_provider: "AT&T",
      signal_status: "normal", billing_cycle_start_day: 1, scenario: "billing_issue", activated_days_ago: 440,
    }],
  },

  // ── Healthy Accounts ────────────────────────────────────────────────────────
  {
    name: "Christopher Davis", email: "christopher.davis@email.com",
    phone: "+12125551016", status: "active", scenario: "healthy",
    lines: [
      {
        phone_number: "+12125559120", esim_or_physical: "esim",
        plan: PLANS[0], data_used_gb: 28.4,
        sim_status: "active", network_provider: "Verizon",
        signal_status: "normal", billing_cycle_start_day: 1, scenario: "healthy", activated_days_ago: 720,
      },
      {
        phone_number: "+12125559121", esim_or_physical: "physical",
        plan: PLANS[2], data_used_gb: 6.3,
        sim_status: "active", network_provider: "Verizon",
        signal_status: "normal", billing_cycle_start_day: 1, scenario: "healthy", activated_days_ago: 720,
      },
    ],
  },
  {
    name: "Samantha Wright", email: "samantha.wright@email.com",
    phone: "+13105551017", status: "active", scenario: "healthy",
    lines: [{
      phone_number: "+13105559122", esim_or_physical: "physical",
      plan: PLANS[1], data_used_gb: 15.7,
      sim_status: "active", network_provider: "T-Mobile",
      signal_status: "normal", billing_cycle_start_day: 12, scenario: "healthy", activated_days_ago: 600,
    }],
  },
  {
    name: "Eric Williams", email: "eric.williams@email.com",
    phone: "+14155551018", status: "active", scenario: "healthy",
    lines: [
      {
        phone_number: "+14155559123", esim_or_physical: "esim",
        plan: PLANS[1], data_used_gb: 19.8,
        sim_status: "active", network_provider: "AT&T",
        signal_status: "normal", billing_cycle_start_day: 5, scenario: "healthy", activated_days_ago: 550,
      },
      {
        phone_number: "+14155559124", esim_or_physical: "physical",
        plan: PLANS[2], data_used_gb: 1.8,
        sim_status: "active", network_provider: "AT&T",
        signal_status: "normal", billing_cycle_start_day: 5, scenario: "healthy", activated_days_ago: 550,
      },
      {
        phone_number: "+14155559125", esim_or_physical: "esim",
        plan: PLANS[0], data_used_gb: 10.5,
        sim_status: "active", network_provider: "AT&T",
        signal_status: "normal", billing_cycle_start_day: 5, scenario: "healthy", activated_days_ago: 550,
      },
    ],
  },
  {
    name: "Lisa Morgan", email: "lisa.morgan@email.com",
    phone: "+16025551019", status: "active", scenario: "healthy",
    lines: [{
      phone_number: "+16025559126", esim_or_physical: "physical",
      plan: PLANS[1], data_used_gb: 11.2,
      sim_status: "active", network_provider: "AT&T",
      signal_status: "normal", billing_cycle_start_day: 8, scenario: "healthy", activated_days_ago: 480,
    }],
  },
  {
    name: "Kevin Anderson", email: "kevin.anderson@email.com",
    phone: "+17185551020", status: "active", scenario: "healthy",
    lines: [{
      phone_number: "+17185559127", esim_or_physical: "esim",
      plan: PLANS[0], data_used_gb: 38.9,
      sim_status: "active", network_provider: "Verizon",
      signal_status: "normal", billing_cycle_start_day: 15, scenario: "healthy", activated_days_ago: 700,
    }],
  },
];

// ── Main seed ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding US Mobile Admin Portal database...\n");

  // Clear existing data in dependency order
  await prisma.agentLog.deleteMany();
  await prisma.actionHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.lineFeature.deleteMany();
  await prisma.line.deleteMany();
  await prisma.account.deleteMany();

  for (const acct of accounts) {
    const account = await prisma.account.create({
      data: {
        account_holder_name: acct.name,
        email: acct.email,
        phone: acct.phone,
        account_status: acct.status,
        created_at: randomDate(365),
      },
    });

    console.log(`✅ Account #${account.id}: ${acct.name} (${acct.scenario})`);

    for (const lineSeed of acct.lines) {
      // Each line's activation date
      const activationDate = new Date();
      activationDate.setDate(activationDate.getDate() - lineSeed.activated_days_ago);

      // The cycle start day = days since last order (we'll create 1 initial order)
      // "billing_cycle_start_day" = days into the current cycle
      // We set it to a reasonable small number based on when order was purchased
      const cycleStart = new Date();
      cycleStart.setDate(cycleStart.getDate() - lineSeed.billing_cycle_start_day + 1);

      const line = await prisma.line.create({
        data: {
          account_id: account.id,
          phone_number: lineSeed.phone_number,
          iccid: generateICCID(),
          imei: generateIMEI(),
          esim_or_physical: lineSeed.esim_or_physical,
          plan_name: lineSeed.plan.name,
          plan_data_limit_gb: lineSeed.plan.limit === -1 ? 999 : lineSeed.plan.limit,
          data_used_gb_this_cycle: lineSeed.data_used_gb,
          sim_status: lineSeed.sim_status,
          network_provider: lineSeed.network_provider,
          signal_status: lineSeed.signal_status,
          activation_date: activationDate,
          billing_cycle_start_day: lineSeed.billing_cycle_start_day,
        },
      });

      console.log(`   📱 Line #${line.id}: ${lineSeed.phone_number} [${lineSeed.plan.name}]`);

      // ── Create initial order ──────────────────────────────────────────────
      await prisma.order.create({
        data: {
          order_id: nextOrderId(),
          line_id: line.id,
          plan_name: lineSeed.plan.name,
          plan_data_limit_gb: lineSeed.plan.limit === -1 ? 999 : lineSeed.plan.limit,
          order_type: "new_plan",
          purchased_at: cycleStart,
          cycle_start: cycleStart,
        },
      });

      // ── Create features (all 7, VoLTE always ON) ──────────────────────────
      const features = generateFeatures();
      for (const feat of features) {
        await prisma.lineFeature.create({
          data: {
            line_id: line.id,
            feature_name: feat.feature_name,
            enabled: feat.enabled,
          },
        });
      }

      // ── Create action history ─────────────────────────────────────────────
      const actions = generateActionHistory(lineSeed.scenario);
      for (const action of actions) {
        await prisma.actionHistory.create({
          data: {
            line_id: line.id,
            action_type: action.action_type,
            performed_by: action.performed_by,
            details: action.details,
            result: action.result,
            timestamp: randomDate(60),
          },
        });
      }
    }
  }

  const counts = {
    accounts: await prisma.account.count(),
    lines: await prisma.line.count(),
    orders: await prisma.order.count(),
    features: await prisma.lineFeature.count(),
    history: await prisma.actionHistory.count(),
  };

  console.log(`\n🎉 Seed complete!`);
  console.log(`   Accounts:       ${counts.accounts}`);
  console.log(`   Lines:          ${counts.lines}`);
  console.log(`   Orders:         ${counts.orders}`);
  console.log(`   Features:       ${counts.features}`);
  console.log(`   Action History: ${counts.history}`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

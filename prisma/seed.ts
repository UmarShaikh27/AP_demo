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

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateICCID(): string {
  let iccid = "8901";
  for (let i = 0; i < 15; i++) iccid += Math.floor(Math.random() * 10);
  return iccid;
}

function generatePhone(): string {
  const areaCodes = ["212", "310", "312", "415", "469", "571", "602", "678", "718", "786", "817", "832", "904", "917", "949", "972"];
  const ac = randomPick(areaCodes);
  const mid = String(Math.floor(Math.random() * 900) + 100);
  const end = String(Math.floor(Math.random() * 9000) + 1000);
  return `+1${ac}${mid}${end}`;
}

// ── Seed Data Definitions ────────────────────────────────────────────────────

interface AccountSeed {
  name: string;
  email: string;
  phone: string;
  status: string;
  scenario: string;
  lines: LineSeed[];
}

interface LineSeed {
  phone_number: string;
  iccid: string;
  esim_or_physical: string;
  plan_name: string;
  plan_data_limit_gb: number;
  data_used_gb_this_cycle: number;
  sim_status: string;
  network_provider: string;
  signal_status: string;
  billing_cycle_start_day: number;
  scenario: string;
}

const PLANS = [
  { name: "Unlimited Premium", limit: 75 },
  { name: "Unlimited Basic", limit: 35 },
  { name: "5GB Starter", limit: 5 },
  { name: "15GB Value", limit: 15 },
  { name: "25GB Plus", limit: 25 },
  { name: "Unlimited Flex", limit: 50 },
];

const NETWORKS = ["T-Mobile", "AT&T", "Verizon"];

const FEATURES_POOL = [
  "International Roaming",
  "Hotspot",
  "WiFi Calling",
  "Visual Voicemail",
  "Caller ID",
  "Spam Filter",
  "HD Voice",
  "Number Share",
];

const ACTION_TYPES = ["sim_swap", "network_change", "plan_change", "feature_toggle", "troubleshoot_reset"];
const PERFORMERS = ["agent_demo", "agent_sarah", "agent_mike", "system_auto"];

// ── 20 Accounts with Realistic Names ────────────────────────────────────────

const accounts: AccountSeed[] = [
  // ─── SIM/eSIM ISSUE ACCOUNTS (5 lines) ────────────────────────────────────
  {
    name: "Marcus Johnson",
    email: "marcus.johnson@email.com",
    phone: "+12125551001",
    status: "active",
    scenario: "sim_issue",
    lines: [{
      phone_number: "+12125559101",
      iccid: generateICCID(),
      esim_or_physical: "esim",
      plan_name: "Unlimited Premium",
      plan_data_limit_gb: 75,
      data_used_gb_this_cycle: 22.4,
      sim_status: "swap_pending",
      network_provider: "T-Mobile",
      signal_status: "limited",
      billing_cycle_start_day: 1,
      scenario: "sim_issue",
    }],
  },
  {
    name: "Priya Patel",
    email: "priya.patel@email.com",
    phone: "+13105551002",
    status: "active",
    scenario: "sim_issue",
    lines: [{
      phone_number: "+13105559102",
      iccid: generateICCID(),
      esim_or_physical: "physical",
      plan_name: "25GB Plus",
      plan_data_limit_gb: 25,
      data_used_gb_this_cycle: 8.1,
      sim_status: "inactive",
      network_provider: "Verizon",
      signal_status: "no_service",
      billing_cycle_start_day: 15,
      scenario: "sim_issue",
    }],
  },
  {
    name: "Angela Torres",
    email: "angela.torres@email.com",
    phone: "+14155551003",
    status: "active",
    scenario: "sim_issue",
    lines: [{
      phone_number: "+14155559103",
      iccid: generateICCID(),
      esim_or_physical: "esim",
      plan_name: "Unlimited Flex",
      plan_data_limit_gb: 50,
      data_used_gb_this_cycle: 31.7,
      sim_status: "swap_pending",
      network_provider: "AT&T",
      signal_status: "normal",
      billing_cycle_start_day: 5,
      scenario: "sim_issue",
    }],
  },
  {
    name: "David Kim",
    email: "david.kim@email.com",
    phone: "+14695551004",
    status: "active",
    scenario: "sim_issue",
    lines: [{
      phone_number: "+14695559104",
      iccid: generateICCID(),
      esim_or_physical: "physical",
      plan_name: "15GB Value",
      plan_data_limit_gb: 15,
      data_used_gb_this_cycle: 3.2,
      sim_status: "inactive",
      network_provider: "T-Mobile",
      signal_status: "no_service",
      billing_cycle_start_day: 20,
      scenario: "sim_issue",
    }],
  },
  {
    // Multi-line account with SIM issue
    name: "Rachel Green",
    email: "rachel.green@email.com",
    phone: "+15715551005",
    status: "active",
    scenario: "sim_issue",
    lines: [
      {
        phone_number: "+15715559105",
        iccid: generateICCID(),
        esim_or_physical: "esim",
        plan_name: "Unlimited Premium",
        plan_data_limit_gb: 75,
        data_used_gb_this_cycle: 45.3,
        sim_status: "swap_pending",
        network_provider: "Verizon",
        signal_status: "limited",
        billing_cycle_start_day: 10,
        scenario: "sim_issue",
      },
      {
        phone_number: "+15715559106",
        iccid: generateICCID(),
        esim_or_physical: "physical",
        plan_name: "5GB Starter",
        plan_data_limit_gb: 5,
        data_used_gb_this_cycle: 2.1,
        sim_status: "active",
        network_provider: "Verizon",
        signal_status: "normal",
        billing_cycle_start_day: 10,
        scenario: "healthy",
      },
    ],
  },

  // ─── NETWORK/NO-SERVICE ISSUE ACCOUNTS (5 lines) ──────────────────────────
  {
    name: "James Carter",
    email: "james.carter@email.com",
    phone: "+16025551006",
    status: "active",
    scenario: "network_issue",
    lines: [{
      phone_number: "+16025559107",
      iccid: generateICCID(),
      esim_or_physical: "physical",
      plan_name: "Unlimited Basic",
      plan_data_limit_gb: 35,
      data_used_gb_this_cycle: 12.8,
      sim_status: "active",
      network_provider: "AT&T",
      signal_status: "no_service",
      billing_cycle_start_day: 1,
      scenario: "network_issue",
    }],
  },
  {
    name: "Sofia Rodriguez",
    email: "sofia.rodriguez@email.com",
    phone: "+16785551007",
    status: "active",
    scenario: "network_issue",
    lines: [{
      phone_number: "+16785559108",
      iccid: generateICCID(),
      esim_or_physical: "esim",
      plan_name: "Unlimited Premium",
      plan_data_limit_gb: 75,
      data_used_gb_this_cycle: 55.2,
      sim_status: "active",
      network_provider: "T-Mobile",
      signal_status: "limited",
      billing_cycle_start_day: 7,
      scenario: "network_issue",
    }],
  },
  {
    name: "William Chen",
    email: "william.chen@email.com",
    phone: "+17185551008",
    status: "active",
    scenario: "network_issue",
    lines: [{
      phone_number: "+17185559109",
      iccid: generateICCID(),
      esim_or_physical: "physical",
      plan_name: "25GB Plus",
      plan_data_limit_gb: 25,
      data_used_gb_this_cycle: 18.4,
      sim_status: "active",
      network_provider: "Verizon",
      signal_status: "no_service",
      billing_cycle_start_day: 12,
      scenario: "network_issue",
    }],
  },
  {
    // Multi-line account with network issue
    name: "Olivia Washington",
    email: "olivia.washington@email.com",
    phone: "+17865551009",
    status: "active",
    scenario: "network_issue",
    lines: [
      {
        phone_number: "+17865559110",
        iccid: generateICCID(),
        esim_or_physical: "esim",
        plan_name: "Unlimited Flex",
        plan_data_limit_gb: 50,
        data_used_gb_this_cycle: 33.6,
        sim_status: "active",
        network_provider: "AT&T",
        signal_status: "no_service",
        billing_cycle_start_day: 3,
        scenario: "network_issue",
      },
      {
        phone_number: "+17865559111",
        iccid: generateICCID(),
        esim_or_physical: "physical",
        plan_name: "15GB Value",
        plan_data_limit_gb: 15,
        data_used_gb_this_cycle: 7.9,
        sim_status: "active",
        network_provider: "AT&T",
        signal_status: "limited",
        billing_cycle_start_day: 3,
        scenario: "network_issue",
      },
    ],
  },
  {
    name: "Daniel Brooks",
    email: "daniel.brooks@email.com",
    phone: "+18175551010",
    status: "active",
    scenario: "network_issue",
    lines: [{
      phone_number: "+18175559112",
      iccid: generateICCID(),
      esim_or_physical: "physical",
      plan_name: "5GB Starter",
      plan_data_limit_gb: 5,
      data_used_gb_this_cycle: 1.2,
      sim_status: "active",
      network_provider: "T-Mobile",
      signal_status: "limited",
      billing_cycle_start_day: 25,
      scenario: "network_issue",
    }],
  },

  // ─── BILLING/USAGE ISSUE ACCOUNTS (5 lines) ───────────────────────────────
  {
    // Past-due account
    name: "Christina Lee",
    email: "christina.lee@email.com",
    phone: "+18325551011",
    status: "past_due",
    scenario: "billing_issue",
    lines: [{
      phone_number: "+18325559113",
      iccid: generateICCID(),
      esim_or_physical: "physical",
      plan_name: "Unlimited Basic",
      plan_data_limit_gb: 35,
      data_used_gb_this_cycle: 34.8,
      sim_status: "active",
      network_provider: "Verizon",
      signal_status: "normal",
      billing_cycle_start_day: 1,
      scenario: "billing_issue",
    }],
  },
  {
    name: "Robert Martinez",
    email: "robert.martinez@email.com",
    phone: "+19045551012",
    status: "active",
    scenario: "billing_issue",
    lines: [{
      phone_number: "+19045559114",
      iccid: generateICCID(),
      esim_or_physical: "esim",
      plan_name: "15GB Value",
      plan_data_limit_gb: 15,
      data_used_gb_this_cycle: 14.7,
      sim_status: "active",
      network_provider: "AT&T",
      signal_status: "normal",
      billing_cycle_start_day: 8,
      scenario: "billing_issue",
    }],
  },
  {
    // Multi-line account with billing issue
    name: "Jennifer Adams",
    email: "jennifer.adams@email.com",
    phone: "+19175551013",
    status: "active",
    scenario: "billing_issue",
    lines: [
      {
        phone_number: "+19175559115",
        iccid: generateICCID(),
        esim_or_physical: "physical",
        plan_name: "5GB Starter",
        plan_data_limit_gb: 5,
        data_used_gb_this_cycle: 5.3,
        sim_status: "active",
        network_provider: "T-Mobile",
        signal_status: "normal",
        billing_cycle_start_day: 18,
        scenario: "billing_issue",
      },
      {
        phone_number: "+19175559116",
        iccid: generateICCID(),
        esim_or_physical: "esim",
        plan_name: "Unlimited Premium",
        plan_data_limit_gb: 75,
        data_used_gb_this_cycle: 72.1,
        sim_status: "active",
        network_provider: "T-Mobile",
        signal_status: "normal",
        billing_cycle_start_day: 18,
        scenario: "billing_issue",
      },
      {
        phone_number: "+19175559117",
        iccid: generateICCID(),
        esim_or_physical: "physical",
        plan_name: "25GB Plus",
        plan_data_limit_gb: 25,
        data_used_gb_this_cycle: 24.9,
        sim_status: "active",
        network_provider: "T-Mobile",
        signal_status: "normal",
        billing_cycle_start_day: 18,
        scenario: "billing_issue",
      },
    ],
  },
  {
    name: "Andrew Nguyen",
    email: "andrew.nguyen@email.com",
    phone: "+19495551014",
    status: "active",
    scenario: "billing_issue",
    lines: [{
      phone_number: "+19495559118",
      iccid: generateICCID(),
      esim_or_physical: "esim",
      plan_name: "25GB Plus",
      plan_data_limit_gb: 25,
      data_used_gb_this_cycle: 25.0,
      sim_status: "active",
      network_provider: "Verizon",
      signal_status: "normal",
      billing_cycle_start_day: 22,
      scenario: "billing_issue",
    }],
  },
  {
    name: "Michelle Thompson",
    email: "michelle.thompson@email.com",
    phone: "+19725551015",
    status: "suspended",
    scenario: "billing_issue",
    lines: [{
      phone_number: "+19725559119",
      iccid: generateICCID(),
      esim_or_physical: "physical",
      plan_name: "Unlimited Flex",
      plan_data_limit_gb: 50,
      data_used_gb_this_cycle: 49.2,
      sim_status: "suspended",
      network_provider: "AT&T",
      signal_status: "normal",
      billing_cycle_start_day: 1,
      scenario: "billing_issue",
    }],
  },

  // ─── HEALTHY ACCOUNTS (remaining 5) ───────────────────────────────────────
  {
    // Multi-line healthy account
    name: "Christopher Davis",
    email: "christopher.davis@email.com",
    phone: "+12125551016",
    status: "active",
    scenario: "healthy",
    lines: [
      {
        phone_number: "+12125559120",
        iccid: generateICCID(),
        esim_or_physical: "esim",
        plan_name: "Unlimited Premium",
        plan_data_limit_gb: 75,
        data_used_gb_this_cycle: 28.4,
        sim_status: "active",
        network_provider: "Verizon",
        signal_status: "normal",
        billing_cycle_start_day: 1,
        scenario: "healthy",
      },
      {
        phone_number: "+12125559121",
        iccid: generateICCID(),
        esim_or_physical: "physical",
        plan_name: "15GB Value",
        plan_data_limit_gb: 15,
        data_used_gb_this_cycle: 6.3,
        sim_status: "active",
        network_provider: "Verizon",
        signal_status: "normal",
        billing_cycle_start_day: 1,
        scenario: "healthy",
      },
    ],
  },
  {
    name: "Samantha Wright",
    email: "samantha.wright@email.com",
    phone: "+13105551017",
    status: "active",
    scenario: "healthy",
    lines: [{
      phone_number: "+13105559122",
      iccid: generateICCID(),
      esim_or_physical: "physical",
      plan_name: "Unlimited Basic",
      plan_data_limit_gb: 35,
      data_used_gb_this_cycle: 15.7,
      sim_status: "active",
      network_provider: "T-Mobile",
      signal_status: "normal",
      billing_cycle_start_day: 12,
      scenario: "healthy",
    }],
  },
  {
    // Multi-line healthy account
    name: "Eric Williams",
    email: "eric.williams@email.com",
    phone: "+14155551018",
    status: "active",
    scenario: "healthy",
    lines: [
      {
        phone_number: "+14155559123",
        iccid: generateICCID(),
        esim_or_physical: "esim",
        plan_name: "Unlimited Flex",
        plan_data_limit_gb: 50,
        data_used_gb_this_cycle: 19.8,
        sim_status: "active",
        network_provider: "AT&T",
        signal_status: "normal",
        billing_cycle_start_day: 5,
        scenario: "healthy",
      },
      {
        phone_number: "+14155559124",
        iccid: generateICCID(),
        esim_or_physical: "physical",
        plan_name: "5GB Starter",
        plan_data_limit_gb: 5,
        data_used_gb_this_cycle: 1.8,
        sim_status: "active",
        network_provider: "AT&T",
        signal_status: "normal",
        billing_cycle_start_day: 5,
        scenario: "healthy",
      },
      {
        phone_number: "+14155559125",
        iccid: generateICCID(),
        esim_or_physical: "esim",
        plan_name: "25GB Plus",
        plan_data_limit_gb: 25,
        data_used_gb_this_cycle: 10.5,
        sim_status: "active",
        network_provider: "AT&T",
        signal_status: "normal",
        billing_cycle_start_day: 5,
        scenario: "healthy",
      },
    ],
  },
  {
    name: "Lisa Morgan",
    email: "lisa.morgan@email.com",
    phone: "+16025551019",
    status: "active",
    scenario: "healthy",
    lines: [{
      phone_number: "+16025559126",
      iccid: generateICCID(),
      esim_or_physical: "physical",
      plan_name: "25GB Plus",
      plan_data_limit_gb: 25,
      data_used_gb_this_cycle: 11.2,
      sim_status: "active",
      network_provider: "AT&T",
      signal_status: "normal",
      billing_cycle_start_day: 8,
      scenario: "healthy",
    }],
  },
  {
    name: "Kevin Anderson",
    email: "kevin.anderson@email.com",
    phone: "+17185551020",
    status: "active",
    scenario: "healthy",
    lines: [{
      phone_number: "+17185559127",
      iccid: generateICCID(),
      esim_or_physical: "esim",
      plan_name: "Unlimited Premium",
      plan_data_limit_gb: 75,
      data_used_gb_this_cycle: 38.9,
      sim_status: "active",
      network_provider: "Verizon",
      signal_status: "normal",
      billing_cycle_start_day: 15,
      scenario: "healthy",
    }],
  },
];

// ── Action History Templates ─────────────────────────────────────────────────

function generateActionHistory(lineScenario: string): { action_type: string; performed_by: string; details: string; result: string }[] {
  const histories: { action_type: string; performed_by: string; details: string; result: string }[] = [];
  const numEntries = Math.floor(Math.random() * 3) + 2; // 2-4 entries

  const templates = {
    sim_issue: [
      { action_type: "sim_swap", details: "Customer requested SIM swap from physical to eSIM", result: "success" },
      { action_type: "sim_swap", details: "SIM swap initiated - awaiting customer verification", result: "failed" },
      { action_type: "troubleshoot_reset", details: "Network reset performed after SIM swap failure", result: "success" },
      { action_type: "feature_toggle", details: "Enabled WiFi Calling as workaround for SIM issues", result: "success" },
    ],
    network_issue: [
      { action_type: "troubleshoot_reset", details: "Network connectivity reset initiated by customer", result: "success" },
      { action_type: "network_change", details: "Attempted carrier network switch for better coverage", result: "failed" },
      { action_type: "troubleshoot_reset", details: "Full network profile refresh performed", result: "success" },
      { action_type: "feature_toggle", details: "Toggled WiFi Calling to troubleshoot signal issues", result: "success" },
    ],
    billing_issue: [
      { action_type: "plan_change", details: "Customer inquired about upgrading plan due to data overuse", result: "success" },
      { action_type: "feature_toggle", details: "Disabled Hotspot to conserve data usage", result: "success" },
      { action_type: "plan_change", details: "Temporary data boost applied for billing cycle", result: "success" },
      { action_type: "troubleshoot_reset", details: "Data usage counter verification requested", result: "failed" },
    ],
    healthy: [
      { action_type: "feature_toggle", details: "Customer enabled International Roaming for upcoming trip", result: "success" },
      { action_type: "plan_change", details: "Routine plan review - no changes needed", result: "success" },
      { action_type: "feature_toggle", details: "Enabled HD Voice feature per customer request", result: "success" },
      { action_type: "troubleshoot_reset", details: "Routine network optimization performed", result: "success" },
    ],
  };

  const pool = templates[lineScenario as keyof typeof templates] || templates.healthy;

  for (let i = 0; i < numEntries; i++) {
    const template = pool[i % pool.length];
    histories.push({
      ...template,
      performed_by: randomPick(PERFORMERS),
    });
  }

  return histories;
}

function generateFeatures(): { feature_name: string; enabled: boolean }[] {
  const numFeatures = Math.floor(Math.random() * 2) + 2; // 2-3 features
  const shuffled = [...FEATURES_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numFeatures).map((name) => ({
    feature_name: name,
    enabled: Math.random() > 0.3,
  }));
}

// ── Main Seed Function ───────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding US Mobile Admin Portal database...\n");

  // Clear existing data
  await prisma.agentLog.deleteMany();
  await prisma.actionHistory.deleteMany();
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
      const line = await prisma.line.create({
        data: {
          account_id: account.id,
          phone_number: lineSeed.phone_number,
          iccid: lineSeed.iccid,
          esim_or_physical: lineSeed.esim_or_physical,
          plan_name: lineSeed.plan_name,
          plan_data_limit_gb: lineSeed.plan_data_limit_gb,
          data_used_gb_this_cycle: lineSeed.data_used_gb_this_cycle,
          sim_status: lineSeed.sim_status,
          network_provider: lineSeed.network_provider,
          signal_status: lineSeed.signal_status,
          activation_date: randomDate(730),
          billing_cycle_start_day: lineSeed.billing_cycle_start_day,
        },
      });

      console.log(`   📱 Line #${line.id}: ${lineSeed.phone_number} [${lineSeed.scenario}]`);

      // Create features
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

      // Create action history
      const actions = generateActionHistory(lineSeed.scenario);
      for (let i = 0; i < actions.length; i++) {
        await prisma.actionHistory.create({
          data: {
            line_id: line.id,
            action_type: actions[i].action_type,
            performed_by: actions[i].performed_by,
            details: actions[i].details,
            result: actions[i].result,
            timestamp: randomDate(60),
          },
        });
      }
    }
  }

  const accountCount = await prisma.account.count();
  const lineCount = await prisma.line.count();
  const featureCount = await prisma.lineFeature.count();
  const historyCount = await prisma.actionHistory.count();

  console.log(`\n🎉 Seed complete!`);
  console.log(`   Accounts: ${accountCount}`);
  console.log(`   Lines: ${lineCount}`);
  console.log(`   Features: ${featureCount}`);
  console.log(`   Action History: ${historyCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

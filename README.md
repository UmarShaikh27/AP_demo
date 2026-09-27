# US Mobile Admin Portal (Demo)

A realistic replica of a telecom carrier's internal admin tool — built as a portfolio/demo project. It does **not** connect to any real telecom system; all data is seeded/fake.

![Admin Portal](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma) ![SQLite](https://img.shields.io/badge/SQLite-file--based-003B57?logo=sqlite) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)

---

## Quick Start (under 5 minutes)

```bash
# 1. Clone and install
git clone <repo-url> && cd adminportal
npm install

# 2. Set up environment
cp .env.example .env   # or just use the included .env

# 3. Initialize database and seed
npx prisma migrate dev --name init
npm run seed

# 4. Run
npm run dev
```

Open **http://localhost:3000** — you'll land on the Accounts page.

---

## Environment Variables

| Variable       | Default Value              | Description                          |
| -------------- | -------------------------- | ------------------------------------ |
| `DATABASE_URL` | `file:./dev.db`            | SQLite file path (relative to root)  |
| `API_KEY`      | `usm-demo-api-key-2024`   | API key for external REST endpoints  |

All external API endpoints require header: `x-api-key: usm-demo-api-key-2024`

---

## Seeded Test Accounts (20 Accounts, 27 Lines)

### SIM/eSIM Issue Accounts (5 lines)
| Acct ID | Name             | Email                         | Lines | Scenario           | Line IDs | SIM Status     | Signal   |
| ------- | ---------------- | ----------------------------- | ----- | ------------------ | -------- | -------------- | -------- |
| 1       | Marcus Johnson   | marcus.johnson@email.com      | 1     | SIM swap_pending   | 1        | swap_pending   | limited  |
| 2       | Priya Patel      | priya.patel@email.com         | 1     | SIM inactive       | 2        | inactive       | no_service |
| 3       | Angela Torres    | angela.torres@email.com       | 1     | SIM swap_pending   | 3        | swap_pending   | normal   |
| 4       | David Kim        | david.kim@email.com           | 1     | SIM inactive       | 4        | inactive       | no_service |
| 5       | Rachel Green     | rachel.green@email.com        | 2     | SIM swap_pending + healthy | 5, 6 | swap_pending / active | limited / normal |

### Network/No-Service Issue Accounts (5+ lines)
| Acct ID | Name                | Email                            | Lines | Scenario      | Line IDs | Signal      | Network   |
| ------- | ------------------- | -------------------------------- | ----- | ------------- | -------- | ----------- | --------- |
| 6       | James Carter        | james.carter@email.com           | 1     | Network issue | 7        | no_service  | AT&T      |
| 7       | Sofia Rodriguez     | sofia.rodriguez@email.com        | 1     | Network issue | 8        | limited     | T-Mobile  |
| 8       | William Chen        | william.chen@email.com           | 1     | Network issue | 9        | no_service  | Verizon   |
| 9       | Olivia Washington   | olivia.washington@email.com      | 2     | Network issue | 10, 11   | no_service / limited | AT&T |
| 10      | Daniel Brooks       | daniel.brooks@email.com          | 1     | Network issue | 12       | limited     | T-Mobile  |

### Billing/Usage Issue Accounts (5+ lines)
| Acct ID | Name               | Email                           | Lines | Scenario       | Line IDs    | Data Usage            | Acct Status |
| ------- | ------------------ | ------------------------------- | ----- | -------------- | ----------- | --------------------- | ----------- |
| 11      | Christina Lee      | christina.lee@email.com         | 1     | Billing/usage  | 13          | 34.8 / 35 GB (99%)   | past_due    |
| 12      | Robert Martinez    | robert.martinez@email.com       | 1     | Billing/usage  | 14          | 14.7 / 15 GB (98%)   | active      |
| 13      | Jennifer Adams     | jennifer.adams@email.com        | 3     | Billing/usage  | 15, 16, 17  | Over/near limit on all | active     |
| 14      | Andrew Nguyen      | andrew.nguyen@email.com         | 1     | Billing/usage  | 18          | 25.0 / 25 GB (100%)  | active      |
| 15      | Michelle Thompson  | michelle.thompson@email.com     | 1     | Billing/usage  | 19          | 49.2 / 50 GB (98%)   | suspended   |

### Healthy Accounts (no issues)
| Acct ID | Name               | Email                           | Lines | Line IDs       |
| ------- | ------------------ | ------------------------------- | ----- | -------------- |
| 16      | Christopher Davis  | christopher.davis@email.com     | 2     | 20, 21         |
| 17      | Samantha Wright    | samantha.wright@email.com       | 1     | 22             |
| 18      | Eric Williams      | eric.williams@email.com         | 3     | 23, 24, 25     |
| 19      | Lisa Morgan        | lisa.morgan@email.com           | 1     | 26             |
| 20      | Kevin Anderson     | kevin.anderson@email.com        | 1     | 27             |

**Multi-line accounts:** #5 (2 lines), #9 (2 lines), #13 (3 lines), #16 (2 lines), #18 (3 lines)

---

## Pages

| Route               | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `/accounts`         | Searchable/filterable table of all 20 accounts                 |
| `/accounts/[id]`    | Account detail — info, status, all lines with quick badges     |
| `/lines/[id]`       | Line detail — usage, features, actions, history                |

---

## REST API Reference

All external endpoints require: `x-api-key: usm-demo-api-key-2024` header.

### Read Endpoints

#### GET `/api/accounts/:id`
Full account with lines summary.

```bash
curl http://localhost:3000/api/accounts/1 -H "x-api-key: usm-demo-api-key-2024"
```

#### GET `/api/lines/:id`
Full line detail including features and last 10 action history entries.

```bash
curl http://localhost:3000/api/lines/1 -H "x-api-key: usm-demo-api-key-2024"
```

#### GET `/api/lines/:id/usage`
Data usage stats only.

```bash
curl http://localhost:3000/api/lines/13 -H "x-api-key: usm-demo-api-key-2024"
```

Response:
```json
{
  "data_used_gb": 34.8,
  "data_limit_gb": 35,
  "percent_used": 99,
  "billing_cycle_start_day": 1
}
```

#### GET `/api/lines/:id/history`
Full action history for a line.

```bash
curl http://localhost:3000/api/lines/1/history -H "x-api-key: usm-demo-api-key-2024"
```

### Action Endpoints

#### POST `/api/lines/:id/actions/sim-swap`
Performs a SIM swap. ~90% success rate.

```bash
curl -X POST http://localhost:3000/api/lines/1/actions/sim-swap \
  -H "x-api-key: usm-demo-api-key-2024" \
  -H "Content-Type: application/json" \
  -d '{"new_iccid": "89014103211118510720", "new_imei": "353456789012345"}'
```

#### POST `/api/lines/:id/actions/network-change`
Changes network provider. Valid values: `T-Mobile`, `AT&T`, `Verizon`.

```bash
curl -X POST http://localhost:3000/api/lines/7/actions/network-change \
  -H "x-api-key: usm-demo-api-key-2024" \
  -H "Content-Type: application/json" \
  -d '{"network_provider": "Verizon"}'
```

#### POST `/api/lines/:id/actions/troubleshoot-reset`
Network reset — ~85% chance of resolving signal to "normal".

```bash
curl -X POST http://localhost:3000/api/lines/7/actions/troubleshoot-reset \
  -H "x-api-key: usm-demo-api-key-2024" \
  -H "Content-Type: application/json"
```

#### POST `/api/lines/:id/features/:featureId/toggle`
Toggles a feature on/off.

```bash
curl -X POST http://localhost:3000/api/lines/1/features/1/toggle \
  -H "x-api-key: usm-demo-api-key-2024" \
  -H "Content-Type: application/json"
```

#### POST `/api/agent-log`
Logs AI agent work. For external agents to track their actions.

```bash
curl -X POST http://localhost:3000/api/agent-log \
  -H "x-api-key: usm-demo-api-key-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "line_id": 1,
    "case_type": "sim_issue",
    "action_taken": "sim_swap",
    "confidence_score": 0.95,
    "handle_time_seconds": 45,
    "outcome": "resolved"
  }'
```

---

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Prisma 7** ORM with SQLite (file-based via `@prisma/adapter-libsql`)
- **Tailwind CSS 4** — dark admin dashboard theme
- **react-hot-toast** — toast notifications

---

## Project Structure

```
src/
├── app/
│   ├── accounts/
│   │   ├── page.tsx              # Accounts list (searchable table)
│   │   └── [id]/page.tsx         # Account detail + lines table
│   ├── lines/
│   │   └── [id]/page.tsx         # Line detail + actions + history
│   ├── api/
│   │   ├── accounts/[id]/        # External API: GET account
│   │   ├── lines/[id]/           # External API: GET line, usage, history, actions
│   │   ├── agent-log/            # External API: POST agent logs
│   │   └── internal/             # Internal API routes (no auth, used by UI)
│   ├── layout.tsx                # Root layout with nav
│   ├── page.tsx                  # Redirects to /accounts
│   └── globals.css               # Tailwind + theme
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   └── auth.ts                   # API key validation
prisma/
├── schema.prisma                 # Data model
├── seed.ts                       # Seed script (20 accounts)
└── migrations/                   # Migration files
```

---

## Re-seeding the Database

To reset and re-seed:

```bash
npx prisma migrate reset --force
npm run seed
```

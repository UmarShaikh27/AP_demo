import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  suspended: "bg-danger/15 text-danger border-danger/30",
  past_due: "bg-warning/15 text-warning border-warning/30",
};

const simStatusColors: Record<string, string> = {
  active: "bg-success/15 text-success",
  inactive: "bg-muted/15 text-muted",
  suspended: "bg-danger/15 text-danger",
  swap_pending: "bg-warning/15 text-warning",
};

const signalColors: Record<string, string> = {
  normal: "text-success",
  no_service: "text-danger",
  limited: "text-warning",
};

export default async function AccountDetailPage({ params }: Props) {
  const { id } = await params;
  const accountId = parseInt(id, 10);
  if (isNaN(accountId)) notFound();

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      lines: {
        include: {
          features: true,
          _count: { select: { action_history: true } },
        },
      },
    },
  });

  if (!account) notFound();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted mb-6">
        <Link href="/accounts" className="hover:text-foreground transition-colors">Accounts</Link>
        <span>/</span>
        <span className="text-foreground">{account.account_holder_name}</span>
      </div>

      {/* Header Card */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold text-foreground">{account.account_holder_name}</h1>
              <span className={`inline-block px-2 py-0.5 rounded text-[0.65rem] font-semibold uppercase tracking-wider border ${statusColors[account.account_status] || ""}`}>
                {account.account_status === "past_due" ? "PAST DUE" : account.account_status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-secondary">
              <div>
                <span className="text-muted mr-1">Email:</span>
                {account.email}
              </div>
              <div>
                <span className="text-muted mr-1">Phone:</span>
                <span className="font-mono">{account.phone}</span>
              </div>
              <div>
                <span className="text-muted mr-1">Account ID:</span>
                <span className="font-mono">#{account.id}</span>
              </div>
              <div>
                <span className="text-muted mr-1">Created:</span>
                {new Date(account.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{account.lines.length}</div>
              <div className="text-[0.6rem] text-muted uppercase tracking-wider">Lines</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lines Table */}
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">Lines</h2>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Line ID</th>
                <th>Phone Number</th>
                <th>Type</th>
                <th>Plan</th>
                <th>Data Usage</th>
                <th>SIM Status</th>
                <th>Signal</th>
                <th>Network</th>
                <th>History</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {account.lines.map((line) => {
                const usagePercent = Math.round((line.data_used_gb_this_cycle / line.plan_data_limit_gb) * 100);
                const usageColor = usagePercent >= 100 ? "bg-danger" : usagePercent >= 85 ? "bg-warning" : "bg-primary";

                return (
                  <tr key={line.id} className="group">
                    <td className="font-mono text-xs text-muted">{line.id}</td>
                    <td>
                      <Link href={`/lines/${line.id}`} className="font-mono text-sm text-foreground hover:text-primary transition-colors">
                        {line.phone_number}
                      </Link>
                    </td>
                    <td>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[0.6rem] font-medium uppercase tracking-wider ${
                        line.esim_or_physical === "esim" ? "bg-accent/15 text-accent" : "bg-surface-hover text-text-secondary"
                      }`}>
                        {line.esim_or_physical}
                      </span>
                    </td>
                    <td className="text-xs">{line.plan_name}</td>
                    <td>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${usageColor} transition-all`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                        </div>
                        <span className={`text-[0.65rem] font-mono font-medium ${usagePercent >= 100 ? "text-danger" : usagePercent >= 85 ? "text-warning" : "text-text-secondary"}`}>
                          {usagePercent}%
                        </span>
                      </div>
                      <div className="text-[0.6rem] text-muted mt-0.5">
                        {line.data_used_gb_this_cycle}GB / {line.plan_data_limit_gb}GB
                      </div>
                    </td>
                    <td>
                      <span className={`inline-block px-2 py-0.5 rounded text-[0.65rem] font-semibold uppercase tracking-wider ${simStatusColors[line.sim_status] || ""}`}>
                        {line.sim_status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                          line.signal_status === "normal" ? "bg-success" : line.signal_status === "no_service" ? "bg-danger animate-pulse" : "bg-warning animate-pulse"
                        }`} />
                        <span className={`text-xs ${signalColors[line.signal_status] || ""}`}>
                          {line.signal_status === "no_service" ? "No Service" : line.signal_status.charAt(0).toUpperCase() + line.signal_status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs text-text-secondary">{line.network_provider}</td>
                    <td>
                      <span className="text-xs text-muted">{line._count.action_history}</span>
                    </td>
                    <td>
                      <Link
                        href={`/lines/${line.id}`}
                        className="opacity-0 group-hover:opacity-100 text-xs text-primary hover:text-primary-hover transition-all"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

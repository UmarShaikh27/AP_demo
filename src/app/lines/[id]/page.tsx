"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface LineFeature {
  id: number;
  feature_name: string;
  enabled: boolean;
}

interface ActionHistoryEntry {
  id: number;
  action_type: string;
  performed_by: string;
  timestamp: string;
  details: string;
  result: string;
}

interface LineDetail {
  id: number;
  account_id: number;
  phone_number: string;
  iccid: string;
  esim_or_physical: string;
  plan_name: string;
  plan_data_limit_gb: number;
  data_used_gb_this_cycle: number;
  sim_status: string;
  network_provider: string;
  signal_status: string;
  activation_date: string;
  billing_cycle_start_day: number;
  features: LineFeature[];
  action_history: ActionHistoryEntry[];
  account: {
    id: number;
    account_holder_name: string;
    email: string;
    account_status: string;
  };
}

const simStatusColors: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  inactive: "bg-muted/15 text-muted border-muted/30",
  suspended: "bg-danger/15 text-danger border-danger/30",
  swap_pending: "bg-warning/15 text-warning border-warning/30",
};

const signalConfig: Record<string, { color: string; dot: string; label: string }> = {
  normal: { color: "text-success", dot: "bg-success", label: "Normal" },
  no_service: { color: "text-danger", dot: "bg-danger animate-pulse", label: "No Service" },
  limited: { color: "text-warning", dot: "bg-warning animate-pulse", label: "Limited" },
};

const actionTypeLabels: Record<string, string> = {
  sim_swap: "SIM Swap",
  network_change: "Network Change",
  plan_change: "Plan Change",
  feature_toggle: "Feature Toggle",
  troubleshoot_reset: "Troubleshoot Reset",
};

export default function LineDetailPage() {
  const { id } = useParams();
  const [line, setLine] = useState<LineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newIccid, setNewIccid] = useState("");
  const [newNetwork, setNewNetwork] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLine = useCallback(async () => {
    const res = await fetch(`/api/internal/lines/${id}`);
    if (res.ok) {
      const data = await res.json();
      setLine(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchLine();
  }, [fetchLine]);

  const performAction = async (
    endpoint: string,
    body: Record<string, unknown> | null,
    actionName: string
  ) => {
    setActionLoading(actionName);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data.result === "success") {
        toast.success(`${actionName} completed successfully`);
      } else {
        toast.error(`${actionName} failed — ${data.details || "Please try again"}`);
      }
      await fetchLine();
    } catch {
      toast.error(`${actionName} request failed`);
    }
    setActionLoading(null);
  };

  const handleSimSwap = () => {
    if (!newIccid || newIccid.length < 10) {
      toast.error("Enter a valid ICCID (at least 10 digits)");
      return;
    }
    performAction(`/api/internal/lines/${id}/actions/sim-swap`, { new_iccid: newIccid }, "SIM Swap");
    setNewIccid("");
  };

  const handleNetworkChange = () => {
    if (!newNetwork) {
      toast.error("Select a network provider");
      return;
    }
    performAction(`/api/internal/lines/${id}/actions/network-change`, { network_provider: newNetwork }, "Network Change");
    setNewNetwork("");
  };

  const handleTroubleshoot = () => {
    performAction(`/api/internal/lines/${id}/actions/troubleshoot-reset`, null, "Troubleshoot Reset");
  };

  const handleFeatureToggle = (featureId: number, featureName: string) => {
    performAction(`/api/internal/lines/${id}/features/${featureId}/toggle`, null, `Toggle ${featureName}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!line) {
    return (
      <div className="text-center py-20 text-muted">
        <p className="text-lg">Line not found</p>
      </div>
    );
  }

  const usagePercent = Math.round((line.data_used_gb_this_cycle / line.plan_data_limit_gb) * 100);
  const usageColor = usagePercent >= 100 ? "bg-danger" : usagePercent >= 85 ? "bg-warning" : "bg-primary";
  const signal = signalConfig[line.signal_status] || signalConfig.normal;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted mb-6">
        <Link href="/accounts" className="hover:text-foreground transition-colors">Accounts</Link>
        <span>/</span>
        <Link href={`/accounts/${line.account_id}`} className="hover:text-foreground transition-colors">
          {line.account.account_holder_name}
        </Link>
        <span>/</span>
        <span className="text-foreground font-mono">{line.phone_number}</span>
      </div>

      {/* Line Header */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold text-foreground font-mono">{line.phone_number}</h1>
              <span className={`inline-block px-2 py-0.5 rounded text-[0.65rem] font-semibold uppercase tracking-wider border ${simStatusColors[line.sim_status] || ""}`}>
                {line.sim_status.replace("_", " ")}
              </span>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[0.6rem] font-medium uppercase tracking-wider ${
                line.esim_or_physical === "esim" ? "bg-accent/15 text-accent" : "bg-surface-hover text-text-secondary"
              }`}>
                {line.esim_or_physical}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-xs text-text-secondary mt-3">
              <div>
                <span className="text-muted block text-[0.6rem] uppercase tracking-wider mb-0.5">ICCID</span>
                <span className="font-mono text-[0.7rem]">{line.iccid}</span>
              </div>
              <div>
                <span className="text-muted block text-[0.6rem] uppercase tracking-wider mb-0.5">Network</span>
                {line.network_provider}
              </div>
              <div>
                <span className="text-muted block text-[0.6rem] uppercase tracking-wider mb-0.5">Signal</span>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${signal.dot}`} />
                  <span className={signal.color}>{signal.label}</span>
                </div>
              </div>
              <div>
                <span className="text-muted block text-[0.6rem] uppercase tracking-wider mb-0.5">Activated</span>
                {new Date(line.activation_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Usage + Features */}
        <div className="lg:col-span-1 space-y-6">
          {/* Data Usage Card */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Data Usage This Cycle</h3>
            <div className="mb-3">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-2xl font-bold text-foreground">{line.data_used_gb_this_cycle} <span className="text-sm font-normal text-muted">GB</span></span>
                <span className="text-sm text-muted">of {line.plan_data_limit_gb} GB</span>
              </div>
              <div className="w-full h-3 bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${usageColor} transition-all duration-500`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className={`text-xs font-semibold ${usagePercent >= 100 ? "text-danger" : usagePercent >= 85 ? "text-warning" : "text-primary"}`}>
                  {usagePercent}% used
                </span>
                <span className="text-xs text-muted">
                  Cycle day {line.billing_cycle_start_day}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted border-t border-border pt-2 mt-2">
              <span className="font-medium text-text-secondary">{line.plan_name}</span>
            </div>
          </div>

          {/* Features Card */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Features</h3>
            <div className="space-y-2">
              {line.features.map((feature) => (
                <div key={feature.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-foreground">{feature.feature_name}</span>
                  <button
                    onClick={() => handleFeatureToggle(feature.id, feature.feature_name)}
                    disabled={actionLoading !== null}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                      feature.enabled ? "bg-primary" : "bg-border-light"
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                      feature.enabled ? "translate-x-4.5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Actions Panel */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Actions</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SIM Swap */}
              <div className="border border-border rounded-lg p-3">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Swap SIM
                </h4>
                <p className="text-[0.7rem] text-muted mb-2">Replace the current SIM with a new ICCID</p>
                <input
                  type="text"
                  value={newIccid}
                  onChange={(e) => setNewIccid(e.target.value)}
                  placeholder="New ICCID (e.g. 89014103..."
                  className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 mb-2"
                />
                <button
                  onClick={handleSimSwap}
                  disabled={actionLoading !== null}
                  className="w-full px-3 py-1.5 rounded bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === "SIM Swap" ? "Processing..." : "Execute SIM Swap"}
                </button>
              </div>

              {/* Network Change */}
              <div className="border border-border rounded-lg p-3">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
                  </svg>
                  Change Network
                </h4>
                <p className="text-[0.7rem] text-muted mb-2">Switch to a different carrier network</p>
                <select
                  value={newNetwork}
                  onChange={(e) => setNewNetwork(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 mb-2"
                >
                  <option value="">Select provider...</option>
                  {["T-Mobile", "AT&T", "Verizon"].filter(n => n !== line.network_provider).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button
                  onClick={handleNetworkChange}
                  disabled={actionLoading !== null}
                  className="w-full px-3 py-1.5 rounded bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === "Network Change" ? "Processing..." : "Change Network"}
                </button>
              </div>

              {/* Troubleshoot Reset */}
              <div className="border border-border rounded-lg p-3 md:col-span-2">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Troubleshoot / Network Reset
                </h4>
                <p className="text-[0.7rem] text-muted mb-3">
                  Performs a full network profile refresh and signal reset. Resolves most connectivity issues.
                  {line.signal_status !== "normal" && (
                    <span className="text-warning ml-1">(Signal currently {line.signal_status === "no_service" ? "has no service" : "is limited"})</span>
                  )}
                </p>
                <button
                  onClick={handleTroubleshoot}
                  disabled={actionLoading !== null}
                  className="px-4 py-1.5 rounded bg-warning/20 hover:bg-warning/30 text-warning border border-warning/30 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === "Troubleshoot Reset" ? "Resetting..." : "Reset Network Connection"}
                </button>
              </div>
            </div>
          </div>

          {/* Action History */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Action History</h3>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>By</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {line.action_history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted text-sm">No actions recorded</td>
                    </tr>
                  ) : (
                    line.action_history.map((entry) => (
                      <tr key={entry.id}>
                        <td className="text-xs text-muted font-mono whitespace-nowrap">
                          {new Date(entry.timestamp).toLocaleString("en-US", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </td>
                        <td>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-surface-hover text-[0.65rem] font-medium text-text-secondary">
                            {actionTypeLabels[entry.action_type] || entry.action_type}
                          </span>
                        </td>
                        <td className="text-xs text-text-secondary max-w-[300px] truncate">{entry.details}</td>
                        <td className="text-xs font-mono text-muted">{entry.performed_by}</td>
                        <td>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[0.6rem] font-semibold uppercase ${
                            entry.result === "success" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                          }`}>
                            {entry.result}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface AccountRow {
  id: number;
  account_holder_name: string;
  email: string;
  phone: string;
  account_status: string;
  created_at: string;
  _count: { lines: number };
}

const statusColors: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  suspended: "bg-danger/15 text-danger border-danger/30",
  past_due: "bg-warning/15 text-warning border-warning/30",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/internal/accounts?${params}`);
    const data = await res.json();
    setAccounts(data);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchAccounts, 300);
    return () => clearTimeout(timeout);
  }, [fetchAccounts]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Subscriber Accounts</h1>
        <p className="text-xs text-muted mt-1">Manage all subscriber accounts and their lines</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-0.5">
          {["all", "active", "suspended", "past_due"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {s === "all" ? "All" : s === "past_due" ? "Past Due" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-4">
        <div className="text-xs text-muted">
          <span className="font-medium text-foreground">{accounts.length}</span> accounts
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr className="bg-surface">
                <th>ID</th>
                <th>Account Holder</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Lines</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted text-sm">
                    <div className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2"></div>
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted text-sm">No accounts found</td>
                </tr>
              ) : (
                accounts.map((a) => (
                  <tr key={a.id} className="group cursor-pointer">
                    <td className="font-mono text-xs text-muted">{a.id}</td>
                    <td>
                      <Link href={`/accounts/${a.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                        {a.account_holder_name}
                      </Link>
                    </td>
                    <td className="text-text-secondary text-xs">{a.email}</td>
                    <td className="font-mono text-xs text-text-secondary">{a.phone}</td>
                    <td>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-surface-hover text-xs font-medium text-foreground">
                        {a._count.lines}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-block px-2 py-0.5 rounded text-[0.65rem] font-semibold uppercase tracking-wider border ${statusColors[a.account_status] || "bg-surface text-muted border-border"}`}>
                        {a.account_status === "past_due" ? "PAST DUE" : a.account_status}
                      </span>
                    </td>
                    <td className="text-xs text-muted">
                      {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td>
                      <Link
                        href={`/accounts/${a.id}`}
                        className="opacity-0 group-hover:opacity-100 text-xs text-primary hover:text-primary-hover transition-all"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

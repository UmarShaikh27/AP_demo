import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Link from "next/link";

export const metadata: Metadata = {
  title: "US Mobile Admin Portal (Demo)",
  description: "Internal admin tool for managing subscriber accounts, SIM lines, and network operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1d27",
              color: "#e4e4e7",
              border: "1px solid #2a2e3e",
              fontSize: "0.8125rem",
            },
          }}
        />
        {/* Top Nav */}
        <nav className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
          <div className="max-w-[1400px] mx-auto px-4 h-12 flex items-center gap-6">
            <Link href="/accounts" className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary text-white text-xs font-bold">
                US
              </span>
              <span className="hidden sm:inline">US Mobile Admin</span>
              <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium uppercase tracking-wider">
                Demo
              </span>
            </Link>
            <div className="flex items-center gap-1 text-xs">
              <Link
                href="/accounts"
                className="px-3 py-1.5 rounded-md text-text-secondary hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                Accounts
              </Link>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-[0.65rem] text-muted font-mono">agent_demo</span>
              <div className="w-6 h-6 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center">
                <span className="text-[0.6rem] text-primary font-semibold">AD</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-[1400px] mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id } = await params;
  const accountId = parseInt(id, 10);

  if (isNaN(accountId)) {
    return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
  }

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      lines: {
        select: {
          id: true,
          phone_number: true,
          plan_name: true,
          plan_data_limit_gb: true,
          data_used_gb_this_cycle: true,
          sim_status: true,
          signal_status: true,
          network_provider: true,
          esim_or_physical: true,
        },
      },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: account.id,
    account_holder_name: account.account_holder_name,
    email: account.email,
    phone: account.phone,
    account_status: account.account_status,
    created_at: account.created_at,
    lines_count: account.lines.length,
    lines: account.lines.map((line) => ({
      id: line.id,
      phone_number: line.phone_number,
      plan_name: line.plan_name,
      data_used_gb: line.data_used_gb_this_cycle,
      data_limit_gb: line.plan_data_limit_gb,
      percent_used: Math.round((line.data_used_gb_this_cycle / line.plan_data_limit_gb) * 100),
      sim_status: line.sim_status,
      signal_status: line.signal_status,
      network_provider: line.network_provider,
      type: line.esim_or_physical,
    })),
  });
}

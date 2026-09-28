import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/auth";
import { buildLineWhere } from "@/lib/lookup";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Line identifier required" }, { status: 400 });
  }

  const line = await prisma.line.findFirst({
    where: buildLineWhere(id),
    include: {
      features: {
        select: {
          id: true,
          feature_name: true,
          enabled: true,
        },
      },
      action_history: {
        orderBy: { timestamp: "desc" },
        take: 10,
        select: {
          id: true,
          action_type: true,
          performed_by: true,
          timestamp: true,
          details: true,
          result: true,
        },
      },
    },
  });

  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: line.id,
    account_id: line.account_id,
    phone_number: line.phone_number,
    iccid: line.iccid,
    imei: line.imei,
    type: line.esim_or_physical,
    plan_name: line.plan_name,
    plan_data_limit_gb: line.plan_data_limit_gb,
    data_used_gb_this_cycle: line.data_used_gb_this_cycle,
    percent_used: line.plan_data_limit_gb >= 999
      ? null
      : Math.round((line.data_used_gb_this_cycle / line.plan_data_limit_gb) * 100),
    sim_status: line.sim_status,
    network_provider: line.network_provider,
    signal_status: line.signal_status,
    activation_date: line.activation_date,
    billing_cycle_start_day: line.billing_cycle_start_day,
    features: line.features,
    recent_actions: line.action_history,
  });

}

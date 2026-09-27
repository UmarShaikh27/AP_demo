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
  const lineId = parseInt(id, 10);

  if (isNaN(lineId)) {
    return NextResponse.json({ error: "Invalid line ID" }, { status: 400 });
  }

  const line = await prisma.line.findUnique({
    where: { id: lineId },
    select: {
      data_used_gb_this_cycle: true,
      plan_data_limit_gb: true,
      billing_cycle_start_day: true,
    },
  });

  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  return NextResponse.json({
    data_used_gb: line.data_used_gb_this_cycle,
    data_limit_gb: line.plan_data_limit_gb,
    percent_used: Math.round((line.data_used_gb_this_cycle / line.plan_data_limit_gb) * 100),
    billing_cycle_start_day: line.billing_cycle_start_day,
  });
}

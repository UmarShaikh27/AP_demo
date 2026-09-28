import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/auth";
import { buildLineWhere } from "@/lib/lookup";
import { NextRequest, NextResponse } from "next/server";

const VALID_PLANS: Record<string, number> = {
  "Unlimited Premium": 999,
  "Unlimited Starter": 70,
  "Unlimited Flex":    10,
};

function nextOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `ORD-${rand}-${ts}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Line identifier required" }, { status: 400 });
  }

  const body = await request.json();
  const { plan_name } = body;

  if (!plan_name || !(plan_name in VALID_PLANS)) {
    return NextResponse.json(
      {
        error: "plan_name must be one of: Unlimited Premium, Unlimited Starter, Unlimited Flex",
        valid_plans: Object.keys(VALID_PLANS),
      },
      { status: 400 }
    );
  }

  const line = await prisma.line.findFirst({ where: buildLineWhere(id) });
  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  const newDataLimit = VALID_PLANS[plan_name];
  const now = new Date();

  // Create a new order
  const order = await prisma.order.create({
    data: {
      order_id: nextOrderId(),
      line_id: line.id,
      plan_name,
      plan_data_limit_gb: newDataLimit,
      order_type: "new_plan",
      purchased_at: now,
      cycle_start: now,
    },
  });

  // Update the line: new plan, zero usage, reset cycle day
  await prisma.line.update({
    where: { id: line.id },
    data: {
      plan_name,
      plan_data_limit_gb: newDataLimit,
      data_used_gb_this_cycle: 0,
      billing_cycle_start_day: 1,
    },
  });

  // Log action history
  const history = await prisma.actionHistory.create({
    data: {
      line_id: line.id,
      action_type: "plan_change",
      performed_by: "ai_agent",
      details: `Plan changed from "${line.plan_name}" to "${plan_name}" — cycle reset, new order ${order.order_id}`,
      result: "success",
    },
  });

  return NextResponse.json({
    action_id: history.id,
    action_type: "plan_change",
    result: "success",
    details: history.details,
    order_id: order.order_id,
    phone_number: line.phone_number,
    previous_plan: line.plan_name,
    new_plan: plan_name,
    new_data_limit_gb: newDataLimit,
    cycle_reset: true,
    usage_reset: true,
    timestamp: history.timestamp,
  });
}

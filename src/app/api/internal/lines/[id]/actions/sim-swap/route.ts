import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lineId = parseInt(id, 10);
  const body = await request.json();
  const { new_iccid } = body;

  if (!new_iccid) {
    return NextResponse.json({ error: "new_iccid is required" }, { status: 400 });
  }

  const line = await prisma.line.findUnique({ where: { id: lineId } });
  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  // Simulate ~90% success rate
  const success = Math.random() < 0.9;

  if (success) {
    await prisma.line.update({
      where: { id: lineId },
      data: {
        iccid: new_iccid,
        sim_status: "active",
      },
    });
  }

  const history = await prisma.actionHistory.create({
    data: {
      line_id: lineId,
      action_type: "sim_swap",
      performed_by: "agent_demo",
      details: success
        ? `SIM swapped from ${line.iccid} to ${new_iccid}`
        : `SIM swap to ${new_iccid} failed — verification error`,
      result: success ? "success" : "failed",
    },
  });

  return NextResponse.json({
    id: history.id,
    action_type: "sim_swap",
    result: success ? "success" : "failed",
    details: history.details,
    new_iccid: success ? new_iccid : null,
    previous_iccid: line.iccid,
  });
}

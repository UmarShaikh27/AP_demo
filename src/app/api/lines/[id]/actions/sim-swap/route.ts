import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
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

  const body = await request.json();
  const { new_iccid, new_imei } = body;

  if (!new_iccid) {
    return NextResponse.json({ error: "new_iccid is required" }, { status: 400 });
  }

  const line = await prisma.line.findUnique({ where: { id: lineId } });
  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

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
      performed_by: "ai_agent",
      details: success
        ? `SIM swapped from ${line.iccid} to ${new_iccid}${new_imei ? ` (IMEI: ${new_imei})` : ""}`
        : `SIM swap to ${new_iccid} failed — verification error`,
      result: success ? "success" : "failed",
    },
  });

  return NextResponse.json({
    action_id: history.id,
    action_type: "sim_swap",
    result: success ? "success" : "failed",
    details: history.details,
    new_iccid: success ? new_iccid : null,
    previous_iccid: line.iccid,
    timestamp: history.timestamp,
  });
}

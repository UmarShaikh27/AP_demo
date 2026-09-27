import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lineId = parseInt(id, 10);

  const line = await prisma.line.findUnique({ where: { id: lineId } });
  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  // ~85% chance of resolving signal back to normal
  const success = Math.random() < 0.85;

  if (success) {
    await prisma.line.update({
      where: { id: lineId },
      data: { signal_status: "normal" },
    });
  }

  const history = await prisma.actionHistory.create({
    data: {
      line_id: lineId,
      action_type: "troubleshoot_reset",
      performed_by: "agent_demo",
      details: success
        ? `Network reset successful — signal restored to normal (was: ${line.signal_status})`
        : `Network reset attempted but signal remains ${line.signal_status} — escalation may be needed`,
      result: success ? "success" : "failed",
    },
  });

  return NextResponse.json({
    id: history.id,
    action_type: "troubleshoot_reset",
    result: success ? "success" : "failed",
    details: history.details,
    signal_status: success ? "normal" : line.signal_status,
    previous_signal_status: line.signal_status,
  });
}

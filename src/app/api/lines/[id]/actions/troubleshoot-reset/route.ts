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
      performed_by: "ai_agent",
      details: success
        ? `Network reset successful — signal restored to normal (was: ${line.signal_status})`
        : `Network reset attempted but signal remains ${line.signal_status} — escalation may be needed`,
      result: success ? "success" : "failed",
    },
  });

  return NextResponse.json({
    action_id: history.id,
    action_type: "troubleshoot_reset",
    result: success ? "success" : "failed",
    details: history.details,
    signal_status: success ? "normal" : line.signal_status,
    previous_signal_status: line.signal_status,
    timestamp: history.timestamp,
  });
}

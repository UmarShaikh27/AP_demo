import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { line_id, case_type, action_taken, confidence_score, handle_time_seconds, outcome } = body;

  if (!case_type || !action_taken || confidence_score === undefined || handle_time_seconds === undefined || !outcome) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        required: ["case_type", "action_taken", "confidence_score", "handle_time_seconds", "outcome"],
        optional: ["line_id"],
      },
      { status: 400 }
    );
  }

  // Validate line_id if provided
  if (line_id) {
    const line = await prisma.line.findUnique({ where: { id: line_id } });
    if (!line) {
      return NextResponse.json({ error: "Line not found" }, { status: 404 });
    }
  }

  const log = await prisma.agentLog.create({
    data: {
      line_id: line_id || null,
      case_type,
      action_taken,
      confidence_score: parseFloat(confidence_score),
      handle_time_seconds: parseInt(handle_time_seconds, 10),
      outcome,
    },
  });

  return NextResponse.json({
    id: log.id,
    line_id: log.line_id,
    case_type: log.case_type,
    action_taken: log.action_taken,
    confidence_score: log.confidence_score,
    handle_time_seconds: log.handle_time_seconds,
    outcome: log.outcome,
    timestamp: log.timestamp,
  }, { status: 201 });
}

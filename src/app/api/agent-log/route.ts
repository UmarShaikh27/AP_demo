import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/auth";
import { buildLineWhere } from "@/lib/lookup";
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

  const { line_id, phone_number, case_type, action_taken, confidence_score, handle_time_seconds, outcome } = body;

  if (!case_type || !action_taken || confidence_score === undefined || handle_time_seconds === undefined || !outcome) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        required: ["case_type", "action_taken", "confidence_score", "handle_time_seconds", "outcome"],
        optional: ["line_id", "phone_number"],
      },
      { status: 400 }
    );
  }

  // Validate and resolve line_id if provided as ID or phone number
  let resolvedLineId: number | null = null;
  const lineIdentifier = line_id || phone_number;

  if (lineIdentifier) {
    const line = await prisma.line.findFirst({ where: buildLineWhere(String(lineIdentifier)) });
    if (!line) {
      return NextResponse.json({ error: "Line not found" }, { status: 404 });
    }
    resolvedLineId = line.id;
  }

  const log = await prisma.agentLog.create({
    data: {
      line_id: resolvedLineId,
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

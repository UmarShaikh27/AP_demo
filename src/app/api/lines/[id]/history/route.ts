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
    select: { id: true },
  });

  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  const history = await prisma.actionHistory.findMany({
    where: { line_id: lineId },
    orderBy: { timestamp: "desc" },
    select: {
      id: true,
      action_type: true,
      performed_by: true,
      timestamp: true,
      details: true,
      result: true,
    },
  });

  return NextResponse.json({
    line_id: lineId,
    total_entries: history.length,
    history,
  });
}

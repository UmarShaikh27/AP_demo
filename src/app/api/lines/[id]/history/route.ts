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
    select: { id: true, phone_number: true },
  });

  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  const history = await prisma.actionHistory.findMany({
    where: { line_id: line.id },
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
    line_id: line.id,
    phone_number: line.phone_number,
    total_entries: history.length,
    history,
  });
}

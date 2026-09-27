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
  const { network_provider } = body;

  const validProviders = ["T-Mobile", "AT&T", "Verizon"];
  if (!network_provider || !validProviders.includes(network_provider)) {
    return NextResponse.json(
      { error: "network_provider must be one of: T-Mobile, AT&T, Verizon" },
      { status: 400 }
    );
  }

  const line = await prisma.line.findUnique({ where: { id: lineId } });
  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  const success = Math.random() < 0.9;

  if (success) {
    await prisma.line.update({
      where: { id: lineId },
      data: { network_provider },
    });
  }

  const history = await prisma.actionHistory.create({
    data: {
      line_id: lineId,
      action_type: "network_change",
      performed_by: "ai_agent",
      details: success
        ? `Network changed from ${line.network_provider} to ${network_provider}`
        : `Network change to ${network_provider} failed — provisioning timeout`,
      result: success ? "success" : "failed",
    },
  });

  return NextResponse.json({
    action_id: history.id,
    action_type: "network_change",
    result: success ? "success" : "failed",
    details: history.details,
    new_network_provider: success ? network_provider : null,
    previous_network_provider: line.network_provider,
    timestamp: history.timestamp,
  });
}

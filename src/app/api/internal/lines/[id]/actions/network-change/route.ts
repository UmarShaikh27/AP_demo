import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lineId = parseInt(id, 10);
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
      performed_by: "agent_demo",
      details: success
        ? `Network changed from ${line.network_provider} to ${network_provider}`
        : `Network change to ${network_provider} failed — provisioning timeout`,
      result: success ? "success" : "failed",
    },
  });

  return NextResponse.json({
    id: history.id,
    action_type: "network_change",
    result: success ? "success" : "failed",
    details: history.details,
    new_network_provider: success ? network_provider : null,
    previous_network_provider: line.network_provider,
  });
}

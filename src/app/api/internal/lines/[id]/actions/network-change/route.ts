import { prisma } from "@/lib/prisma";
import { buildLineWhere } from "@/lib/lookup";
import { NextRequest, NextResponse } from "next/server";

function generateICCID(): string {
  let iccid = "8901";
  for (let i = 0; i < 16; i++) iccid += Math.floor(Math.random() * 10);
  return iccid; // 20 digits
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Line identifier required" }, { status: 400 });
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

  const line = await prisma.line.findFirst({ where: buildLineWhere(id) });
  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  // Network swap always generates a new ICCID (IMEI stays the same)
  const newIccid = generateICCID();

  const success = Math.random() < 0.9;

  if (success) {
    await prisma.line.update({
      where: { id: line.id },
      data: {
        network_provider,
        iccid: newIccid,
      },
    });
  }

  const history = await prisma.actionHistory.create({
    data: {
      line_id: line.id,
      action_type: "network_change",
      performed_by: "agent_demo",
      details: success
        ? `Network changed from ${line.network_provider} to ${network_provider} — new ICCID: ${newIccid}`
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
    new_iccid: success ? newIccid : null,
    previous_iccid: line.iccid,
  });
}

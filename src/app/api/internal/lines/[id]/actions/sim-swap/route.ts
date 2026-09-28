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
  const { imei } = body;

  if (!imei || String(imei).replace(/\D/g, "").length !== 15) {
    return NextResponse.json(
      { error: "A valid 15-digit IMEI is required to perform a SIM swap" },
      { status: 400 }
    );
  }

  const line = await prisma.line.findFirst({ where: buildLineWhere(id) });
  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  // Generate a fresh ICCID automatically
  const newIccid = generateICCID();

  // Simulate ~90% success rate
  const success = Math.random() < 0.9;

  if (success) {
    await prisma.line.update({
      where: { id: line.id },
      data: {
        iccid: newIccid,
        imei: String(imei).replace(/\D/g, ""),
        sim_status: "active",
      },
    });
  }

  const history = await prisma.actionHistory.create({
    data: {
      line_id: line.id,
      action_type: "sim_swap",
      performed_by: "agent_demo",
      details: success
        ? `SIM swap completed — IMEI updated to ${imei}, new ICCID: ${newIccid}`
        : `SIM swap failed — IMEI ${imei} could not be verified`,
      result: success ? "success" : "failed",
    },
  });

  return NextResponse.json({
    id: history.id,
    action_type: "sim_swap",
    result: success ? "success" : "failed",
    details: history.details,
    new_iccid: success ? newIccid : null,
    new_imei: success ? String(imei).replace(/\D/g, "") : null,
    previous_iccid: line.iccid,
    previous_imei: line.imei,
  });
}

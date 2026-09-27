import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; featureId: string }> }
) {
  const { id, featureId } = await params;
  const lineId = parseInt(id, 10);
  const fId = parseInt(featureId, 10);

  const feature = await prisma.lineFeature.findFirst({
    where: { id: fId, line_id: lineId },
  });

  if (!feature) {
    return NextResponse.json({ error: "Feature not found" }, { status: 404 });
  }

  const newEnabled = !feature.enabled;

  await prisma.lineFeature.update({
    where: { id: fId },
    data: { enabled: newEnabled },
  });

  await prisma.actionHistory.create({
    data: {
      line_id: lineId,
      action_type: "feature_toggle",
      performed_by: "agent_demo",
      details: `${feature.feature_name} ${newEnabled ? "enabled" : "disabled"}`,
      result: "success",
    },
  });

  return NextResponse.json({
    feature_id: fId,
    feature_name: feature.feature_name,
    enabled: newEnabled,
    result: "success",
  });
}

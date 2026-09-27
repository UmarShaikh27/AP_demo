import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; featureId: string }> }
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id, featureId } = await params;
  const lineId = parseInt(id, 10);
  const fId = parseInt(featureId, 10);

  if (isNaN(lineId) || isNaN(fId)) {
    return NextResponse.json({ error: "Invalid line or feature ID" }, { status: 400 });
  }

  const feature = await prisma.lineFeature.findFirst({
    where: { id: fId, line_id: lineId },
  });

  if (!feature) {
    return NextResponse.json({ error: "Feature not found for this line" }, { status: 404 });
  }

  const newEnabled = !feature.enabled;

  await prisma.lineFeature.update({
    where: { id: fId },
    data: { enabled: newEnabled },
  });

  const history = await prisma.actionHistory.create({
    data: {
      line_id: lineId,
      action_type: "feature_toggle",
      performed_by: "ai_agent",
      details: `${feature.feature_name} ${newEnabled ? "enabled" : "disabled"}`,
      result: "success",
    },
  });

  return NextResponse.json({
    action_id: history.id,
    feature_id: fId,
    feature_name: feature.feature_name,
    enabled: newEnabled,
    result: "success",
    timestamp: history.timestamp,
  });
}

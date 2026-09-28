import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/auth";
import { buildLineWhere } from "@/lib/lookup";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; featureId: string }> }
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id, featureId } = await params;
  if (!id || !featureId) {
    return NextResponse.json({ error: "Line and feature identifiers required" }, { status: 400 });
  }

  const line = await prisma.line.findFirst({ where: buildLineWhere(id) });
  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  const decodedFeature = decodeURIComponent(featureId).trim();
  const fId = parseInt(decodedFeature, 10);
  const isNumericFeatureId = !isNaN(fId) && String(fId) === decodedFeature;

  const feature = await prisma.lineFeature.findFirst({
    where: {
      line_id: line.id,
      ...(isNumericFeatureId
        ? { OR: [{ id: fId }, { feature_name: decodedFeature }] }
        : { feature_name: decodedFeature }),
    },
  });

  if (!feature) {
    return NextResponse.json({ error: "Feature not found for this line" }, { status: 404 });
  }

  const newEnabled = !feature.enabled;

  await prisma.lineFeature.update({
    where: { id: feature.id },
    data: { enabled: newEnabled },
  });

  const history = await prisma.actionHistory.create({
    data: {
      line_id: line.id,
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

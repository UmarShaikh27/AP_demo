import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lineId = parseInt(id, 10);

  const line = await prisma.line.findUnique({
    where: { id: lineId },
    include: {
      account: {
        select: {
          id: true,
          account_holder_name: true,
          email: true,
          account_status: true,
        },
      },
      features: true,
      action_history: {
        orderBy: { timestamp: "desc" },
      },
    },
  });

  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  return NextResponse.json(line);
}

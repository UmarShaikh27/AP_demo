import { prisma } from "@/lib/prisma";
import { buildLineWhere } from "@/lib/lookup";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Line identifier required" }, { status: 400 });
  }

  const line = await prisma.line.findFirst({
    where: buildLineWhere(id),
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
      orders: {
        orderBy: { purchased_at: "desc" },
      },
    },
  });


  if (!line) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  return NextResponse.json(line);
}

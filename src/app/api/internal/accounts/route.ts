import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where: Record<string, unknown> = {};

  if (status && status !== "all") {
    where.account_status = status;
  }

  if (search) {
    where.OR = [
      { account_holder_name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      {
        lines: {
          some: {
            phone_number: { contains: search },
          },
        },
      },
    ];
  }

  const accounts = await prisma.account.findMany({
    where,
    include: {
      _count: { select: { lines: true } },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(accounts);
}

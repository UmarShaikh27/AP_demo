import { NextRequest, NextResponse } from "next/server";

export function validateApiKey(request: NextRequest): NextResponse | null {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    return NextResponse.json(
      { error: "Server misconfiguration: API_KEY not set" },
      { status: 500 }
    );
  }

  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing API key" },
      { status: 401 }
    );
  }

  return null; // Valid
}

import { NextResponse } from "next/server";
import { getDraws } from "@/features/draws/repository";
export async function GET() {
  try {
    return NextResponse.json(await getDraws());
  } catch {
    return NextResponse.json(
      { error: "Draw data unavailable" },
      { status: 503 },
    );
  }
}

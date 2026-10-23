import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";

// Banks Axis can pay, for the bank field's suggestions. Not user data.
export async function GET(req: NextRequest) {
  if (!brainConfigured()) return NextResponse.json({ banks: [] });
  try {
    const { status, data } = await brain(req, "banks");
    return NextResponse.json(status === 200 ? data : { banks: [] }, {
      headers: { "cache-control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ banks: [] });
  }
}

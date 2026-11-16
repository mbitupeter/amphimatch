import { NextResponse } from "next/server";
import { AMPHIBIANS } from "@/lib/amphibians";
import { MODEL_INFO } from "@/lib/inference";

export async function GET() {
  return NextResponse.json({ model: MODEL_INFO, species: AMPHIBIANS });
}

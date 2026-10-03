import { NextResponse } from "next/server";
import { repository } from "@/lib/data/repository";

export async function POST() {
  repository.reset();
  return NextResponse.json({ success: true, message: "Demo ledger reset to initial seed state." });
}

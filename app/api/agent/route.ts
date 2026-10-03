import { NextRequest, NextResponse } from "next/server";
import { AgentOrchestrator } from "@/lib/agent/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, message, selectedOrderId, asOfDateIso } = body;

    if (!customerId || !message) {
      return NextResponse.json(
        { error: "customerId and message are required fields." },
        { status: 400 }
      );
    }

    const result = AgentOrchestrator.process({
      customerId,
      message,
      selectedOrderId,
      asOfDateIso
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal agent processing failure" },
      { status: 500 }
    );
  }
}

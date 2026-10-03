import { DetectedIntent, IntentCategory } from "@/types/agent";

export class IntentParser {
  /**
   * Deterministic & multi-intent parser capable of decomposing composite customer requests
   */
  public static parse(message: string): {
    intents: DetectedIntent[];
    hasPromptInjection: boolean;
    extractedOrderId?: string;
    extractedAmount?: number;
    extractedAddress?: string;
  } {
    const text = message.toLowerCase();
    const intents: DetectedIntent[] = [];

    // 1. Prompt Injection & Override Detection
    const injectionPatterns = [
      /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions/i,
      /reveal\s+(?:your\s+)?(?:system\s+prompt|rules|instructions)/i,
      /override\s+(?:policy|rules|safety|limits)/i,
      /act\s+as\s+(?:an?\s+)?admin/i,
      /bypass\s+(?:the\s+)?(?:rules|firewall|guardrails)/i,
      /disregard\s+(?:previous|all)/i,
      /system\s*:\s*role\s*=\s*root/i,
      /you\s+are\s+now\s+in\s+developer\s+mode/i
    ];

    const hasPromptInjection = injectionPatterns.some((pattern) => pattern.test(message));
    if (hasPromptInjection) {
      intents.push({
        intent: "PROMPT_INJECTION",
        confidence: 0.99,
        rawTextSegment: "Prompt injection / policy bypass attempt detected in user prompt.",
        riskSignal: true
      });
    }

    // 2. Order ID Extraction (NM-XXXX)
    const orderMatch = message.match(/NM-\d{4}/i);
    const extractedOrderId = orderMatch ? orderMatch[0].toUpperCase() : undefined;

    // 3. Amount Extraction (₹XXXX or numbers)
    const amountMatch = message.match(/(?:₹|rs\.?|inr\s*)\s*(\d{1,3}(?:,\d{3})*|\d+)/i) || message.match(/refund\s+(\d{3,6})/i);
    let extractedAmount: number | undefined;
    if (amountMatch) {
      const cleanNum = amountMatch[1].replace(/,/g, "");
      extractedAmount = parseInt(cleanNum, 10);
    }

    // 4. Address Change Extraction
    if (
      text.includes("change my delivery address") ||
      text.includes("change address") ||
      text.includes("change the address") ||
      text.includes("deliver to") ||
      text.includes("ship to bangalore") ||
      text.includes("new address")
    ) {
      const addressMatch = message.match(/(?:address\s+to|deliver\s+to|ship\s+to)\s+([^.,\n]+)/i);
      const extractedAddress = addressMatch ? addressMatch[1].trim() : "Requested new address in message";
      intents.push({
        intent: "ADDRESS_CHANGE",
        confidence: 0.95,
        rawTextSegment: addressMatch ? addressMatch[0] : "change delivery address",
        addressMentioned: extractedAddress,
        riskSignal: false
      });
    }

    // 5. Delivery Dispute Intent
    if (
      text.includes("never arrived") ||
      text.includes("not received") ||
      text.includes("didn't receive") ||
      text.includes("haven't received") ||
      text.includes("package missing") ||
      text.includes("where is my order") ||
      text.includes("never received the package") ||
      text.includes("did not arrive") ||
      text.includes("tracking says delivered")
    ) {
      intents.push({
        intent: "DELIVERY_DISPUTE",
        confidence: 0.96,
        rawTextSegment: "Claiming package not received / delivery dispute",
        orderIdMentioned: extractedOrderId,
        riskSignal: true
      });
    }

    // 6. Refund Intent
    if (
      text.includes("refund") ||
      text.includes("money back") ||
      text.includes("reimburse") ||
      text.includes("credit back")
    ) {
      intents.push({
        intent: "REFUND",
        confidence: 0.98,
        rawTextSegment: "Customer requesting financial refund",
        orderIdMentioned: extractedOrderId,
        amountMentioned: extractedAmount
      });
    }

    // 7. Return Intent
    if (
      text.includes("return") ||
      text.includes("take it back") ||
      text.includes("send back") ||
      text.includes("exchange")
    ) {
      if (!intents.some((i) => i.intent === "RETURN")) {
        intents.push({
          intent: "RETURN",
          confidence: 0.94,
          rawTextSegment: "Customer requesting item return/pickup",
          orderIdMentioned: extractedOrderId
        });
      }
    }

    // 8. Warranty / Defect Intent
    if (
      text.includes("warranty") ||
      text.includes("flickering") ||
      text.includes("broken") ||
      text.includes("screen") ||
      text.includes("defect") ||
      text.includes("stopped working") ||
      text.includes("hardware issue") ||
      text.includes("not turning on") ||
      text.includes("repair")
    ) {
      intents.push({
        intent: "WARRANTY",
        confidence: 0.93,
        rawTextSegment: "Hardware defect / malfunction reported within warranty window",
        orderIdMentioned: extractedOrderId
      });
    }

    // 9. Fallback if no specific intent matched
    if (intents.length === 0) {
      intents.push({
        intent: "GENERAL_QUERY",
        confidence: 0.85,
        rawTextSegment: message.slice(0, 100)
      });
    }

    return {
      intents,
      hasPromptInjection,
      extractedOrderId,
      extractedAmount,
      extractedAddress: intents.find((i) => i.intent === "ADDRESS_CHANGE")?.addressMentioned
    };
  }
}

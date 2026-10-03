export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
export type TicketCategory = "DELIVERY" | "REFUND" | "RETURN" | "PAYMENT" | "WARRANTY";

export interface SupportTicket {
  id: string;
  customerId: string;
  orderId?: string;
  status: TicketStatus;
  category: TicketCategory;
  createdAt: string;
  summary: string;
  riskFlags: string[];
}

export interface ConversationMessage {
  id: string;
  customerId: string;
  orderId?: string;
  role: "CUSTOMER" | "AGENT";
  message: string;
  createdAt: string;
}

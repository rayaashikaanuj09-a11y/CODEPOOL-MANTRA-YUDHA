import { NextRequest, NextResponse } from "next/server";
import { repository } from "@/lib/data/repository";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId") || "CUST-1001";

  const customer = repository.getCustomerById(customerId);
  const orders = repository.getOrdersByCustomerId(customerId);
  const tickets = repository.getOpenTicketsByCustomer(customerId);
  const conversations = repository.getConversationsByCustomer(customerId);
  const allCustomers = repository.getCustomers();
  const policies = repository.getPolicies();
  const actions = repository.getActions();

  return NextResponse.json({
    customer,
    orders,
    tickets,
    conversations,
    allCustomers,
    policies,
    actions
  });
}

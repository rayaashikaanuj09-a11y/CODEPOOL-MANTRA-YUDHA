import { Customer } from "@/types/customer";
import { Order } from "@/types/order";
import { Product } from "@/types/product";
import { Policy, PolicyCategory } from "@/types/policy";
import { SupportTicket, ConversationMessage } from "@/types/ticket";
import { ActionRecord } from "@/types/action";

import rawCustomers from "@/data/customers.json";
import rawOrders from "@/data/orders.json";
import rawProducts from "@/data/products.json";
import rawPolicies from "@/data/policies.json";
import rawTickets from "@/data/tickets.json";
import rawConversations from "@/data/conversations.json";
import rawActions from "@/data/actions.json";

class DataRepository {
  private customers: Customer[] = [];
  private orders: Order[] = [];
  private products: Product[] = [];
  private policies: Policy[] = [];
  private tickets: SupportTicket[] = [];
  private conversations: ConversationMessage[] = [];
  private actions: ActionRecord[] = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.customers = JSON.parse(JSON.stringify(rawCustomers)) as Customer[];
    this.orders = JSON.parse(JSON.stringify(rawOrders)) as Order[];
    this.products = JSON.parse(JSON.stringify(rawProducts)) as Product[];
    this.policies = JSON.parse(JSON.stringify(rawPolicies)) as Policy[];
    this.tickets = JSON.parse(JSON.stringify(rawTickets)) as SupportTicket[];
    this.conversations = JSON.parse(JSON.stringify(rawConversations)) as ConversationMessage[];
    this.actions = JSON.parse(JSON.stringify(rawActions)) as ActionRecord[];
  }

  // --- Customers ---
  public getCustomers(): Customer[] {
    return [...this.customers];
  }

  public getCustomerById(id: string): Customer | null {
    return this.customers.find((c) => c.id === id) || null;
  }

  // --- Orders ---
  public getOrdersByCustomerId(customerId: string): Order[] {
    return this.orders.filter((o) => o.customerId === customerId);
  }

  public getOrderById(orderId: string, requestingCustomerId?: string): Order | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;
    if (requestingCustomerId && order.customerId !== requestingCustomerId) {
      // Identity & Ownership violation! Never return order data across customers
      return null;
    }
    return order;
  }

  public updateOrder(order: Order): void {
    const idx = this.orders.findIndex((o) => o.id === order.id);
    if (idx !== -1) {
      this.orders[idx] = { ...order };
    }
  }

  // --- Products ---
  public getProductById(productId: string): Product | null {
    return this.products.find((p) => p.id === productId) || null;
  }

  public getAllProducts(): Product[] {
    return [...this.products];
  }

  // --- Policies ---
  public getPolicies(): Policy[] {
    return [...this.policies];
  }

  /**
   * Policy selection algorithm:
   * 1. Filter by category
   * 2. Select policy where status is ACTIVE and effectiveFrom <= targetDate < effectiveTo
   * 3. Fallback to active policy if no exact match
   */
  public getPolicyForCategory(category: PolicyCategory, targetDateIso: string = new Date().toISOString()): Policy | null {
    const catPolicies = this.policies.filter((p) => p.category === category);
    const targetTime = new Date(targetDateIso).getTime();

    // Look for policy effective at target date
    const matched = catPolicies.find((p) => {
      const fromTime = new Date(p.effectiveFrom).getTime();
      const toTime = p.effectiveTo ? new Date(p.effectiveTo).getTime() : Infinity;
      return targetTime >= fromTime && targetTime <= toTime;
    });

    if (matched) return matched;

    // Default to active policy
    const active = catPolicies.find((p) => p.status === "ACTIVE");
    return active || null;
  }

  public getActivePolicy(category: PolicyCategory): Policy | null {
    return this.policies.find((p) => p.category === category && p.status === "ACTIVE") || null;
  }

  // --- Tickets ---
  public getOpenTicketsByCustomer(customerId: string): SupportTicket[] {
    return this.tickets.filter((t) => t.customerId === customerId && t.status !== "RESOLVED");
  }

  public addTicket(ticket: SupportTicket): void {
    this.tickets.unshift(ticket);
  }

  // --- Conversations ---
  public getConversationsByCustomer(customerId: string): ConversationMessage[] {
    return this.conversations.filter((m) => m.customerId === customerId);
  }

  public addConversationMessage(message: ConversationMessage): void {
    this.conversations.push(message);
  }

  // --- Actions ---
  public getActions(): ActionRecord[] {
    return [...this.actions];
  }

  public recordAction(action: ActionRecord): void {
    this.actions.unshift(action);
  }

  public getActionById(actionId: string): ActionRecord | null {
    return this.actions.find((a) => a.id === actionId) || null;
  }
}

// Global singleton for demo runtime
const globalRepoKey = Symbol.for("novamart.repository");
const globalRepo = global as unknown as { [globalRepoKey]?: DataRepository };

if (!globalRepo[globalRepoKey]) {
  globalRepo[globalRepoKey] = new DataRepository();
}

export const repository = globalRepo[globalRepoKey]!;

"use client";

import React, { useState, useEffect } from "react";
import { Customer } from "@/types/customer";
import { Order } from "@/types/order";
import { SupportTicket, ConversationMessage } from "@/types/ticket";
import { DecisionReceipt } from "@/types/agent";

import { CustomerContextPanel } from "@/components/CustomerContextPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { DecisionReceiptPanel } from "@/components/DecisionReceiptPanel";

export default function Home() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("CUST-1001");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);

  const [receipt, setReceipt] = useState<DecisionReceipt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeProcessingStep, setActiveProcessingStep] = useState<string | undefined>(undefined);

  // Load customer context data
  const loadContext = async (customerId: string) => {
    try {
      const res = await fetch(`/api/context?customerId=${customerId}`);
      const data = await res.json();
      if (data.customer) {
        setSelectedCustomer(data.customer);
      }
      if (data.allCustomers) {
        setCustomers(data.allCustomers);
      }
      setOrders(data.orders || []);
      setTickets(data.tickets || []);
      setConversations(data.conversations || []);
      if (data.orders && data.orders.length > 0) {
        setSelectedOrderId(data.orders[0].id);
      }
    } catch (err) {
      console.error("Failed to load context:", err);
    }
  };

  useEffect(() => {
    loadContext(selectedCustomerId);
  }, [selectedCustomerId]);

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  const handleResetData = async () => {
    try {
      await fetch("/api/reset", { method: "POST" });
      await loadContext(selectedCustomerId);
      setReceipt(null);
    } catch (err) {
      console.error("Failed to reset demo data:", err);
    }
  };

  const handleSendMessage = async (message: string, customerId?: string, orderId?: string) => {
    const custId = customerId || selectedCustomerId;
    setIsLoading(true);
    setActiveProcessingStep("Decomposing multi-intent request...");

    // Optimistically show user message in UI immediately
    const optimisticMsg: ConversationMessage = {
      id: `OPT-${Date.now()}`,
      customerId: custId,
      orderId: orderId || selectedOrderId,
      role: "CUSTOMER",
      message,
      createdAt: new Date().toISOString()
    };
    setConversations((prev) => [...prev, optimisticMsg]);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: custId,
          message,
          selectedOrderId: orderId || selectedOrderId
        })
      });

      const data = await response.json();

      if (data.receipt) {
        setReceipt(data.receipt);
      }

      // Refresh context to pull updated orders / tickets / conversations
      await loadContext(custId);
    } catch (error) {
      console.error("Agent error:", error);
    } finally {
      setIsLoading(false);
      setActiveProcessingStep(undefined);
    }
  };

  if (!selectedCustomer) {
    return (
      <main className="h-screen w-screen flex items-center justify-center bg-[#10141B] text-zinc-400 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FF6B5B] animate-ping" />
          <span>Booting NovaMart TrustDesk Control Plane...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen flex flex-row overflow-hidden bg-[#10141B]">
      {/* Zone 1: Customer Context Panel (Left) */}
      <CustomerContextPanel
        customers={customers}
        selectedCustomer={selectedCustomer}
        orders={orders}
        tickets={tickets}
        onSelectCustomer={handleSelectCustomer}
        onSelectOrder={handleSelectOrder}
        selectedOrderId={selectedOrderId}
        onResetData={handleResetData}
      />

      {/* Zone 2: Central Resolution Workspace (Center) */}
      <ChatPanel
        selectedCustomer={selectedCustomer}
        conversations={conversations}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        activeProcessingStep={activeProcessingStep}
        onSelectCustomer={handleSelectCustomer}
        selectedOrderId={selectedOrderId}
      />

      {/* Zone 3: Decision Receipt & Governance Plane (Right) */}
      <DecisionReceiptPanel
        receipt={receipt}
        isLoading={isLoading}
      />
    </main>
  );
}

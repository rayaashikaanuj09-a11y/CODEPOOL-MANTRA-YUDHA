"use client";

import React from "react";
import { Customer } from "@/types/customer";
import { Order } from "@/types/order";
import { SupportTicket } from "@/types/ticket";
import { 
  User, 
  ShieldCheck, 
  Package, 
  Ticket, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Truck
} from "lucide-react";

interface Props {
  customers: Customer[];
  selectedCustomer: Customer;
  orders: Order[];
  tickets: SupportTicket[];
  onSelectCustomer: (customerId: string) => void;
  onSelectOrder?: (orderId: string) => void;
  selectedOrderId?: string;
  onResetData: () => void;
}

export const CustomerContextPanel: React.FC<Props> = ({
  customers,
  selectedCustomer,
  orders,
  tickets,
  onSelectCustomer,
  onSelectOrder,
  selectedOrderId,
  onResetData
}) => {
  return (
    <aside className="w-80 flex-shrink-0 flex flex-col h-full bg-[#141821] border-r border-white/[0.08] overflow-y-auto">
      {/* Panel Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User size={16} className="text-[#FF6B5B]" />
          <h2 className="text-xs font-bold tracking-wider uppercase text-zinc-300">
            Customer Context
          </h2>
        </div>
        <button
          onClick={onResetData}
          title="Reset database to seed baseline"
          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition"
        >
          <RotateCcw size={11} />
          Reset Demo
        </button>
      </div>

      {/* Customer Switcher */}
      <div className="p-4 border-b border-white/[0.08]">
        <label className="text-[11px] font-semibold text-zinc-400 mb-2 block uppercase tracking-wider">
          Active Customer Profile
        </label>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {customers.map((c) => {
            const isSelected = c.id === selectedCustomer.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCustomer(c.id)}
                className={`text-left p-2 rounded-lg border text-xs transition relative ${
                  isSelected
                    ? "bg-[#181D26] border-[#FF6B5B] text-white shadow-sm"
                    : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                <div className="font-semibold truncate">{c.name.split(" ")[0]}</div>
                <div className="text-[10px] text-zinc-400 flex items-center justify-between mt-0.5">
                  <span>{c.id}</span>
                  <span
                    className={`font-semibold ${
                      c.loyaltyTier === "GOLD"
                        ? "text-amber-400"
                        : c.loyaltyTier === "SILVER"
                        ? "text-zinc-300"
                        : "text-zinc-400"
                    }`}
                  >
                    {c.loyaltyTier}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Customer Identity Card */}
        <div className="p-3 rounded-xl bg-[#181D26] border border-white/[0.08] text-xs">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#F7F4EF]">{selectedCustomer.name}</h3>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{selectedCustomer.id}</p>
            </div>
            <span
              className={`badge text-[10px] ${
                selectedCustomer.loyaltyTier === "GOLD"
                  ? "tier-gold"
                  : selectedCustomer.loyaltyTier === "SILVER"
                  ? "tier-silver"
                  : "tier-standard"
              }`}
            >
              <Sparkles size={10} />
              {selectedCustomer.loyaltyTier} TIER
            </span>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] space-y-1.5 text-[11px] text-zinc-400">
            <div className="flex justify-between">
              <span>Email:</span>
              <span className="text-zinc-300 font-mono">{selectedCustomer.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Phone:</span>
              <span className="text-zinc-300 font-mono">{selectedCustomer.phoneMasked}</span>
            </div>
            <div className="flex justify-between">
              <span>Member Since:</span>
              <span className="text-zinc-300">
                {new Date(selectedCustomer.accountCreatedAt).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric"
                })}
              </span>
            </div>
          </div>

          {/* Risk Flags */}
          {selectedCustomer.refundRiskFlags.length > 0 ? (
            <div className="mt-2.5 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-semibold mb-1">
                <AlertTriangle size={11} />
                ACCOUNT RISK SIGNALS
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedCustomer.refundRiskFlags.map((flag) => (
                  <span
                    key={flag}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center gap-1.5 text-emerald-400 text-[10px]">
              <ShieldCheck size={12} />
              <span>Good account standing · No risk flags</span>
            </div>
          )}
        </div>
      </div>

      {/* Orders Section */}
      <div className="p-4 border-b border-white/[0.08] flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            <Package size={13} className="text-[#FF6B5B]" />
            <span>Orders ({orders.length})</span>
          </div>
          <span className="text-[10px] text-zinc-400">Database Truth</span>
        </div>

        <div className="space-y-2.5">
          {orders.map((ord) => {
            const isDelivered = ord.status === "DELIVERED";
            const isSelected = selectedOrderId === ord.id;
            return (
              <div
                key={ord.id}
                onClick={() => onSelectOrder?.(ord.id)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                  isSelected
                    ? "bg-[#181D26] border-[#FF6B5B]"
                    : "bg-[#181D26]/70 border-white/[0.08] hover:border-white/[0.15]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-zinc-200">{ord.id}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isDelivered
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                    }`}
                  >
                    {ord.status}
                  </span>
                </div>

                <div className="mt-1.5 text-zinc-300 font-medium truncate">
                  {ord.items[0]?.productName}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="text-white font-semibold">₹{ord.totalAmount.toLocaleString("en-IN")}</span>
                  <span>{new Date(ord.placedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>

                {/* Delivery Verification Proof Tag */}
                {ord.deliveryProof && (
                  <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-zinc-400 truncate">
                      <Truck size={11} className="text-[#FF6B5B]" />
                      <span className="truncate">{ord.deliveryProof.carrier}</span>
                    </div>
                    {ord.deliveryProof.otpVerified ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 size={10} />
                        OTP Verified
                      </span>
                    ) : (
                      <span className="text-zinc-400">Standard</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Open Support Tickets Section */}
      <div className="p-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            <Ticket size={13} className="text-amber-400" />
            <span>Open Tickets ({tickets.length})</span>
          </div>
        </div>

        {tickets.length === 0 ? (
          <p className="text-[11px] text-zinc-400 italic">No unresolved tickets for this customer.</p>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-2.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/20 text-xs text-zinc-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400">{t.id}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                    {t.status}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{t.summary}</p>
                {t.riskFlags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {t.riskFlags.map((rf) => (
                      <span key={rf} className="text-[9px] px-1 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        {rf}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

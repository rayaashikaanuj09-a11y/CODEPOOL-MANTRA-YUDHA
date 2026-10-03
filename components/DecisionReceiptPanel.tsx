"use client";

import React, { useState } from "react";
import { DecisionReceipt, EvidenceItem } from "@/types/agent";
import { TerminalActionBadge } from "./TerminalActionBadge";
import { 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  HelpCircle,
  History,
  Layers,
  FileSpreadsheet,
  ArrowRight
} from "lucide-react";

interface Props {
  receipt: DecisionReceipt | null;
  isLoading: boolean;
}

export const DecisionReceiptPanel: React.FC<Props> = ({ receipt, isLoading }) => {
  const [activeTab, setActiveTab] = useState<"summary" | "firewall" | "evidence" | "timeMachine" | "handoff">("summary");
  const [copiedHandoff, setCopiedHandoff] = useState(false);

  if (isLoading) {
    return (
      <aside className="w-96 flex-shrink-0 flex flex-col h-full bg-[#141821] border-l border-white/[0.08] p-6 items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#FF6B5B]/15 border border-[#FF6B5B]/30 flex items-center justify-center text-[#FF6B5B] animate-pulse mb-3">
          <ShieldCheck size={24} />
        </div>
        <h3 className="text-sm font-bold text-white">Compiling Decision Receipt</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
          Running Action Firewall evaluation, Policy Time Machine lookup, and cryptographic ledger verification...
        </p>
      </aside>
    );
  }

  if (!receipt) {
    return (
      <aside className="w-96 flex-shrink-0 flex flex-col h-full bg-[#141821] border-l border-white/[0.08] p-6 items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3">
          <FileText size={24} />
        </div>
        <h3 className="text-sm font-bold text-zinc-300">Decision Receipt Awaiting Trigger</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
          Select any sample scenario or send a customer message to generate a governed verification receipt.
        </p>
      </aside>
    );
  }

  const handleCopyHandoff = () => {
    if (!receipt.humanHandoffPack) return;
    navigator.clipboard.writeText(JSON.stringify(receipt.humanHandoffPack, null, 2));
    setCopiedHandoff(true);
    setTimeout(() => setCopiedHandoff(false), 2000);
  };

  return (
    <aside className="w-96 flex-shrink-0 flex flex-col h-full bg-[#141821] border-l border-white/[0.08] overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-white/[0.08] bg-[#11151C]/80 backdrop-blur">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-[#FF6B5B]" />
            <h2 className="text-xs font-bold tracking-wider uppercase text-zinc-200">
              Decision Receipt
            </h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {receipt.receiptId}
          </span>
        </div>
        <p className="text-[10px] text-zinc-400">
          Generated {new Date(receipt.timestamp).toLocaleTimeString("en-IN")} · Immutable Audit Artifact
        </p>

        {/* Tab Controls */}
        <div className="flex gap-1 mt-3 p-1 rounded-lg bg-black/30 border border-white/[0.06] text-[11px] overflow-x-auto">
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-2.5 py-1 rounded font-semibold transition whitespace-nowrap ${
              activeTab === "summary"
                ? "bg-[#181D26] text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("firewall")}
            className={`px-2.5 py-1 rounded font-semibold transition whitespace-nowrap flex items-center gap-1 ${
              activeTab === "firewall"
                ? "bg-[#181D26] text-[#FF6B5B] shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShieldCheck size={11} />
            Action Firewall
          </button>
          <button
            onClick={() => setActiveTab("evidence")}
            className={`px-2.5 py-1 rounded font-semibold transition whitespace-nowrap flex items-center gap-1 ${
              activeTab === "evidence"
                ? "bg-[#181D26] text-sky-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers size={11} />
            Evidence Layer
          </button>
          <button
            onClick={() => setActiveTab("timeMachine")}
            className={`px-2.5 py-1 rounded font-semibold transition whitespace-nowrap flex items-center gap-1 ${
              activeTab === "timeMachine"
                ? "bg-[#181D26] text-amber-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <History size={11} />
            Time Machine
          </button>
          {receipt.humanHandoffPack && (
            <button
              onClick={() => setActiveTab("handoff")}
              className={`px-2.5 py-1 rounded font-semibold transition whitespace-nowrap flex items-center gap-1 ${
                activeTab === "handoff"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "text-rose-400/70 hover:text-rose-300"
              }`}
            >
              <AlertTriangle size={11} />
              Handoff Pack
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= TAB 1: SUMMARY ================= */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            {/* Terminal Action Hero Badge */}
            <TerminalActionBadge action={receipt.terminalAction} />

            {/* Action Reason */}
            <div className="p-3 rounded-xl bg-[#181D26] border border-white/[0.08] text-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Authoritative Reason
              </span>
              <p className="text-zinc-200 leading-relaxed font-medium">
                {receipt.actionReason}
              </p>
            </div>

            {/* Intents Detected */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Decomposed Intents ({receipt.intents.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {receipt.intents.map((i, idx) => (
                  <span
                    key={idx}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      i.intent === "PROMPT_INJECTION"
                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                        : i.intent === "DELIVERY_DISPUTE"
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        : "bg-white/[0.06] text-zinc-300 border-white/[0.08]"
                    }`}
                  >
                    {i.intent}
                  </span>
                ))}
              </div>
            </div>

            {/* Policy Applied Card */}
            <div className="p-3 rounded-xl bg-[#181D26] border border-white/[0.08] text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Governing Policy
                </span>
                <span className="text-[10px] font-mono text-[#FF6B5B] font-bold">
                  {receipt.policyApplied.category} v{receipt.policyApplied.version}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                {receipt.policyApplied.humanReadableSummary}
              </p>
            </div>

            {/* Financial Calculation Trace (if applicable) */}
            {receipt.calculationTrace && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-[11px]">
                  <Calculator size={13} className="text-[#FF6B5B]" />
                  <span>Refund Formula Execution</span>
                </div>
                <div className="font-mono text-[10px] text-zinc-400 p-2 rounded bg-black/50 border border-white/[0.04]">
                  Max Refund = min(Requested, Order - Existing - RestockingFee)
                </div>
                <div className="space-y-1 text-[11px] text-zinc-400">
                  <div className="flex justify-between">
                    <span>Order Total:</span>
                    <span className="text-zinc-200 font-mono">₹{receipt.calculationTrace.orderTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Restocking Fee ({receipt.calculationTrace.restockingFeePercent}%):</span>
                    <span className="text-rose-400 font-mono">- ₹{receipt.calculationTrace.restockingFeeAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-white/[0.06] pt-1 text-white">
                    <span>Permitted Ceiling:</span>
                    <span className="text-emerald-400 font-mono">₹{receipt.calculationTrace.maxCalculatedRefund.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* "Why Not?" Explanation Box (Visible if blocked or escalated) */}
            {receipt.whyNot && (
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                  <XCircle size={14} />
                  <span>{receipt.whyNot.headline}</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div>
                    <span className="text-zinc-400">Blocked Action: </span>
                    <strong className="text-rose-300 font-mono">{receipt.whyNot.blockedAction}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">Conflict Reason: </span>
                    <span className="text-zinc-200">{receipt.whyNot.conflictReason}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Next Step: </span>
                    <span className="text-emerald-300 font-medium">{receipt.whyNot.recommendedNextStep}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Executed & Verified Actions Ledger */}
            {receipt.executedActions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Action Ledger Trace ({receipt.executedActions.length})
                </span>
                {receipt.executedActions.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-400 text-[11px]">{act.id}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                        {act.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-300 truncate">
                      Type: <strong className="text-zinc-100">{act.type}</strong>
                    </div>
                    {act.verificationProof && (
                      <p className="text-[10px] text-emerald-300/90 pt-1 border-t border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        {act.verificationProof.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: ACTION FIREWALL ================= */}
        {activeTab === "firewall" && (
          <div className="space-y-4 text-xs">
            {/* Firewall Banner */}
            <div className={`p-3 rounded-xl border text-xs ${
              receipt.actionFirewall.firewallStatus === "ALLOWED"
                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                : "bg-rose-950/20 border-rose-500/30 text-rose-300"
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                {receipt.actionFirewall.firewallStatus === "ALLOWED" ? (
                  <ShieldCheck size={16} className="text-emerald-400" />
                ) : (
                  <ShieldAlert size={16} className="text-rose-400" />
                )}
                <span>Gate Status: {receipt.actionFirewall.firewallStatus}</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                {receipt.actionFirewall.gateStatement}
              </p>
            </div>

            {/* Architectural Contrast: LLM Proposal vs System Authority */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Proposal vs Authority Separation
              </span>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
                <div className="text-[10px] text-[#FF927F] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>1. LLM Layer (Proposer)</span>
                </div>
                {receipt.actionFirewall.proposedActions.length === 0 ? (
                  <p className="text-zinc-400 text-[11px] italic">No sensitive actions proposed by model.</p>
                ) : (
                  <div className="space-y-1">
                    {receipt.actionFirewall.proposedActions.map((pa, idx) => (
                      <div key={idx} className="p-2 rounded bg-white/[0.04] text-[11px] font-mono text-zinc-200">
                        {pa.actionType} {pa.requestedAmount ? `(₹${pa.requestedAmount.toLocaleString("en-IN")})` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-center my-1 text-zinc-500">
                <ArrowRight size={14} className="rotate-90" />
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>2. Action Firewall (Authority Gate)</span>
                </div>
                {receipt.actionFirewall.authorizedActions.length === 0 ? (
                  <p className="text-zinc-400 text-[11px] italic">Zero actions authorized.</p>
                ) : (
                  <div className="space-y-1">
                    {receipt.actionFirewall.authorizedActions.map((aa, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded text-[11px] border flex items-center justify-between ${
                          aa.status === "ALLOWED"
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                            : aa.status === "ESCALATED"
                            ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                            : "bg-rose-950/20 border-rose-500/30 text-rose-300"
                        }`}
                      >
                        <span className="font-mono font-semibold">{aa.actionType}</span>
                        <span className="font-bold text-[10px] uppercase">{aa.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Evaluated Checks */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Deterministic Validation Checks ({receipt.actionFirewall.checks.length})
              </span>
              <div className="space-y-1.5">
                {receipt.actionFirewall.checks.map((chk, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#181D26] border border-white/[0.06] text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">{chk.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          chk.status === "PASSED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : chk.status === "BLOCKED"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {chk.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">{chk.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: EVIDENCE LAYER ================= */}
        {activeTab === "evidence" && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#181D26] border border-white/[0.08] text-[11px] text-zinc-300 leading-relaxed">
              <strong className="text-white block mb-0.5">Truth Classification Model</strong>
              Distinguishes customer narrative from database facts, statutory policy, and verified execution proofs.
            </div>

            <div className="space-y-2">
              {receipt.evidenceList.map((ev) => {
                const isConflict = ev.status === "CONFLICT";
                const isVerified = ev.status === "VERIFIED";
                const isBlocked = ev.status === "BLOCKED";

                return (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-xl border space-y-1 ${
                      isConflict
                        ? "bg-rose-950/20 border-rose-500/40 text-rose-200"
                        : isVerified
                        ? "bg-[#181D26] border-white/[0.08] text-zinc-200"
                        : isBlocked
                        ? "bg-rose-950/10 border-rose-500/20 text-rose-300"
                        : "bg-black/30 border-white/[0.06] text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-[#FF927F] font-bold">
                        {ev.category.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                          isVerified
                            ? "bg-emerald-500/20 text-emerald-400"
                            : isConflict
                            ? "bg-rose-500/25 text-rose-300 animate-pulse"
                            : "bg-white/[0.06] text-zinc-400"
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-white">{ev.label}</div>
                    <div className="text-[11px] text-zinc-300 leading-relaxed font-mono">{ev.value}</div>
                    <div className="text-[9px] text-zinc-500 pt-1 border-t border-white/[0.04] flex justify-between">
                      <span>Source: {ev.source}</span>
                      <span>{ev.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 4: POLICY TIME MACHINE ================= */}
        {activeTab === "timeMachine" && receipt.policyTimeMachine && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <History size={14} />
                <span>Policy Time Machine Resolution</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                {receipt.policyTimeMachine.explanation}
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#181D26] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Applicable Historical Version
                  </span>
                  <span className="badge badge-act text-[9px]">ENFORCED</span>
                </div>
                <div className="font-mono font-bold text-sm text-[#FF6B5B]">
                  {receipt.policyTimeMachine.applicablePolicy.category} Policy v{receipt.policyTimeMachine.applicablePolicy.version}
                </div>
                <p className="text-[11px] text-zinc-300">
                  {receipt.policyTimeMachine.applicablePolicy.humanReadableSummary}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 opacity-80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Current Active Store Version
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    TODAY
                  </span>
                </div>
                <div className="font-mono font-bold text-sm text-zinc-300">
                  {receipt.policyTimeMachine.currentPolicy.category} Policy v{receipt.policyTimeMachine.currentPolicy.version}
                </div>
                <p className="text-[11px] text-zinc-400">
                  {receipt.policyTimeMachine.currentPolicy.humanReadableSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: HUMAN HANDOFF PACK ================= */}
        {activeTab === "handoff" && receipt.humanHandoffPack && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-rose-300 text-xs">Human Handoff Packet</h3>
                <span className="font-mono text-[10px] text-zinc-400">
                  #{receipt.humanHandoffPack.escalationId} · Severity: {receipt.humanHandoffPack.severity}
                </span>
              </div>
              <button
                onClick={handleCopyHandoff}
                className="btn-secondary text-[11px] py-1 px-2"
              >
                {copiedHandoff ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedHandoff ? "Copied" : "Copy JSON"}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                  Cryptographic Audit Hash
                </span>
                <span className="font-mono text-xs text-rose-400 font-bold bg-black/50 px-2 py-0.5 rounded border border-rose-500/20">
                  {receipt.humanHandoffPack.auditHash}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                  Detected Contradictions
                </span>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-200">
                  {receipt.humanHandoffPack.detectedContradictions.map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                  Blocked Sensitive Operations
                </span>
                <div className="flex flex-wrap gap-1">
                  {receipt.humanHandoffPack.blockedActions.map((b: string) => (
                    <span key={b} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                  Recommended Specialist Action
                </span>
                <p className="text-[11px] text-emerald-300 font-medium">
                  {receipt.humanHandoffPack.recommendedAgentAction}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/[0.08] bg-[#11151C]/90 text-[10px] text-zinc-500 flex items-center justify-between">
        <span>NovaMart TrustDesk Engine v2.4</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <CheckCircle2 size={10} /> Deterministic Ledger Synced
        </span>
      </div>
    </aside>
  );
};

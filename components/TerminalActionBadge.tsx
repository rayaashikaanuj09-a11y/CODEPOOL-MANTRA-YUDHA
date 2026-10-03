import React from "react";
import { TerminalAction } from "@/types/agent";
import { CheckCircle2, AlertOctagon, HelpCircle, MessageSquare } from "lucide-react";

interface Props {
  action: TerminalAction;
  size?: "sm" | "md" | "lg";
}

export const TerminalActionBadge: React.FC<Props> = ({ action, size = "md" }) => {
  const configs = {
    ACT: {
      label: "ACT — VERIFIED EXECUTION",
      desc: "Authorized action committed and ledger verified",
      badgeClass: "badge-act",
      icon: CheckCircle2,
      border: "border-emerald-500/40",
      bg: "bg-emerald-950/40",
      text: "text-emerald-400"
    },
    ESCALATE: {
      label: "ESCALATE — HUMAN HANDOFF",
      desc: "Exception, contradiction or safety boundary triggered",
      badgeClass: "badge-escalate",
      icon: AlertOctagon,
      border: "border-rose-500/40",
      bg: "bg-rose-950/40",
      text: "text-rose-400"
    },
    ASK: {
      label: "ASK — CLARIFICATION REQUIRED",
      desc: "Critical ambiguity or missing order parameter",
      badgeClass: "badge-ask",
      icon: HelpCircle,
      border: "border-sky-500/40",
      bg: "bg-sky-950/40",
      text: "text-sky-400"
    },
    ANSWER: {
      label: "ANSWER — VERIFIED INFORMATIONAL",
      desc: "Policy guidance delivered; no financial write needed",
      badgeClass: "badge-answer",
      icon: MessageSquare,
      border: "border-amber-500/40",
      bg: "bg-amber-950/40",
      text: "text-amber-400"
    }
  };

  const config = configs[action];
  const Icon = config.icon;

  if (size === "sm") {
    return (
      <span className={`badge ${config.badgeClass}`}>
        <Icon size={12} />
        {action}
      </span>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${config.border} ${config.bg}`}>
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg ${config.bg} border ${config.border}`}>
          <Icon size={18} className={config.text} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold tracking-wider ${config.text}`}>
              {config.label}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">{config.desc}</p>
        </div>
      </div>
      <span className={`badge ${config.badgeClass} text-[10px]`}>
        TERMINAL OUTCOME
      </span>
    </div>
  );
};

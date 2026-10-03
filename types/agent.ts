import { ActionRecord } from "./action";
import { Policy } from "./policy";

export type TerminalAction = "ANSWER" | "ASK" | "ACT" | "ESCALATE";

export type IntentCategory = 
  | "RETURN" 
  | "REFUND" 
  | "DELIVERY_DISPUTE" 
  | "ADDRESS_CHANGE" 
  | "WARRANTY" 
  | "ORDER_STATUS" 
  | "PROMPT_INJECTION"
  | "GENERAL_QUERY"
  | "UNKNOWN";

export interface DetectedIntent {
  intent: IntentCategory;
  confidence: number;
  rawTextSegment: string;
  orderIdMentioned?: string;
  amountMentioned?: number;
  addressMentioned?: string;
  riskSignal?: boolean;
}

export type EvidenceCategory = 
  | "CUSTOMER_CLAIM" 
  | "VERIFIED_DB_FACT" 
  | "POLICY_RULE" 
  | "ACTION_RESULT";

export interface EvidenceItem {
  id: string;
  category: EvidenceCategory;
  label: string;
  value: string;
  source: string;
  status: "VERIFIED" | "CONFLICT" | "UNVERIFIED" | "BLOCKED" | "INFO";
  timestamp: string;
}

export interface PolicyTimeMachineResult {
  orderPlacedAt: string;
  applicablePolicy: Policy;
  currentPolicy: Policy;
  versionMismatch: boolean;
  explanation: string;
}

export interface ActionFirewallCheck {
  name: string;
  status: "PASSED" | "BLOCKED" | "WARNING" | "SKIPPED";
  detail: string;
}

export interface ProposedAction {
  actionType: string;
  targetId?: string;
  requestedAmount?: number;
  requestedChanges?: Record<string, any>;
  origin: "LLM_PROPOSAL";
}

export interface ActionFirewallResult {
  proposedActions: ProposedAction[];
  authorizedActions: {
    actionType: string;
    authorizedAmount?: number;
    authorizedChanges?: Record<string, any>;
    status: "ALLOWED" | "BLOCKED" | "ESCALATED";
    reason: string;
  }[];
  checks: ActionFirewallCheck[];
  firewallStatus: "ALLOWED" | "BLOCKED" | "ESCALATED";
  gateStatement: string;
}

export interface DecisionTimelineEvent {
  time: string;
  step: string;
  description: string;
  status: "SUCCESS" | "WARNING" | "BLOCKED" | "INFO";
}

export interface WhyNotExplanation {
  headline: string;
  blockedAction: string;
  customerClaim: string;
  verifiedFacts: string[];
  conflictReason: string;
  governingPolicy: string;
  recommendedNextStep: string;
}

export interface HumanHandoffPack {
  escalationId: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  orderId?: string;
  caseCategory: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  customerClaims: string[];
  verifiedFacts: string[];
  detectedContradictions: string[];
  blockedActions: string[];
  governingPolicy: string;
  recommendedAgentAction: string;
  internalTicketId: string;
  auditHash: string;
  createdAt: string;
}

export interface DecisionReceipt {
  receiptId: string;
  timestamp: string;
  terminalAction: TerminalAction;
  actionReason: string;
  intents: DetectedIntent[];
  evidenceList: EvidenceItem[];
  policyApplied: Policy;
  policyTimeMachine?: PolicyTimeMachineResult;
  actionFirewall: ActionFirewallResult;
  timeline: DecisionTimelineEvent[];
  whyNot?: WhyNotExplanation;
  humanHandoffPack?: HumanHandoffPack;
  executedActions: ActionRecord[];
  calculationTrace?: {
    orderTotal: number;
    existingRefunds: number;
    restockingFeePercent: number;
    restockingFeeAmount: number;
    maxCalculatedRefund: number;
    approvedRefund: number;
    autoApprovalLimit: number;
    approvalThresholdExceeded: boolean;
  };
}

export interface AgentDecisionResponse {
  terminalAction: TerminalAction;
  customerMessage: string;
  receipt: DecisionReceipt;
}

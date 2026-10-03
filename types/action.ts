export type ActionType = 
  | "RETURN_CREATED" 
  | "REFUND_CREATED" 
  | "TICKET_CREATED" 
  | "ESCALATION_CREATED"
  | "ADDRESS_CHANGE_BLOCKED"
  | "REFUND_BLOCKED";

export type ActionStatus = "SUCCESS" | "FAILED" | "BLOCKED";

export interface ActionRecord {
  id: string;
  type: ActionType;
  customerId: string;
  orderId?: string;
  status: ActionStatus;
  createdAt: string;
  payload: Record<string, any>;
  verificationProof?: {
    verifiedAt: string;
    authority: "ACTION_FIREWALL";
    ruleEnforced: string;
    details: string;
  };
}

export type PolicyCategory = "RETURNS" | "REFUNDS" | "DELIVERY" | "WARRANTY";

export interface PolicyRules {
  standardReturnWindowDays?: number;
  goldTierExtensionDays?: number;
  restockingFeePercent?: number;
  autoRefundApprovalLimit?: number;
  requireReturnBeforeRefund?: boolean;
  otpDeliveryConflictRequiresEscalation?: boolean;
  suspiciousRefundRequiresEscalation?: boolean;
  warrantyRequiresSpecialist?: boolean;
}

export interface Policy {
  id: string;
  version: string;
  status: "ACTIVE" | "INACTIVE";
  effectiveFrom: string;
  effectiveTo?: string;
  category: PolicyCategory;
  rules: PolicyRules;
  humanReadableSummary: string;
}

import { Customer } from "@/types/customer";
import { Order } from "@/types/order";
import { Product } from "@/types/product";
import { Policy } from "@/types/policy";
import { ActionFirewallResult, ActionFirewallCheck, ProposedAction } from "@/types/agent";
import { PolicyEngine } from "@/lib/policy/policy-engine";
import { repository } from "@/lib/data/repository";

export interface FirewallEvaluationInput {
  customer: Customer;
  order: Order | null;
  product: Product | null;
  proposedActions: ProposedAction[];
  hasPromptInjection: boolean;
  claimsNonDeliveryWithOtpProof: boolean;
  isWarrantyRequest: boolean;
  policy: Policy;
}

export class ActionFirewall {
  /**
   * The Action Firewall is the deterministic authority gate that validates
   * proposed actions before any sensitive business tool can execute.
   */
  public static evaluate(input: FirewallEvaluationInput): ActionFirewallResult {
    const checks: ActionFirewallCheck[] = [];
    const authorizedActions: ActionFirewallResult["authorizedActions"] = [];
    let overallStatus: "ALLOWED" | "BLOCKED" | "ESCALATED" = "ALLOWED";

    const {
      customer,
      order,
      product,
      proposedActions,
      hasPromptInjection,
      claimsNonDeliveryWithOtpProof,
      isWarrantyRequest,
      policy
    } = input;

    // Check 1: Identity & Authentication
    if (!customer || !customer.id) {
      checks.push({
        name: "Identity & Customer Context",
        status: "BLOCKED",
        detail: "Customer record could not be verified in session."
      });
      return {
        proposedActions,
        authorizedActions: [],
        checks,
        firewallStatus: "BLOCKED",
        gateStatement: "Action Firewall: Identity check failed. All actions blocked."
      };
    } else {
      checks.push({
        name: "Identity Verification",
        status: "PASSED",
        detail: `Verified customer ${customer.name} (${customer.id}), Tier: ${customer.loyaltyTier}.`
      });
    }

    // Check 2: Prompt Injection / System Override Resistance
    if (hasPromptInjection) {
      checks.push({
        name: "Prompt Injection Filter",
        status: "BLOCKED",
        detail: "System override / instruction bypass patterns detected in prompt. Privileged bypass attempts rejected."
      });
      overallStatus = "ESCALATED";
    } else {
      checks.push({
        name: "Instruction Integrity",
        status: "PASSED",
        detail: "No prompt injection or role-tampering signatures detected."
      });
    }

    // Check 3: Order Ownership and Existence
    if (order) {
      if (order.customerId !== customer.id) {
        checks.push({
          name: "Order Ownership",
          status: "BLOCKED",
          detail: `Ownership violation: Order ${order.id} does not belong to Customer ${customer.id}. Access denied.`
        });
        return {
          proposedActions,
          authorizedActions: [],
          checks,
          firewallStatus: "BLOCKED",
          gateStatement: "Action Firewall: Cross-customer order ownership violation. Hard block."
        };
      } else {
        checks.push({
          name: "Order Ownership & State",
          status: "PASSED",
          detail: `Confirmed ownership for order ${order.id} (Status: ${order.status}, Total: ₹${order.totalAmount.toLocaleString("en-IN")}).`
        });
      }
    } else if (proposedActions.some((a) => a.actionType.includes("REFUND") || a.actionType.includes("RETURN"))) {
      checks.push({
        name: "Order Existence",
        status: "BLOCKED",
        detail: "A sensitive financial or inventory action was proposed without an authoritative order."
      });
      return {
        proposedActions,
        authorizedActions: [],
        checks,
        firewallStatus: "BLOCKED",
        gateStatement: "Action Firewall: Missing verified order record for requested action."
      };
    }

    // Check 4: Delivery Contradiction Check (Carrier OTP vs Customer claim)
    if (claimsNonDeliveryWithOtpProof) {
      checks.push({
        name: "Delivery Proof Contradiction",
        status: "BLOCKED",
        detail: `Physical delivery confirmed via Carrier OTP (${order?.deliveryProof?.carrier}). Claim of non-delivery is contradictory.`
      });
      overallStatus = "ESCALATED";
    }

    // Check 5: Customer Risk Flags (e.g. repeated refunds)
    if (customer.refundRiskFlags && customer.refundRiskFlags.length > 0) {
      checks.push({
        name: "Customer Risk Profile",
        status: "WARNING",
        detail: `Account flagged with risk signals: ${customer.refundRiskFlags.join(", ")}. Automation privileges restricted.`
      });
      if (customer.refundRiskFlags.includes("REPEATED_REFUND_REQUESTS")) {
        overallStatus = "ESCALATED";
      }
    } else {
      checks.push({
        name: "Account Standing",
        status: "PASSED",
        detail: "Account is in good standing with zero risk flags."
      });
    }

    // Now validate each proposed action individually
    for (const proposal of proposedActions) {
      // --- Action: Address Change ---
      if (proposal.actionType === "CHANGE_DELIVERY_ADDRESS") {
        if (order && order.status === "DELIVERED") {
          checks.push({
            name: "Address Rewrite Gate",
            status: "BLOCKED",
            detail: `Order ${order.id} has already been DELIVERED. In-transit destination rewrites are physically impossible and blocked.`
          });
          authorizedActions.push({
            actionType: proposal.actionType,
            status: "BLOCKED",
            reason: "Cannot alter destination address for an order already delivered."
          });
          overallStatus = "ESCALATED";
        } else {
          authorizedActions.push({
            actionType: proposal.actionType,
            status: "ALLOWED",
            authorizedChanges: proposal.requestedChanges,
            reason: "Order is in editable state."
          });
        }
      }

      // --- Action: Create Return ---
      if (proposal.actionType === "CREATE_RETURN") {
        if (!order || !product) {
          checks.push({
            name: "Return Eligibility Gate",
            status: "BLOCKED",
            detail: "Missing order or product data."
          });
          authorizedActions.push({
            actionType: proposal.actionType,
            status: "BLOCKED",
            reason: "Missing order or product context."
          });
          overallStatus = "BLOCKED";
        } else {
          const eligibility = PolicyEngine.checkReturnEligibility(customer, order, product);
          if (eligibility.eligible && !hasPromptInjection && overallStatus !== "ESCALATED") {
            checks.push({
              name: "Return Eligibility Gate",
              status: "PASSED",
              detail: eligibility.reason
            });
            authorizedActions.push({
              actionType: proposal.actionType,
              status: "ALLOWED",
              reason: eligibility.reason
            });
          } else {
            checks.push({
              name: "Return Eligibility Gate",
              status: "BLOCKED",
              detail: eligibility.reason
            });
            authorizedActions.push({
              actionType: proposal.actionType,
              status: overallStatus === "ESCALATED" ? "ESCALATED" : "BLOCKED",
              reason: eligibility.reason
            });
          }
        }
      }

      // --- Action: Issue Refund ---
      if (proposal.actionType === "ISSUE_REFUND") {
        if (claimsNonDeliveryWithOtpProof) {
          checks.push({
            name: "Financial Refund Authority Gate",
            status: "BLOCKED",
            detail: "Automatic refund blocked due to verified carrier delivery proof."
          });
          authorizedActions.push({
            actionType: proposal.actionType,
            status: "BLOCKED",
            reason: "Non-delivery claim contradicts carrier OTP verification."
          });
          overallStatus = "ESCALATED";
        } else if (isWarrantyRequest) {
          checks.push({
            name: "Financial Refund Authority Gate",
            status: "BLOCKED",
            detail: "Hardware defect reported under warranty. Policy dictates service assessment, not purchase refund."
          });
          authorizedActions.push({
            actionType: proposal.actionType,
            status: "BLOCKED",
            reason: "Warranty claims are routed to service specialists, not purchase refunds."
          });
          overallStatus = "ESCALATED";
        } else if (order) {
          const refundCalc = PolicyEngine.calculateRefund(order, proposal.requestedAmount);
          checks.push({
            name: "Refund Amount Calculation Gate",
            status: refundCalc.exceedsApprovalThreshold ? "WARNING" : "PASSED",
            detail: refundCalc.reason
          });

          if (refundCalc.exceedsApprovalThreshold) {
            authorizedActions.push({
              actionType: proposal.actionType,
              authorizedAmount: refundCalc.maxPermittedRefund,
              status: "ESCALATED",
              reason: `Requested refund of ₹${refundCalc.maxPermittedRefund.toLocaleString("en-IN")} exceeds auto-limit of ₹${refundCalc.autoApprovalLimit.toLocaleString("en-IN")}.`
            });
            overallStatus = "ESCALATED";
          } else if (refundCalc.eligibleForAutoRefund && overallStatus !== "ESCALATED") {
            authorizedActions.push({
              actionType: proposal.actionType,
              authorizedAmount: refundCalc.maxPermittedRefund,
              status: "ALLOWED",
              reason: `Authorized refund amount: ₹${refundCalc.maxPermittedRefund.toLocaleString("en-IN")}.`
            });
          } else {
            authorizedActions.push({
              actionType: proposal.actionType,
              status: "BLOCKED",
              reason: refundCalc.reason
            });
          }
        }
      }

      // --- Action: Escalate / Ticket Creation ---
      if (proposal.actionType === "CREATE_TICKET" || proposal.actionType === "ESCALATE_TO_HUMAN") {
        checks.push({
          name: "Escalation Gate",
          status: "PASSED",
          detail: "Human escalation / ticket logging approved by policy."
        });
        authorizedActions.push({
          actionType: proposal.actionType,
          status: "ALLOWED",
          reason: "Case criteria warrant human specialist review."
        });
      }
    }

    // Determine gate statement
    let gateStatement = "";
    if (overallStatus === "ALLOWED") {
      gateStatement = "Action Firewall: All safety, ownership, eligibility, and policy boundaries PASSED. Execution permitted.";
    } else if (overallStatus === "ESCALATED") {
      gateStatement = "Action Firewall: Critical contradiction, threshold, or policy exception detected. Unsafe actions BLOCKED; escalated to Human Handoff.";
    } else {
      gateStatement = "Action Firewall: Ineligible request or safety violation. Action BLOCKED.";
    }

    return {
      proposedActions,
      authorizedActions,
      checks,
      firewallStatus: overallStatus,
      gateStatement
    };
  }
}

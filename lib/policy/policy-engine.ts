import { Customer } from "@/types/customer";
import { Order } from "@/types/order";
import { Product } from "@/types/product";
import { Policy, PolicyCategory } from "@/types/policy";
import { PolicyTimeMachineResult } from "@/types/agent";
import { repository } from "@/lib/data/repository";

export interface ReturnEligibilityResult {
  eligible: boolean;
  allowedDays: number;
  daysSinceDelivery: number;
  returnDeadline: string;
  reason: string;
  governingPolicy: Policy;
}

export interface RefundCalculationResult {
  requestedAmount: number;
  orderTotal: number;
  existingRefunds: number;
  restockingFeePercent: number;
  restockingFeeAmount: number;
  maxPermittedRefund: number;
  autoApprovalLimit: number;
  exceedsApprovalThreshold: boolean;
  eligibleForAutoRefund: boolean;
  reason: string;
  governingPolicy: Policy;
}

export class PolicyEngine {
  /**
   * Policy Time Machine: Resolves which policy legally governs an order based on order placement date,
   * contrasting it with today's current active policy.
   */
  public static resolvePolicyTimeMachine(
    category: PolicyCategory,
    orderPlacedAt: string,
    currentDateIso: string = new Date().toISOString()
  ): PolicyTimeMachineResult {
    const historicalPolicy = repository.getPolicyForCategory(category, orderPlacedAt) || repository.getActivePolicy(category)!;
    const currentActivePolicy = repository.getActivePolicy(category)!;

    const versionMismatch = historicalPolicy.version !== currentActivePolicy.version;
    const orderDateFormatted = new Date(orderPlacedAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    const explanation = versionMismatch
      ? `Order placed on ${orderDateFormatted} falls under historical ${historicalPolicy.category} Policy v${historicalPolicy.version} (effective ${new Date(historicalPolicy.effectiveFrom).getFullYear()}). Current active policy is v${currentActivePolicy.version}. By governance rules, the customer's purchase is governed by the policy active at the time of contract execution.`
      : `Order placed on ${orderDateFormatted} is governed by active ${historicalPolicy.category} Policy v${historicalPolicy.version}.`;

    return {
      orderPlacedAt,
      applicablePolicy: historicalPolicy,
      currentPolicy: currentActivePolicy,
      versionMismatch,
      explanation
    };
  }

  /**
   * Evaluates return eligibility according to deterministic business rules
   */
  public static checkReturnEligibility(
    customer: Customer,
    order: Order,
    product: Product,
    currentDate: Date = new Date("2026-10-03T12:00:00Z") // Reference demo date
  ): ReturnEligibilityResult {
    // 1. Resolve applicable policy based on order date
    const timeMachine = this.resolvePolicyTimeMachine("RETURNS", order.placedAt, currentDate.toISOString());
    const policy = timeMachine.applicablePolicy;

    const rules = policy.rules;
    const standardDays = rules.standardReturnWindowDays || 14;
    const goldExtension = (customer.loyaltyTier === "GOLD" && rules.goldTierExtensionDays) ? rules.goldTierExtensionDays : 0;
    const totalAllowedDays = standardDays + goldExtension;

    // 2. Check delivery date
    if (!order.deliveredAt || order.status !== "DELIVERED") {
      return {
        eligible: false,
        allowedDays: totalAllowedDays,
        daysSinceDelivery: 0,
        returnDeadline: "N/A",
        reason: `Order status is '${order.status}'; items can only be returned once confirmed delivered.`,
        governingPolicy: policy
      };
    }

    const deliveryTime = new Date(order.deliveredAt).getTime();
    const currentTime = currentDate.getTime();
    const daysSinceDelivery = Math.floor((currentTime - deliveryTime) / (1000 * 60 * 60 * 24));

    const deadlineDate = new Date(deliveryTime + totalAllowedDays * 24 * 60 * 60 * 1000);
    const returnDeadline = deadlineDate.toISOString().split("T")[0];

    // 3. Product returnability
    if (!product.returnable) {
      return {
        eligible: false,
        allowedDays: totalAllowedDays,
        daysSinceDelivery,
        returnDeadline,
        reason: `Product '${product.name}' is categorized as non-returnable per hygiene or safety standards.`,
        governingPolicy: policy
      };
    }

    // 4. Duplicate return check
    if (order.existingReturnId) {
      return {
        eligible: false,
        allowedDays: totalAllowedDays,
        daysSinceDelivery,
        returnDeadline,
        reason: `A return request (#${order.existingReturnId}) has already been recorded for this order. Duplicate returns are prevented.`,
        governingPolicy: policy
      };
    }

    // 5. Window expiration check
    if (daysSinceDelivery > totalAllowedDays) {
      const tierInfo = customer.loyaltyTier === "GOLD" ? ` (including ${goldExtension} days Gold extension)` : "";
      return {
        eligible: false,
        allowedDays: totalAllowedDays,
        daysSinceDelivery,
        returnDeadline,
        reason: `Return window expired. Delivered ${daysSinceDelivery} days ago; maximum permitted window under Policy v${policy.version} is ${totalAllowedDays} days${tierInfo}.`,
        governingPolicy: policy
      };
    }

    const tierPraise = customer.loyaltyTier === "GOLD" 
      ? ` Eligible under Gold tier privilege (${standardDays} standard + ${goldExtension} bonus days = ${totalAllowedDays} days window; delivered ${daysSinceDelivery} days ago).`
      : ` Eligible under standard window (${standardDays} days window; delivered ${daysSinceDelivery} days ago).`;

    return {
      eligible: true,
      allowedDays: totalAllowedDays,
      daysSinceDelivery,
      returnDeadline,
      reason: `Eligible for return: ${product.name}.${tierPraise}`,
      governingPolicy: policy
    };
  }

  /**
   * Deterministic refund calculation formula:
   * Maximum Refund = min(Requested Amount, Order Value - Existing Refunds - Restocking Fee)
   */
  public static calculateRefund(
    order: Order,
    requestedAmount?: number,
    orderPlacedAt: string = order.placedAt
  ): RefundCalculationResult {
    const timeMachine = this.resolvePolicyTimeMachine("REFUNDS", orderPlacedAt);
    const policy = timeMachine.applicablePolicy;
    const rules = policy.rules;

    const restockingFeePercent = rules.restockingFeePercent ?? 5;
    const autoApprovalLimit = rules.autoRefundApprovalLimit ?? 10000;

    const restockingFeeAmount = Math.round((order.totalAmount * restockingFeePercent) / 100);
    const remainingValue = Math.max(0, order.totalAmount - (order.existingRefundAmount || 0));
    const effectiveOrderCeiling = Math.max(0, remainingValue - restockingFeeAmount);

    // If customer didn't specify amount, requested amount defaults to effective ceiling
    const actualRequested = requestedAmount !== undefined && requestedAmount > 0 ? requestedAmount : effectiveOrderCeiling;

    const maxPermittedRefund = Math.max(0, Math.min(actualRequested, effectiveOrderCeiling));
    const exceedsApprovalThreshold = maxPermittedRefund > autoApprovalLimit;

    let reason = "";
    if (maxPermittedRefund === 0) {
      reason = `Refund calculation yields ₹0. Order total: ₹${order.totalAmount}, existing refunds: ₹${order.existingRefundAmount}, restocking fee (${restockingFeePercent}%): ₹${restockingFeeAmount}.`;
    } else if (exceedsApprovalThreshold) {
      reason = `Calculated refund amount of ₹${maxPermittedRefund.toLocaleString("en-IN")} exceeds the autonomous authorization threshold of ₹${autoApprovalLimit.toLocaleString("en-IN")}. Policy v${policy.version} mandates human supervisor sign-off.`;
    } else {
      reason = `Calculated refund: ₹${maxPermittedRefund.toLocaleString("en-IN")} (Order: ₹${order.totalAmount.toLocaleString("en-IN")} - Restocking Fee [${restockingFeePercent}%]: ₹${restockingFeeAmount.toLocaleString("en-IN")}). Within auto-approval limit of ₹${autoApprovalLimit.toLocaleString("en-IN")}.`;
    }

    return {
      requestedAmount: actualRequested,
      orderTotal: order.totalAmount,
      existingRefunds: order.existingRefundAmount || 0,
      restockingFeePercent,
      restockingFeeAmount,
      maxPermittedRefund,
      autoApprovalLimit,
      exceedsApprovalThreshold,
      eligibleForAutoRefund: !exceedsApprovalThreshold && maxPermittedRefund > 0,
      reason,
      governingPolicy: policy
    };
  }

  /**
   * Warranty check: Evaluates if product issue is within warranty period
   */
  public static checkWarrantyCoverage(
    order: Order,
    product: Product,
    currentDate: Date = new Date("2026-10-03T12:00:00Z")
  ): {
    underWarranty: boolean;
    warrantyMonths: number;
    monthsElapsed: number;
    warrantyExpiresAt: string;
    reason: string;
    governingPolicy: Policy;
  } {
    const policy = repository.getActivePolicy("WARRANTY")!;
    const purchaseTime = new Date(order.placedAt).getTime();
    const currentTime = currentDate.getTime();
    const monthsElapsed = Math.floor((currentTime - purchaseTime) / (1000 * 60 * 60 * 24 * 30.4));

    const warrantyMonths = product.warrantyMonths || 12;
    const expiresDate = new Date(purchaseTime + warrantyMonths * 30.4 * 24 * 60 * 60 * 1000);
    const warrantyExpiresAt = expiresDate.toISOString().split("T")[0];

    const underWarranty = monthsElapsed <= warrantyMonths;
    const reason = underWarranty
      ? `Product '${product.name}' is within its ${warrantyMonths}-month warranty period (${monthsElapsed} months elapsed). Governed by Warranty Policy v${policy.version} for Authorized Service Center routing.`
      : `Manufacturer warranty period of ${warrantyMonths} months has expired (${monthsElapsed} months elapsed).`;

    return {
      underWarranty,
      warrantyMonths,
      monthsElapsed,
      warrantyExpiresAt,
      reason,
      governingPolicy: policy
    };
  }
}

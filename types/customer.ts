export type LoyaltyTier = "STANDARD" | "SILVER" | "GOLD";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phoneMasked: string;
  loyaltyTier: LoyaltyTier;
  accountCreatedAt: string;
  refundRiskFlags: string[];
}

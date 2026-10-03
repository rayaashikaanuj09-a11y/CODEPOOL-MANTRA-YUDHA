export type OrderStatus = "PLACED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
export type PaymentStatus = "PAID" | "PENDING" | "FAILED" | "REFUNDED";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface DeliveryProof {
  otpVerified: boolean;
  deliveredAt?: string;
  carrier?: string;
  trackingNumber?: string;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  placedAt: string;
  deliveredAt?: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryProof?: DeliveryProof;
  items: OrderItem[];
  existingRefundAmount: number;
  existingReturnId?: string;
}

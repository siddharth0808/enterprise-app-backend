export type SaleStatus = "COMPLETED" | "VOIDED";

export type PaymentMethod =
  | "CASH"
  | "UPI"
  | "CARD"
  | "OTHER";

export interface Sale {
  id: string;
  businessId: string;
  saleNumber: string;

  itemCount: number;
  totalQuantity: number;

  subtotal: number;
  discount: number;
  totalAmount: number;

  paymentMethod: PaymentMethod;
  status: SaleStatus;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleLineItem {
  productId: string;
  quantity: number;
  rate:number;
  currentStock: number;
}

export type DiscountType = 'fixed' | 'percentage';

export interface Discount {
  type: DiscountType;
  /** Rupees for "fixed", 0-100 for "percentage". */
  value: number;
}

export interface CreateSaleRequest {
  items: CreateSaleLineItem[];
  discount: Discount | null;
  paymentMethod: PaymentMethod;
}
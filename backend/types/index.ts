export interface Business {
  id: string;
  ownerId: string; // Cognito sub
  businessName: string;
  ownerName: string;
  email: string;
  businessAddress: string;
  mobile: string;
  businessType: string;
  createdAt: string;
  updatedAt: string;
}

export interface Products {
  ownerId: string;
  businessId: string;
  id: string;
  name: string;
  rate: number;
  mrp: number;
  currentStock: number;
  minimumStock: number;
  expiryDate: number;
  manufacturer?: string;
  batchNumber?: string;
  hsn?: string;
  status?: string;
  amount?: number;
  cgst?: number;
  sgst?: number;
  discount?: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "COMPLETED"
  | "CANCELLED"
  | "SHIPPED";

export interface OrderLine {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface Order {
  ownerId: string;
  orderId: string;
  customerPhone: string;
  customerName: string;
  total: number;
  payMode: string;
  status: OrderStatus;
  orders: OrderLine[];
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  ownerId: string;
  businessId: string;
  productId: string;

  type: "STOCK_IN" | "STOCK_OUT" | "DAMAGE" | "RETURN" | "ADJUSTMENT";

  quantity: number;

  previousStock: number;
  newStock: number;
  newAmount?:number;
  reason?: string;

  createdBy: string;
  createdAt: string;
}

export const TRANSACTION_TYPE_OPTIONS = [
  { value: "STOCK_IN", label: "Stock In", sign: 1 },
  { value: "STOCK_OUT", label: "Stock Out", sign: -1 },
  { value: "DAMAGE", label: "Damage", sign: -1 },
  { value: "RETURN", label: "Return", sign: 1 },
  { value: "ADJUSTMENT", label: "Adjustment", sign: 1 },
] as const;

export type TransactionType =
  (typeof TRANSACTION_TYPE_OPTIONS)[number]["value"];

export interface UpdateItem {
  Key: Record<string, any>;
  UpdateExpression: string;
  ExpressionAttributeValues?: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
}
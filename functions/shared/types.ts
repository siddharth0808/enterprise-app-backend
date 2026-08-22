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
  brand: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  category: string;
  sku: string;
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

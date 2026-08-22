
export interface Business {
  id:string;
  ownerId: string; // Cognito sub
  businessName: string;
  ownerName: string;
  email: string;
  businessAddress: string;
  mobile: string;
}

export interface Products {
  ownerId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImgUri: string;
  productDescription: string;
}

export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'SHIPPED';

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

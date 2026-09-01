export interface ExtractedInvoiceSupplier {
  name?: string;
  address?: string;
  gstin?: string;
  contact?:string;
}

export interface ExtractedInvoiceItem {
  id?: string;
  name: string;

  manufacturer?: string;

  batchNumber?: string;
  expiryDate?: any;

  hsn?: string;

  quantity: number;

  mrp?: number;
  rate?: number;
  discount?: number;

  sgst?: number;
  cgst?: number;

  amount?: number;
  status?:string;
  minimumStock?:number;
  currentQuantity?:number
}

export interface ExtractedInvoiceTotals {
  subtotal?: number;
  discount?: number;
  tax?: number;
  grandTotal?: number;
}

export interface ExtractedInvoice {
  invoiceNumber?: string;
  invoiceDate?: string;

  supplier?: ExtractedInvoiceSupplier;

  products: ExtractedInvoiceItem[];

  total?: number;
}
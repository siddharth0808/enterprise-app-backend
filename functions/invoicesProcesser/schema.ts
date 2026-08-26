import { z } from "zod";

export const extractedInvoiceSupplierSchema = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  gstin: z.string().trim().min(1).optional(),
});

export const extractedInvoiceItemSchema = z.object({
  productName: z.string().trim().min(1),

  packing: z.string().trim().min(1).optional(),
  manufacturer: z.string().trim().min(1).optional(),

  batchNumber: z.string().trim().min(1).optional(),
  expiryDate: z.string().trim().min(1).optional(),

  hsn: z.string().trim().min(1).optional(),

  quantity: z.number().positive(),

  mrp: z.number().nonnegative().optional(),
  rate: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),

  gstPercent: z.number().min(0).max(100).optional(),
  gstAmount: z.number().nonnegative().optional(),

  amount: z.number().nonnegative().optional(),
});

export const extractedInvoiceTotalsSchema = z.object({
  subtotal: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  grandTotal: z.number().nonnegative().optional(),
});

export const extractedInvoiceSchema = z.object({
  invoiceNumber: z.string().trim().min(1).optional(),

  invoiceDate: z.string().trim().min(1).optional(),

  supplier: extractedInvoiceSupplierSchema.optional(),

  items: z.array(extractedInvoiceItemSchema).min(1),

  totals: extractedInvoiceTotalsSchema.optional(),
});

export type ExtractedInvoice = z.infer<
  typeof extractedInvoiceSchema
>;
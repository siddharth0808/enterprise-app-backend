import type { ExtractedInvoice } from "./invoicesProcesser";

export interface InvoiceExtractor {
  extract(params: {
    bucket: string;
    documentKey: string;
  }): Promise<ExtractedInvoice>;
}
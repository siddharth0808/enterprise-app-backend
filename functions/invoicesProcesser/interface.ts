import type { ExtractedInvoice } from "./types";

export interface InvoiceExtractor {
  extract(params: {
    bucket: string;
    documentKey: string;
  }): Promise<ExtractedInvoice>;
}
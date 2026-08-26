import { extractedInvoiceSchema } from "./schema";
import {
  type ExtractedInvoice,
} from "./types";

export function validateExtractedInvoice(
  data: unknown,
): ExtractedInvoice {
  return extractedInvoiceSchema.parse(data);
}
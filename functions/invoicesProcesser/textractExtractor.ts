import {
  AnalyzeExpenseCommand,
  TextractClient,
  type AnalyzeExpenseResponse,
  type ExpenseField,
  type LineItemGroup,
} from "@aws-sdk/client-textract";
import { InvoiceExtractor } from "./interface";
import { ExtractedInvoice } from "./types";

export class TextractInvoiceExtractor implements InvoiceExtractor {
  private readonly textract = new TextractClient({});

  async extract({
    bucket,
    documentKey,
  }: {
    bucket: string;
    documentKey: string;
  }): Promise<ExtractedInvoice> {
    const result = await this.textract.send(
      new AnalyzeExpenseCommand({
        Document: {
          S3Object: {
            Bucket: bucket,
            Name: documentKey,
          },
        },
      }),
    );
    console.log("TextRact extract::::", JSON.stringify(result))
    return this.normalizeTextractResult(result);
  }

  normalizeTextractResult(response: AnalyzeExpenseResponse): ExtractedInvoice {
    const expenseDocument = response.ExpenseDocuments?.[0];
    console.log("normalizeTextractResult::::", JSON.stringify(expenseDocument))

    if (!expenseDocument) {
      throw new Error("No invoice data detected");
    }

    const summaryFields = expenseDocument.SummaryFields ?? [];

    const invoiceNumber = this.getSummaryValue(
      summaryFields,
      "INVOICE_RECEIPT_ID",
    );

    const invoiceDate = this.getSummaryValue(
      summaryFields,
      "INVOICE_RECEIPT_DATE",
    );

    const supplierName = this.getSummaryValue(summaryFields, "VENDOR_NAME");

    const supplierAddress = this.getSummaryValue(
      summaryFields,
      "VENDOR_ADDRESS",
    );

    const supplierGstin = this.getSummaryValue(
      summaryFields,
      "VENDOR_GST_NUMBER",
    );

    const subtotal = this.parseNumber(
      this.getSummaryValue(summaryFields, "SUBTOTAL"),
    );

    const discount = this.parseNumber(
      this.getSummaryValue(summaryFields, "DISCOUNT"),
    );

    const tax = this.parseNumber(this.getSummaryValue(summaryFields, "TAX"));

    const grandTotal = this.parseNumber(
      this.getSummaryValue(summaryFields, "TOTAL"),
    );
    const items: any = [];
    // const items: any = (expenseDocument.LineItemGroups ?? [])
    //   .flatMap((group) => group.LineItems ?? [])
    //   .map(this.normalizeLineItem)
    //   .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      invoiceNumber,
      invoiceDate,

      supplier: {
        name: supplierName,
        address: supplierAddress,
        gstin: supplierGstin,
      },

      items,

      totals: {
        subtotal,
        discount,
        tax,
        grandTotal,
      },
    };
  }

  getSummaryValue(fields: ExpenseField[], type: string): string | undefined {
    const field = fields.find((item) => item.Type?.Text === type);

    return field?.ValueDetection?.Text?.trim() || undefined;
  }

  parseNumber(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.replace(/[₹$€£,\s]/g, "").replace(/[^\d.-]/g, "");

    if (!normalized) {
      return undefined;
    }

    const number = Number(normalized);

    return Number.isFinite(number) ? number : undefined;
  }

  normalizeLineItem(group: LineItemGroup) {
    const fields = group.LineItems?.[0]?.LineItemExpenseFields ?? [];

    const values: Record<string, string> = {};

    for (const field of fields) {
      const type = field.Type?.Text;
      const value = field.ValueDetection?.Text?.trim();

      if (type && value) {
        values[type] = value;
      }
    }

    const productName = values.ITEM || values.PRODUCT || values.DESCRIPTION;

    const quantity = this.parseNumber(values.QUANTITY);

    if (!productName || quantity === undefined) {
      return null;
    }

    return {
      productName,

      packing: values.PACKAGING || values.PACKING,

      manufacturer: values.MANUFACTURER,

      batchNumber: values.BATCH_NUMBER || values.BATCH,

      expiryDate: values.EXPIRY_DATE || values.EXPIRY,

      hsn: values.HSN,

      quantity,

      mrp: this.parseNumber(values.MRP),

      rate: this.parseNumber(values.RATE || values.UNIT_PRICE || values.PRICE),

      discount: this.parseNumber(values.DISCOUNT),

      gstPercent: this.parseNumber(values.TAX_RATE || values.GST_RATE),

      gstAmount: this.parseNumber(values.TAX || values.GST),

      amount: this.parseNumber(values.AMOUNT || values.LINE_TOTAL),
    };
  }
}

export const textractInvoiceExtractor = new TextractInvoiceExtractor()

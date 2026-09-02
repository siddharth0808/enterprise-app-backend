import { dynamoDBService } from "../shared/ddb.service";
import { extractedInvoiceSchema } from "./schema";
import { textractInvoiceExtractor } from "./textractExtractor";

const INVOICES_TABLE = process.env.INVOICES_TABLE!;
const INVOICE_BUCKET = process.env.INVOICE_BUCKET!;
export class InvoiceProcesserService {
  constructor(
    private readonly ddbService = dynamoDBService,
    public readonly invoiceExtractor = textractInvoiceExtractor,
  ) {}

  public async execute(event: any) {
    try {
      const invoice = await this.ddbService.getItem(INVOICES_TABLE, {
        businessId: event.businessId,
        id: event.invoiceId,
      });

      if (!invoice) throw Error("Invoice not found!");

      await this.ddbService.updateItems(
        INVOICES_TABLE,
        {
          businessId: invoice.businessId,
          id: invoice.id,
        },
        `SET #status = :status, updatedAt = :updatedAt`,
        {
          "#status": "status",
        },
        {
          ":status": "PROCESSING",
          ":updatedAt": new Date().toISOString(),
        },
      );

      const extractRes = await this.invoiceExtractor.extract({
        bucket: INVOICE_BUCKET,
        documentKey: invoice.documentKey,
      });
      console.log("extractRes:::", extractRes);

      const validated = extractedInvoiceSchema.parse(extractRes);

      console.log("validated:::", JSON.stringify(validated));

      const updateInvoiceExpression = {
        UpdateExpression: `SET #status = :status, #total=:total, invoiceDate=:invoiceDate, invoiceNumber=:invoiceNumber, products=:products, supplier=:supplier,  updatedAt = :updatedAt`,
        ExpressionAttributeNames: {
          "#status": "status",
          "#total": "total",
        },
        ExpressionAttributeValues: {
          ":invoiceDate": validated?.invoiceDate || '',
          ":invoiceNumber": validated.invoiceNumber || '',
          ":products": JSON.stringify(validated.products),
          ":supplier": validated?.supplier || {},
          ":total": validated?.total || 0 ,
          ":status": "REVIEW",
          ":updatedAt": new Date().toISOString(),
        },
      };
      console.log(
        "updateInvoiceExpression:::::",
        JSON.stringify(updateInvoiceExpression),
      );
      await this.ddbService.updateItems(
        INVOICES_TABLE,
        {
          businessId: invoice.businessId,
          id: invoice.id,
        },
        updateInvoiceExpression.UpdateExpression,
        updateInvoiceExpression.ExpressionAttributeNames,
        updateInvoiceExpression.ExpressionAttributeValues,
      );
    } catch (error: any) {
      throw Error(error.message);
    }
  }
}

import { dynamoDBService } from "../shared/ddb.service";
import { s3Service } from "../shared/s3Bucket.service";
const INVOICES_TABLE = process.env.INVOICES_TABLE!;
const INVOICE_BUCKET = process.env.INVOICE_BUCKET!;
export class InvoiceProcesserService {
  constructor(
    private readonly ddbService = dynamoDBService,
    private readonly s3 = s3Service,
  ) {}

  public async execute(event: any) {
    try {
      const invoice = await this.ddbService.getItem(INVOICES_TABLE, {
        businessId: event.businessId,
        id: event.invoiceId,
      });

      if (!invoice) throw Error("Invoice not found!");

      const invoiceBuffer = await this.s3.getObject(
        INVOICE_BUCKET,
        invoice.documentKey,
      );

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

      console.log("invoiceBuffer:::", invoiceBuffer.byteLength);
    } catch (error: any) {
      throw Error(error.message);
    }
  }
}

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getExtension } from "../shared/utils";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { dynamoDBService } from "../shared/ddb.service";
import { s3Service } from "../shared/s3Bucket.service";
import { lambdaService } from "../shared/lambda.service";

const BUSINESS_TABLE = process.env.BUSINESS_TABLE!;
const INVOICES_TABLE = process.env.INVOICES_TABLE!;
const INVOICE_BUCKET = process.env.INVOICE_BUCKET!;
const INVOICES_FUNCTION_NAME = process.env.INVOICES_FUNCTION_NAME!;


const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
interface CreateInvoiceRequest {
  fileName: string;
  contentType: string;
  fileSize?: number;
}
export class UploadInvoiceService {
  constructor(
    public readonly ddbService = dynamoDBService,
    public readonly s3 = s3Service,
    public readonly lambda = lambdaService
  ) {}

  async validatedUploadInvoiceReq(
    sub: string,
    businessId: string,
    fileName: string,
    contentType: string,
    fileSize: number | undefined,
  ) {
    if (!sub || !businessId) {
      throw Error("Unauthorized");
    }

    if (!fileName || !contentType) {
      throw Error("fileName and contentType are required");
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      throw Error("Only PDF, JPEG and PNG files are supported");
    }

    if (fileSize !== undefined && fileSize > MAX_FILE_SIZE) {
      throw Error("File size cannot exceed 10 MB");
    }

    return { fileName, contentType, fileSize, businessId };
  }

  public async uploadInvoice(body: any, sub: string) {
    try {
      const { fileName, contentType, fileSize }: CreateInvoiceRequest = body;

      const business = await this.ddbService.getBusinessByOwnerId(
        BUSINESS_TABLE,
        sub,
      );

      console.log("Business respons::::", JSON.stringify(business));
      const businessId = business.Item ? business.Item.id : "";

      await this.validatedUploadInvoiceReq(
        sub,
        businessId,
        fileName,
        contentType,
        fileSize,
      );

      const invoiceId = crypto.randomUUID();

      const extension = getExtension(fileName, contentType);

      const documentKey = `${sub}/${businessId}/invoices/${invoiceId}/invoice.${extension}`;

      const now = new Date().toISOString();

      const invoice = {
        id: invoiceId,
        businessId,

        documentKey,

        documentType: contentType === "application/pdf" ? "PDF" : "IMAGE",

        status: "CREATED",

        createdBy: sub,
        createdAt: now,
        updatedAt: now,
      };

      await this.ddbService.putItems(INVOICES_TABLE, invoice);
      const uploadUrl = await this.s3.getUploadPresignedUrl(
        INVOICE_BUCKET,
        documentKey,
        contentType,
      );

      return {
        invoiceId,
        status: invoice.status,
        uploadUrl,
        expiresIn: 900,
      };
    } catch (error: any) {
      console.log("uploadInvoice error::::", error.stack);
      throw Error(error.message);
    }
  }

  public async updateInvoiceStatus(sub: string, invoiceId: string) {
    try {
      const business = await this.ddbService.getBusinessByOwnerId(
        BUSINESS_TABLE,
        sub,
      );
      if (!business) throw Error("Matching business not found!");

      const invoice = await dynamoDBService.getItem(INVOICES_TABLE, {
        businessId: business.id,
        id: invoiceId,
      });

      if (!Object.keys(invoice).length)
        throw Error("Matching invoice not found!");

      const exists = await this.s3.isObjectAvailable(
        INVOICE_BUCKET,
        invoice.documentKey,
      );

      if (!exists) throw Error("Object does not exist");

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
          ":status": "UPLOADED",
          ":updatedAt": new Date().toISOString(),
        },
      );

      const lambdaEvent = {
        businessId: business.id,
         invoiceId,
      }

      await this.lambda.invokeAsync(INVOICES_FUNCTION_NAME, lambdaEvent)

      return { invoiceId, status: 'PROCESSING' };
    } catch (error: any) {
      console.log("updateInvoiceUploadStatus error::::", error.stack);
      throw Error(error.message);
    }
  }
}

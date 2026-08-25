import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { getExtension } from "../shared/utils";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const BUSINESS_TABLE = process.env.BUSINESS_TABLE!;

const INVOICES_TABLE = process.env.INVOICES_TABLE!;
const INVOICE_BUCKET = process.env.INVOICE_BUCKET!;

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
interface CreateInvoiceRequest {
  fileName: string;
  contentType: string;
  fileSize?: number;
}
export class UploadInvoiceService {
  constructor() {}

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

      const business = await ddb.send(
        new GetCommand({
          TableName: BUSINESS_TABLE,
          Key: {
            ownerId: sub,
          },
        }),
      );

      console.log("Business respons::::", JSON.stringify(business))
      const businessId = business.Item?.length ? business.Item[0].id : "";

      await this.validatedUploadInvoiceReq(
        sub,
        businessId,
        fileName,
        contentType,
        fileSize,
      );

      const invoiceId = crypto.randomUUID();

      const extension = getExtension(fileName, contentType);

      const documentKey = `${sub}/invoices/${businessId}/${invoiceId}/invoice.${extension}`;

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

      await ddb.send(
        new PutCommand({
          TableName: INVOICES_TABLE,

          Item: invoice,

          ConditionExpression: "attribute_not_exists(id)",
        }),
      );

      const command = new PutObjectCommand({
        Bucket: INVOICE_BUCKET,
        Key: documentKey,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: 900,
      });
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
}

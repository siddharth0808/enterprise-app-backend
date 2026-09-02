import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({});

export class S3Service {
  constructor() {}
  public async getUploadPresignedUrl(
    Bucket: string,
    Key: string,
    ContentType: string,
  ) {
    try {
      const command = new PutObjectCommand({
        Bucket,
        Key,
        ContentType,
      });

      const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: 900,
      });
      return uploadUrl;
    } catch (error: any) {
      throw Error(error.message);
    }
  }

  public async isObjectAvailable(
    Bucket: string,
    Key: string,
  ): Promise<boolean> {
    try {
      const response = await s3.send(
        new HeadObjectCommand({
          Bucket,
          Key,
        }),
      );

      console.log("S3 object exists", {
        Key,
        statusCode: response.$metadata.httpStatusCode,
        contentLength: response.ContentLength,
      });

      return true;
    } catch (error: any) {
      console.error("S3 HeadObject failed", {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        statusCode: error?.$metadata?.httpStatusCode,
        requestId: error?.$metadata?.requestId,
        extendedRequestId: error?.$metadata?.extendedRequestId,
        cfId: error?.$metadata?.cfId,
        bucket: process.env.BUCKET_NAME,
        Key,
      });

      if (
        error?.$metadata?.httpStatusCode === 404 ||
        error?.name === "NotFound" ||
        error?.name === "NoSuchKey"
      ) {
        return false;
      }

      throw error;
    }
  }

  public async getObject(Bucket: string, Key: string) {
    try {
      const response = await s3.send(
        new GetObjectCommand({
          Bucket,
          Key,
        }),
      );
      if (!response.Body) {
        throw new Error("S3 object body is empty.");
      }

      return Buffer.from(await response.Body.transformToByteArray());
    } catch (error: any) {
      throw Error(error.message);
    }
  }
}
export const s3Service = new S3Service();

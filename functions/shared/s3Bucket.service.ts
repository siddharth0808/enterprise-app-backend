import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
    } catch (error:any) {
        throw Error(error.message)
    }
  }

  public async isObjectAvailable(Bucket:string,Key: string): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket,
        Key,
      })
    );
    return true;
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error; // Permission/network/etc. error
  }
}
}
export const s3Service = new S3Service();

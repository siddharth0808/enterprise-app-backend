import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { json, getClaims } from '../shared/http';

const s3 = new S3Client({});
const BUCKET = process.env.PRODUCTS_BUCKET!;

// Route: POST /images/presign  { contentType: "image/jpeg" }
export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const { sub } = getClaims(event);
  const body = JSON.parse(event.body ?? '{}');
  const contentType = body.contentType ?? 'image/jpeg';

  const key = `products/${sub}/${randomUUID()}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );
  const viewUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 604800 } // 7 days; refresh on read if you need longer-lived access
  );

  return json(200, { key, uploadUrl, viewUrl });
};

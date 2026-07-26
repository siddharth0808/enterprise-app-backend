import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { json, getClaims } from '../shared/http';
import { Business } from '../shared/types';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const BUSINESS_TABLE = process.env.BUSINESS_TABLE!;

// Cognito already created the user account (sign-up happens client-side against
// the User Pool). This endpoint just writes the canteen profile row once the
// owner is authenticated, mirroring RegisterActivity.java's Firebase write.
export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const { sub } = getClaims(event);
  const body = JSON.parse(event.body ?? '{}');

  const required = ['businessName', 'ownerName', 'email', 'businessAddress', 'ownerMobile'];
  const missing = required.filter((field) => !body[field]);
  if (missing.length) {
    return json(400, { message: `Missing fields: ${missing.join(', ')}` });
  }

  const business: Business = {
    ownerId: sub,
    businessName: body.businessName,
    ownerName: body.ownerName,
    email: body.email,
    businessAddress: body.businessAddress,
    ownerMobile: body.ownerMobile,
  };

  await ddb.send(new PutCommand({ TableName: BUSINESS_TABLE, Item: business }));
  return json(201, business);
};

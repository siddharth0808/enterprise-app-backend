import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { json, getClaims } from '../shared/http';
import { Business } from '../shared/types';
import { randomUUID } from 'crypto';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const BUSINESS_TABLE = process.env.BUSINESS_TABLE!;

// Cognito already created the user account (sign-up happens client-side against
// the User Pool). 
export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const { sub } = getClaims(event);
  const body = JSON.parse(event.body ?? '{}');

  const required = ['name', 'ownerName', 'email', 'address', 'phone'];
  const missing = required.filter((field) => !body[field]);
  if (missing.length) {
    return json(400, { message: `Missing fields: ${missing.join(', ')}` });
  }

  const business: Business = {
    id: randomUUID(),
    ownerId: sub,
    businessName: body.name,
    ownerName: body.ownerName,
    email: body.email,
    businessAddress: body.address,
    mobile: body.phone,
  };

  await ddb.send(new PutCommand({ TableName: BUSINESS_TABLE, Item: business }));
  return json(201, business);
};

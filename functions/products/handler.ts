import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { json, getClaims } from '../shared/http';
import { Products } from '../shared/types';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;


export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const method = event.requestContext.http.method;

  if (method === 'POST') {
    const { sub } = getClaims(event);
    const body = JSON.parse(event.body ?? '{}');
    const required = ["name", "costPrice", "sellingPrice"];
    const missing = required.filter((field) => !body[field]);
    if (missing.length) {
      return json(400, { message: `Missing fields: ${missing.join(", ")}` });
    }

    const item: Products = {
      ownerId: sub,
      businessId:body.businessId,
      id: randomUUID(),
      name: body.name,
      costPrice: Number(body.costPrice),
      sellingPrice: Number(body.sellingPrice),
      currentStock: Number(body.currentStock),
      minimumStock: Number(body.minimumStock),
      category: body.category,
      sku: body.sku,
      brand:body.brand,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await ddb.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: item }));
    return json(201, item);
  }

  if (method === 'GET') {
    const businessId = event.pathParameters?.businessId;
    if (!businessId) return json(400, { message: 'businessId is required' });

    const result = await ddb.send(
      new QueryCommand({
        TableName: PRODUCTS_TABLE,
        KeyConditionExpression: 'businessId = :businessId',
        ExpressionAttributeValues: { ':businessId': businessId },
      })
    );
    return json(200, result.Items ?? []);
  }

  return json(405, { message: 'Method not allowed' });
};

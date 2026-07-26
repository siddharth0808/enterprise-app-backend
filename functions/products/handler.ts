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

    if (!body.productName || body.productPrice == null) {
      return json(400, { message: 'productName and productPrice are required' });
    }

    const item: Products = {
      ownerId: sub,
      productId: randomUUID(),
      productName: body.productName,
      productPrice: Number(body.productPrice),
      productImgUri: body.productImgUri ?? '',
      productDescription: body.productDescription ?? '',
    };

    await ddb.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: item }));
    return json(201, item);
  }

  if (method === 'GET') {
    const ownerId = event.pathParameters?.ownerId;
    if (!ownerId) return json(400, { message: 'ownerId is required' });

    const result = await ddb.send(
      new QueryCommand({
        TableName: PRODUCTS_TABLE,
        KeyConditionExpression: 'ownerId = :ownerId',
        ExpressionAttributeValues: { ':ownerId': ownerId },
      })
    );
    return json(200, result.Items ?? []);
  }

  return json(405, { message: 'Method not allowed' });
};

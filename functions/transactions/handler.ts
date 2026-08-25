import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { randomUUID } from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { json, getClaims } from "../shared/http";
import { InventoryTransaction, Products } from "../shared/types";
import { getTransactionSign } from "../shared/utils";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;
const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  const method = event.requestContext.http.method;
  const { sub, fullName } = getClaims(event);
  const { businessId, productId }: any = event.pathParameters;

  if (!businessId) return json(400, { message: "businessId is required" });
  if (method === "POST") {
    const body = JSON.parse(event.body ?? "{}");
    const required = ["quantity", "type"];
    const missing = required.filter((field) => !body[field]);
    if (missing.length) {
      return json(400, { message: `Missing fields: ${missing.join(", ")}` });
    }

    const product = await ddb.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: {
          businessId: businessId,
          id: productId,
        },
      }),
    );

    const currentStock = product?.Item?.currentStock ?? 0;
    const sign = getTransactionSign(body.type);
    const signedQuantity = sign * Math.abs(Number(body.quantity) || 0);
    const newStock = Number(currentStock + signedQuantity);

    if (newStock < 0)
      return json(400, {
        message: `Adjustment quantity could not be greater than current stock!`,
      });

    const item: InventoryTransaction = {
      ownerId: sub,
      businessId,
      productId,
      id: randomUUID(),
      type: body.type,
      quantity: Number(body.quantity),
      previousStock: Number(currentStock),
      newStock,
      reason: body.reason ?? "",
      createdBy: fullName ?? "",
      createdAt: new Date().toISOString(),
    };

    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: PRODUCTS_TABLE,
              Key: {
                businessId,
                id: productId,
              },
              UpdateExpression:
                "SET currentStock =:currentStock, updatedAt=:updatedAt",
              ExpressionAttributeValues: {
                ":currentStock": newStock,
                ":updatedAt": new Date().toISOString(),
              },
            },
          },
          {
            Put:{ TableName: TRANSACTIONS_TABLE, Item: item }
          }
        ],
      }),
    );

    return json(201, item);
  }

  if (method === "GET") {
    const result = await ddb.send(
      new QueryCommand({
        TableName: TRANSACTIONS_TABLE,
        KeyConditionExpression: "productId = :productId",
        ExpressionAttributeValues: { ":productId": productId },
      }),
    );
    return json(200, result.Items ?? []);
  }

  return json(405, { message: "Method not allowed" });
};

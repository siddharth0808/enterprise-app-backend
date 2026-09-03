import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { InventoryTransaction } from "../types";
import { getTransactionSign } from "../utils";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";
import { dynamoDBService } from "../shared/ddb.service";

import {
  BUSINESS_TABLE,
  PRODUCTS_TABLE,
  TRANSACTIONS_TABLE,
} from "../constants";
import { buildResponse } from "../utils/http";
import { logError } from "../utils/logger";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class TransactionService {
  constructor(private readonly ddbService = dynamoDBService) {}

  public async updateTransaction(
    ownerId: string,
    fullName: string,
    productId: string,
    body: any,
  ) {
    try {
      const business = await this.ddbService.getBusinessByOwnerId(
        BUSINESS_TABLE,
        ownerId,
      );

      if (!business) {
        logError("updateTransaction", "Business not found");
        return buildResponse(404, { message: "Business not found" });
      }

      const product = await this.ddbService.getItem(PRODUCTS_TABLE, {
        businessId: business.id,
        id: productId,
      });

      const currentStock = product?.currentStock ?? 0;
      const rate = product?.rate ?? 0;

      const sign = getTransactionSign(body.type);
      const signedQuantity = sign * Math.abs(Number(body.quantity) || 0);
      const newStock = Number(currentStock + signedQuantity);
      const newAmount = Number(newStock * rate);

      if (newStock < 0){
        logError("updateTransaction", "Adjustment quantity could not be greater than current stock");
return buildResponse(400, {
          message: `Adjustment quantity could not be greater than current stock!`,
        });
      }
        
      const item: InventoryTransaction = {
        ownerId,
        businessId: business.id,
        productId,
        id: randomUUID(),
        type: body.type,
        quantity: Number(body.quantity),
        previousStock: Number(currentStock),
        newStock,
        newAmount,
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
                  businessId: business.id,
                  id: productId,
                },
                UpdateExpression:
                  "SET currentStock =:currentStock, amount =:amount, updatedAt=:updatedAt",
                ExpressionAttributeValues: {
                  ":currentStock": newStock,
                  ":amount": newAmount,
                  ":updatedAt": new Date().toISOString(),
                },
              },
            },
            {
              Put: { TableName: TRANSACTIONS_TABLE, Item: item },
            },
          ],
        }),
      );
      return buildResponse(201, item);
    } catch (error: any) {
      logError("updateTransaction", "Error updating transaction", error);
      return buildResponse(500, { message: error.message });
    }
  }

  public async getTransactions(ownerId: string, productId: string) {
    try {
      const result = await this.ddbService.getAllItems(
        TRANSACTIONS_TABLE,
        "productId = :productId",
        { ":productId": productId },
      );
      return buildResponse(200, result);
    } catch (error: any) {
      logError("getTransactions", "Error fetching transactions", error);
      return buildResponse(500, { message: error.message });
    }
  }
}

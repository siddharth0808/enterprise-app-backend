import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { InventoryTransaction } from "../shared/types";
import { getTransactionSign } from "../shared/utils";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { json } from "../shared/http";
import { randomUUID } from "crypto";
import { dynamoDBService } from "../shared/ddb.service";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;
const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE!;
const BUSINESS_TABLE = process.env.BUSINESS_TABLE!;

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
      if (!business) throw Error("Business not found!");
      const product = await this.ddbService.getItem(PRODUCTS_TABLE, {
            businessId: business.id,
            id: productId,
          })

      const currentStock = product?.currentStock ?? 0;
      const amount = product?.amount ?? 0;
      const rate = product?.rate ?? 0;

      const sign = getTransactionSign(body.type);
      const signedQuantity = sign * Math.abs(Number(body.quantity) || 0);
      const newStock = Number(currentStock + signedQuantity);
      const newAmount =  Number(newStock * rate)
      if (newStock < 0)
        return json(400, {
          message: `Adjustment quantity could not be greater than current stock!`,
        });

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
                  "SET currentStock =:currentStock, amount =:amount updatedAt=:updatedAt",
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
      return item;
    } catch (error: any) {
      throw Error(error.message);
    }
  }

  public async getTransactions(ownerId:string,productId:string) {
    try {
        const result = await this.ddbService.getAllItems(TRANSACTIONS_TABLE, "productId = :productId",{ ":productId": productId })
        return result;
    } catch (error: any) {
      throw Error(error.message);
    }
  }
}

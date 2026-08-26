import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class DynamoDBService {
  constructor() {}

  public async getBusinessByOwnerId(tableName: string, ownerId: string) {
    try {
      const business = await ddb.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            ownerId,
          },
        }),
      );
            console.log("getBusinessByOwnerId::::::", JSON.stringify(business))

      return business.Item ? business.Item : {};
    } catch (error: any) {
      throw Error(error.message);
    }
  }

  public async putItems(tableName: string, Item: any) {
    try {
      await ddb.send(
        new PutCommand({
          TableName: tableName,
          Item,
          ConditionExpression: "attribute_not_exists(id)",
        }),
      );
    } catch (error: any) {
      throw Error(error.message);
    }
  }

  public async getItem(
    tableName: string,
    Key:any
  ) {
    try {
      const resposne = await ddb.send(
        new GetCommand({
          TableName: tableName,
          Key,
        }),
      );
      console.log("getItem::::::", JSON.stringify(resposne))
      return resposne.Item ? resposne.Item : {};
    } catch (error: any) {
      throw Error(error.message);
    }
  }

  public async updateItems(
    tableName: string,
    Key: any,
    UpdateExpression: string,
    ExpressionAttributeValues: any,
  ) {
    try {
      await new UpdateCommand({
        TableName: tableName,
        Key,
        UpdateExpression,
        ExpressionAttributeValues,
      });
    } catch (error: any) {
      throw Error(error.message);
    }
  }
}

export const dynamoDBService = new DynamoDBService();

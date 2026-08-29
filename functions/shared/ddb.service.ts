import { DynamoDBClient  } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  BatchWriteCommand,
  BatchWriteCommandInput
} from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const MAX_BATCH_SIZE = 25;

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
      console.log("getBusinessByOwnerId::::::", JSON.stringify(business));

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

  public async getItem(tableName: string, Key: any) {
    try {
      const resposne = await ddb.send(
        new GetCommand({
          TableName: tableName,
          Key,
        }),
      );
      console.log("getItem::::::", JSON.stringify(resposne));
      return resposne.Item ? resposne.Item : {};
    } catch (error: any) {
      throw Error(error.message);
    }
  }

  public async updateItems(
    tableName: string,
    Key: any,
    UpdateExpression: string,
    ExpressionAttributeNames: any,
    ExpressionAttributeValues: any,
  ) {
    try {
      const command = {
        TableName: tableName,
        Key,
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      };
      console.log("updateItems command::::::::::::::::", JSON.stringify(command))
      await ddb.send(new UpdateCommand(command));
    } catch (error: any) {
      throw Error(error.message);
    }
  }

  public async getAllItems(
    tableName: string,
    KeyConditionExpression: any,
    ExpressionAttributeValues: any,
  ) {
    try {
      const command = {
        TableName: tableName,
        KeyConditionExpression,
        ExpressionAttributeValues,
      };
      console.log("getAllItems command::::", JSON.stringify(command));
      const resposne = await ddb.send(new QueryCommand(command));
      console.log("getAllItems::::::", JSON.stringify(resposne));
      return resposne.Items ? resposne.Items : [];
    } catch (error: any) {
      throw Error(error.message);
    }
  }

   public async getItemsByIndex(
    tableName: string,
    IndexName:string,
    KeyConditionExpression: any,
    ExpressionAttributeNames:any,
    ExpressionAttributeValues: any, 
  ) {
    try {
      const command = {
        TableName: tableName,
        IndexName,
        KeyConditionExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      };
      console.log("getItemsByIndex command::::", JSON.stringify(command));
      const resposne = await ddb.send(new QueryCommand(command));
      console.log("getItemsByIndex::::::", JSON.stringify(resposne));
      return resposne.Items ? resposne.Items : [];
    } catch (error: any) {
      throw Error(error.message);
    }
  }

 async batchWriteItems(
  tableName: string,
  items: any
): Promise<void> {
  if (!items.length) {
    return;
  }

  for (let i = 0; i < items.length; i += MAX_BATCH_SIZE) {
    const batch = items.slice(i, i + MAX_BATCH_SIZE);

    const requestItems: BatchWriteCommandInput["RequestItems"] = {
      [tableName]: batch.map((item:any) => ({
        PutRequest: {
          Item: item,
        },
      })),
    };

    let unprocessedItems = requestItems;

    do {
      const response = await ddb.send(
        new BatchWriteCommand({
          RequestItems: unprocessedItems,
        })
      );

      unprocessedItems = response.UnprocessedItems ?? {};

    } while (
      unprocessedItems[tableName] &&
      unprocessedItems[tableName].length > 0
    );
  }
};
}

export const dynamoDBService = new DynamoDBService();

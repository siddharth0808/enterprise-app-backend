import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDBService } from "../shared/ddb.service";
import { randomUUID } from "crypto";
import { Products } from "../shared/types";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;
const BUSINESS_TABLE = process.env.BUSINESS_TABLE!;
export class ProductService {
  constructor(private readonly ddbService = dynamoDBService) {}

  public async getProducts(ownerId: string) {
    try {
      const business = await this.ddbService.getBusinessByOwnerId(
        BUSINESS_TABLE,
        ownerId,
      );
      if (!business) throw Error("Business not found!");
      const products = await this.ddbService.getAllItems(
        PRODUCTS_TABLE,
        `businessId = :businessId`,
        { ":businessId": business.id },
      );
      return products;
    } catch (error: any) {
      console.log(error.stack);
      throw Error(error.message);
    }
  }

  public async createProducts(ownerId: string, body: any) {
    try {
      const business = await this.ddbService.getBusinessByOwnerId(
        BUSINESS_TABLE,
        ownerId,
      );
      if (!business) throw Error("Business not found!");

      const item: Products = {
        ownerId,
        businessId: business.id,
        id: randomUUID(),
        name: body.name,
        costPrice: Number(body.costPrice),
        sellingPrice: Number(body.sellingPrice),
        currentStock: Number(body.currentStock),
        minimumStock: Number(body.minimumStock),
        category: body.category,
        sku: body.sku,
        brand: body.brand,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.ddbService.putItems(PRODUCTS_TABLE, item)
      ddb.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: item }));

      return item;
    } catch (error: any) {
      console.log(error.stack);
      throw Error(error.message);
    }
  }
}

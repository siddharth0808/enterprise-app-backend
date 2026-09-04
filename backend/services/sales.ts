import { APIGatewayProxyResultV2 } from "aws-lambda";
import { SALES_TABLE_NAME } from "../constants/tableName";
import { dynamoDBService } from "../shared/ddb.service";
import { buildResponse } from "../utils/http";
import { logError } from "../utils/logger";

export class SalesService {
  constructor(private readonly ddbService = dynamoDBService) {}

  public async createSale(sale: any): Promise<APIGatewayProxyResultV2> {
    try {
      await this.ddbService.putItems(SALES_TABLE_NAME, sale);
      return buildResponse(201, { message: "Sale created successfully" });
    } catch (error: any) {
      logError("createSale", "Error creating sale", error);
      throw new Error(error.message);
    }
  }

  public async getSales(businessId: string): Promise<APIGatewayProxyResultV2> {
    try {
      const sales = await this.ddbService.getAllItems(
        SALES_TABLE_NAME,
        "businessId = :businessId",
        { ":businessId": businessId },
      );
      return buildResponse(200, { sales: sales ?? [] });
    } catch (error: any) {
      logError("getSales", "Error fetching sales", error);
      throw new Error(error.message);
    }
  }
}

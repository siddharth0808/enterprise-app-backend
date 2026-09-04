import { APIGatewayProxyResultV2 } from "aws-lambda";
import { BUSINESS_TABLE, SALES_TABLE_NAME } from "../constants/tableName";
import { dynamoDBService } from "../shared/ddb.service";
import { buildResponse } from "../utils/http";
import { getErrorMessage, logError } from "../utils/logger";
import { decodeNextToken, encodeNextToken } from "../utils/token";
import { CreateSaleRequest } from "../types/sales";

export class SalesService {
  constructor(private readonly ddbService = dynamoDBService) {}

  public async createSale(ownerId:string, ownerName: string, sale: CreateSaleRequest): Promise<APIGatewayProxyResultV2> {
    try {
      const business = await this.ddbService.getBusinessByOwnerId(
        BUSINESS_TABLE,
        ownerId,
      );
      if (!business) {
        logError("createProduct", "Business not found");
        return buildResponse(404, { message: "Business not found" });
      }
      await this.ddbService.putItems(SALES_TABLE_NAME, sale);
      return buildResponse(201, { message: "Sale created successfully" });
    } catch (error: unknown) {
      logError("createSale", "Error creating sale", error);
      return buildResponse(500, {
        message: getErrorMessage(error),
      });
    }
  }

  public async getSales(
    ownerId: string,
    limit: number,
    nextToken?: string,
  ): Promise<APIGatewayProxyResultV2> {
    try {
      const business = await this.ddbService.getBusinessByOwnerId(
        BUSINESS_TABLE,
        ownerId,
      );
      if (!business) {
        logError("createProduct", "Business not found");
        return buildResponse(404, { message: "Business not found" });
      }
      const sales = await this.ddbService.getItemsWithLimit(
        SALES_TABLE_NAME,
        "businessId = :businessId",
        { ":businessId": business.id },
        limit,
        nextToken ? decodeNextToken(nextToken) : undefined,
      );
      return buildResponse(200, {
        items: sales.items,
        nextToken: sales.lastEvaluatedKey
          ? encodeNextToken(sales.lastEvaluatedKey)
          : null,
      });
    } catch (error: unknown) {
      logError("getSales", "Error fetching sales", error);
      return buildResponse(500, {
        message: getErrorMessage(error),
      });
    }
  }
}

import { randomUUID } from "crypto";
import { Business } from "../types";
import { dynamoDBService } from "../shared/ddb.service";
import { BUSINESS_TABLE } from "../constants";
import { buildResponse } from "../utils/http";
import { logError } from "../utils/logger";

export class BusinessService {
  constructor(private readonly ddbService = dynamoDBService) {}

  public async setUpBusiness(ownerId: string, body: any) {
    try {
      const business: Business = {
        id: randomUUID(),
        ownerId,
        businessName: body.name,
        ownerName: body.ownerName,
        email: body.email,
        businessAddress: body.address,
        mobile: body.phone,
        businessType: body.businessType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.ddbService.putItems(BUSINESS_TABLE, business);
      return buildResponse(201, business);
    } catch (error: any) {
      logError("setUpBusiness", "Error setting up business", error);
      return buildResponse(500, { message: error.message });
    }
  }

  public async getBusiness(ownerId: string) {
    try {
      const business = await this.ddbService.getAllItems(
        BUSINESS_TABLE,
        "ownerId = :ownerId",
        { ":ownerId": ownerId },
      );
      return buildResponse(200, business ?? []);
    } catch (error: any) {
      logError("getBusiness", "Error fetching business", error);
      return buildResponse(500, { message: error.message });
    }
  }

  public async updateBusiness(ownerId: string, body: any) {
    try {
      const business = await this.ddbService.getBusinessByOwnerId(
        BUSINESS_TABLE,
        ownerId,
      );
      if (!business) {
        logError("updateBusiness", "Business not found");
        return buildResponse(404, { message: "Business not found" });
      }
      const updateItems = {
        Key: {
          ownerId
        },
        UpdateExpression: `SET businessName = :businessName, email = :email, businessAddress = :businessAddress, mobile = :mobile, updatedAt = :updatedAt`,
        ExpressionAttributeNames: null,
        ExpressionAttributeValues: {
          ":businessName": body.name,
          ":email": body.email,
          ":businessAddress": body.address,
          ":mobile": body.phone,
          ":updatedAt": new Date().toISOString(),
        },
      };
      const response = await this.ddbService.updateItems(
        BUSINESS_TABLE,
        updateItems.Key,
        updateItems.UpdateExpression,
        updateItems.ExpressionAttributeNames,
        updateItems.ExpressionAttributeValues,
      );
      return buildResponse(201, response);
    } catch (error: any) {
      logError("updateBusiness", "Error updating business", error);
      return buildResponse(500, { message: error.message });
    }
  }
}

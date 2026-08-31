import { randomUUID } from "crypto";
import { Business } from "../shared/types";
import { dynamoDBService } from "../shared/ddb.service";

const BUSINESS_TABLE = process.env.BUSINESS_TABLE!;

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
      return business;
    } catch (error: any) {
      throw Error(error.message);
    }
  }

  public async getBusiness(ownerId: string) {
    try {
      const business = await this.ddbService.getAllItems(
        BUSINESS_TABLE,
        "ownerId = :ownerId",
        { ":ownerId": ownerId },
      );
      return business;
    } catch (error: any) {
      throw Error(error.message);
    }
  }

  public async updateBusiness(ownerId: string, body: any) {
    try {
      const business = await this.ddbService.getBusinessByOwnerId(
        BUSINESS_TABLE,
        ownerId,
      );
      if (!business) throw Error("Business not found!");
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
      await this.ddbService.updateItems(
        BUSINESS_TABLE,
        updateItems.Key,
        updateItems.UpdateExpression,
        updateItems.ExpressionAttributeNames,
        updateItems.ExpressionAttributeValues,
      );
      return business;
    } catch (error: any) {
      throw Error(error.message);
    }
  }
}

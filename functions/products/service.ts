import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDBService } from "../shared/ddb.service";
import { randomUUID } from "crypto";
import { Products } from "../shared/types";
import { ExtractedInvoiceItem } from "../invoicesProcesser/types";
import { formatExpiryDate } from "../shared/utils";

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
        id: randomUUID(),
        ownerId,
        businessId: business.id,
        name: body.name,
        category: business.businessType,
        manufacturer: body?.manufacturer || "",
        rate: Number(body.rate),
        mrp: Number(body.mrp),
        batchNumber: body?.batchNumber || "",
        hsn: body?.hsn || "",
        status: body.status,
        amount: Number(body?.amount || 0),
        currentStock: Number(body.quantity),
        minimumStock: Number(body?.minimumStock || 0),
        cgst: Number(body?.cgst || 0),
        sgst: Number(body?.sgst || 0),
        expiryDate: formatExpiryDate(body.expiryDate || ""),
        discount: Number(body?.discount || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.ddbService.putItems(PRODUCTS_TABLE, item);
      ddb.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: item }));

      return item;
    } catch (error: any) {
      console.log(error.stack);
      throw Error(error.message);
    }
  }

  public async importProducts(
    ownerId: string,
    products: ExtractedInvoiceItem[],
  ) {
    try {
      const business = await this.ddbService.getBusinessByOwnerId(
        BUSINESS_TABLE,
        ownerId,
      );
      if (!business) throw Error("Business not found!");

      const newProducts = products.filter(
        (product: ExtractedInvoiceItem) => product.status === "NEW",
      );

      const existingProducts = products.filter(
        (product: ExtractedInvoiceItem) => product.status === "EXISITING",
      );
      let items: any;
      if (newProducts.length) {
        items = newProducts.map((product: ExtractedInvoiceItem) => {
          return {
            id: product.id,
            ownerId,
            businessId: business.id,
            name: product.name,
            category: business.businessType,
            manufacturer: product.manufacturer,
            rate: Number(product.rate),
            mrp: Number(product.mrp),
            batchNumber: product.batchNumber,
            hsn: product.hsn,
            status: product.status,
            amount: Number(product.amount),
            currentStock: Number(product.quantity),
            minimumStock: Number(product?.minimumStock || 0),
            cgst: Number(product.cgst),
            sgst: Number(product.sgst),
            expiryDate: formatExpiryDate(product.expiryDate || ""),
            discount: Number(product.discount),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });
        await this.ddbService.batchWriteItems(PRODUCTS_TABLE, items);
      }
      if (existingProducts.length) {
        items = existingProducts.map((product: ExtractedInvoiceItem) => {
          return {
            Key: {
              businessId: business.id,
              id: product.id,
            },
            UpdateExpression:
              "SET #status = :status, currentStock = :currentStock, mrp = :mrp, rate = :rate, amount = :amount, updatedAt = :updatedAt",
            ExpressionAttributeNames: {
              "#status": "status",
            },
            ExpressionAttributeValues: {
              ":status": product.status,
              ":currentStock":
                Number(product.quantity) + Number(product.currentQuantity),
              ":mrp": Number(product.mrp),
              ":rate": Number(product.rate),
              ":amount": Number(product.amount),
              ":updatedAt": new Date().toISOString(),
            },
          };
        });

        await this.ddbService.batchUpdateItems(PRODUCTS_TABLE, items)
      }
      return items;
    } catch (error: any) {
      console.log(error.stack);
      throw Error(error.message);
    }
  }
}

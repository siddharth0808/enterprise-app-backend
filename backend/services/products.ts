import { dynamoDBService } from "../shared/ddb.service";
import { randomUUID } from "crypto";
import { Products } from "../types";
import { ExtractedInvoiceItem } from "../types/invoicesProcesser";
import { formatExpiryDate } from "../utils";
import { BUSINESS_TABLE, PRODUCTS_TABLE } from "../constants";
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
      console.log("getProducts error:::::", error.stack);
      throw Error(error.message);
    }
  }

  public async createProduct(ownerId: string, body: any) {
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
        rate: Number(body.rate),
        mrp: Number(body.mrp),
        currentStock: Number(body.currentStock),
        manufacturer: body?.manufacturer || "",
        batchNumber: body?.batchNumber || "",
        hsn: body?.hsn || "",
        status: body.status,
        amount: Number(body?.amount || 0),
        minimumStock: Number(body?.minimumStock || 0),
        cgst: Number(body?.cgst || 0),
        sgst: Number(body?.sgst || 0),
        expiryDate: new Date(body.expiryDate).valueOf() || 0,
        discount: Number(body?.discount || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      console.log("items:::::::::::::::::::", JSON.stringify(item));
      await this.ddbService.putItems(PRODUCTS_TABLE, item);

      return item;
    } catch (error: any) {
      console.log(error.stack);
      throw Error(error.message);
    }
  }

  public async updateProduct(ownerId: string, productId: string, body: any) {
    try {
      const {
        name,
        mrp,
        rate,
        currentStock,
        minimumStock,
        expiryDate,
        manufacturer,
        amount,
        discount,
      } = body;
      const business = await this.ddbService.getBusinessByOwnerId(
        BUSINESS_TABLE,
        ownerId,
      );
      if (!business) throw Error("Business not found!");
      const updateItems = {
        Key: {
          businessId: business.id,
          id: productId,
        },
        UpdateExpression: `SET #name = :name, mrp = :mrp, rate = :rate, currentStock = :currentStock, minimumStock = :minimumStock, expiryDate = :expiryDate, manufacturer = :manufacturer, amount = :amount, discount = :discount, updatedAt = :updatedAt`,
        ExpressionAttributeNames: {
          "#name": "name",
        },
        ExpressionAttributeValues: {
          ":name": name,
          ":mrp": Number(mrp),
          ":rate": Number(rate),
          ":currentStock": Number(currentStock),
          ":minimumStock": Number(minimumStock),
          ":expiryDate": new Date(expiryDate).valueOf(),
          ":manufacturer": manufacturer,
          ":amount": Number(amount),
          ":discount": Number(discount),
          ":updatedAt": new Date().toISOString(),
        },
      };

      const item = await this.ddbService.updateItems(
        PRODUCTS_TABLE,
        updateItems.Key,
        updateItems.UpdateExpression,
        updateItems.ExpressionAttributeNames,
        updateItems.ExpressionAttributeValues,
      );
      console.log("Updated items:::", JSON.stringify(item));
      return { ...item, id: productId };
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
        (product: ExtractedInvoiceItem) => product.status === "EXISTING",
      );
      let items: any =[];
      console.log("New products::::::::::::::::", JSON.stringify(newProducts))
      if (newProducts.length) {
        items = newProducts.map((product: ExtractedInvoiceItem) => {
          return {
            id: product.id,
            ownerId,
            businessId: business.id,
            name: product.name,
            category: business.businessType,
            manufacturer: product?.manufacturer || '',
            rate: Number(product.rate || 0),
            mrp: Number(product.mrp || 0),
            batchNumber: product.batchNumber,
            hsn: product?.hsn || "",
            status: product.status,
            amount: Number(product?.amount || 0),
            currentStock: Number(product.quantity || 0),
            minimumStock: Number(product?.minimumStock || 0),
            cgst: Number(product?.cgst || 0),
            sgst: Number(product?.sgst || 0),
            expiryDate: product.expiryDate ? new Date(product.expiryDate).valueOf() : product.expiryDate,
            discount: Number(product?.discount || 0),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });
      console.log("New products items::::::::::::::::", JSON.stringify(items))

        await this.ddbService.batchWriteItems(PRODUCTS_TABLE, items);
      }
      console.log("Existing products::::::::::::::::", JSON.stringify(existingProducts))

      if (existingProducts.length) {
        const updateItems = existingProducts.map((product: ExtractedInvoiceItem) => {
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

        await this.ddbService.batchUpdateItems(PRODUCTS_TABLE, updateItems);
        items = [...items, ...existingProducts];
      }
      return items;
    } catch (error: any) {
      console.log(error.stack);
      throw Error(error.message);
    }
  }

   public async deleteProduct(ownerId: string, id:string) {
    try {
      const business = await this.ddbService.getBusinessByOwnerId(
        BUSINESS_TABLE,
        ownerId,
      );
      if (!business) throw Error("Business not found!");
      const products = await this.ddbService.deleteItem(
        PRODUCTS_TABLE,
        {
          businessId: business.id,
          id
        }
      );
      return products;
    } catch (error: any) {
      console.log("getProducts error:::::", error.stack);
      throw Error(error.message);
    }
  }
}

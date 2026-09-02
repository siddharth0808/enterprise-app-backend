import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { json, getClaims } from "../shared/http";
import { ProductService } from "./service";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  console.log("EVENT::::", JSON.stringify(event));

  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;
  const { sub } = getClaims(event);


  const service = new ProductService();

  if (method === "POST" && path.includes('/import')) {
    const products = JSON.parse(event.body ?? "[]");
    if(!products.length) return json(400, 'No products in payload!')
    const item = await service.importProducts(sub, products);
    return json(201, item);
  }

  if (method === "POST") {
    const body = JSON.parse(event.body ?? "{}");
    const required = ["name", "mrp", "rate", "currentStock", "expiryDate"];
    const missing = required.filter((field) => !body[field]);
    if (missing.length) {
      return json(400, { message: `Missing fields: ${missing.join(", ")}` });
    }
    const item = await service.createProduct(sub, body);
    return json(201, item);
  }

  if (method === "PATCH") {
      const { id }: any = event.pathParameters;

    const body = JSON.parse(event.body ?? "{}");
    const required = ["name", "mrp", "rate", "expiryDate"];

    const missing = required.filter((field) => !body[field]);
    if (missing.length) {
      return json(400, { message: `Missing fields: ${missing.join(", ")}` });
    }
    const item = await service.updateProduct(sub, id, body);
    return json(200, item);
  }

  if (method === "DELETE") {
      const { id }: any = event.pathParameters;
    const item = await service.deleteProduct(sub, id);
    return json(200, item);
  }

  if (method === "GET") {
    const result = await service.getProducts(sub);
    return json(200, result);
  }

  return json(405, { message: "Method not allowed" });
};

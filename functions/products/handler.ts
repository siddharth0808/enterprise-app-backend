import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { json, getClaims } from "../shared/http";
import { ProductService } from "./service";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  const method = event.requestContext.http.method;
  const { sub } = getClaims(event);

  const service = new ProductService();

  if (method === "POST") {
    const body = JSON.parse(event.body ?? "{}");
    const required = ["name", "costPrice", "sellingPrice"];
    const missing = required.filter((field) => !body[field]);
    if (missing.length) {
      return json(400, { message: `Missing fields: ${missing.join(", ")}` });
    }
    const item = await service.createProducts(sub, body);
    return json(201, item);
  }

  if (method === "GET") {
    const result = await service.getProducts(sub);
    return json(200, result);
  }

  return json(405, { message: "Method not allowed" });
};

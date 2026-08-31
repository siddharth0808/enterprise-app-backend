import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { json, getClaims } from "../shared/http";;
import { TransactionService } from "./service";



export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  const method = event.requestContext.http.method;
  const { sub, fullName ='' } = getClaims(event);
  const { productId }: any = event.pathParameters;
  const service = new TransactionService()

  if (method === "POST") {
    const body = JSON.parse(event.body ?? "{}");
    const required = ["quantity", "type"];
    const missing = required.filter((field) => !body[field]);
    if (missing.length) {
      return json(400, { message: `Missing fields: ${missing.join(", ")}` });
    }

    const item = await service.updateTransaction(sub, fullName, productId, body)
    return json(201, item);
  }

  if (method === "GET") {
    const result = await service.getTransactions(sub, productId)
    return json(200, result ?? []);
  }

  return json(405, { message: "Method not allowed" });
};

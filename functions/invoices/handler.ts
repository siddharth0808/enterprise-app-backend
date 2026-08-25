import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { json } from "../shared/http";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  const method = event.requestContext.http.method;
  console.log("event:", JSON.stringify(event));
  return json(200, { message: "invoices lambda working!" });
};

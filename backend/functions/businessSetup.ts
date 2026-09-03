import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { json, getClaims } from "../utils/http";
import { BusinessService } from "../services/businessSetup";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Cognito already created the user account (sign-up happens client-side against
// the User Pool).
export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  const method = event.requestContext.http.method;
  const { sub } = getClaims(event);
  const body = JSON.parse(event.body ?? "{}");
  const service =  new BusinessService()
  if (method === "POST") {
    const required = ["name", "ownerName", "email", "address", "phone", "businessType"];
    const missing = required.filter((field) => !body[field]);
    if (missing.length) {
      return json(400, { message: `Missing fields: ${missing.join(", ")}` });
    }

    const business =  await service.setUpBusiness(sub, body);
    return json(201, business);
  }

  if (method === "PATCH") {
    const required = ["name", "email", "address", "phone"];
    const missing = required.filter((field) => !body[field]);
    if (missing.length) {
      return json(400, { message: `Missing fields: ${missing.join(", ")}` });
    }
    const business =  await service.updateBusiness(sub, body)
    return json(201, business);
  }

  if (method === "GET") {
    const result =await service.getBusiness(sub)
    return json(200, result ?? []);
  }
};

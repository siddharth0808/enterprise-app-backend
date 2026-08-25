import {
  APIGatewayProxyEventV2WithJWTAuthorizer,
} from "aws-lambda";
import { getClaims, json, response } from "../shared/http";
import { UploadInvoiceService } from "./uploadInvoiceService";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  try {
    const { sub } = getClaims(event);
    const body = event.body ? JSON.parse(event.body) : null;

    if (!body) {
      return json(400, {
        message: "Request body is required",
      });
    }
    const service =  new UploadInvoiceService();
    const response =  await service.uploadInvoice(body, sub)

    return json(201,response);
  } catch (error) {
    console.error("Create invoice failed", error);

    return response(500, {
      message: "Failed to create invoice",
    });
  }
};



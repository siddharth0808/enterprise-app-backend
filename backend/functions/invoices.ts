import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { getClaims, json, response } from "../utils/http";
import { UploadInvoiceService } from "../services/invoices";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => {
  try {
    console.log("EVENT::::", JSON.stringify(event));

    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;
    const { sub } = getClaims(event);

    const service = new UploadInvoiceService();

    if (method === "POST" && path.includes("/status")) {
      const invoiceId = event.pathParameters?.invoiceId;
      if (!invoiceId) return json(400, { message: "invoiceId is required" });
      const response = await service.updateInvoiceStatus(sub, invoiceId);
      return json(201, response);
    }

    if (method === "GET" && path.includes("/status")) {
      const invoiceId = event.pathParameters?.invoiceId;
      if (!invoiceId) return json(400, { message: "invoiceId is required" });
      const response = await service.getInvoiceStatus(sub, invoiceId);
      return json(200, response);
    }

    if (method === "GET" && path.includes("/review")) {
      const invoiceId = event.pathParameters?.invoiceId;
      if (!invoiceId) return json(400, { message: "invoiceId is required" });
      const response = await service.getInvoiceReview(sub, invoiceId);
      return json(200, response);
    }

    const body = event.body ? JSON.parse(event.body) : null;
    if (!body) {
      return json(400, {
        message: "Request body is required",
      });
    }
    const response = await service.uploadInvoice(body, sub);
    return json(201, response);
  } catch (error) {
    console.error("Create invoice failed", error);

    return response(500, {
      message: "Failed to create invoice",
    });
  }
};

import { InvoiceProcesserService } from "../services/invoicesProcesser";
import { logError } from "../utils/logger";

export const handler = async (event: any) => {
  try {
    const service = new InvoiceProcesserService();
    await service.execute(event);
  } catch (error: any) {
    logError("InvoiceProcesser", "Error processing invoice", error);
  }
};

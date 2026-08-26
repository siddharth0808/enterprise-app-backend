import { response } from "../shared/http";
import { InvoiceProcesserService } from "./service";

export const handler = async (event: any) => {
  try {
    console.log(event);
    const service = new InvoiceProcesserService();
    await service.execute(event);
  } catch (error: any) {
    console.error("Invoice Processer failed", error.stack);
  }
};

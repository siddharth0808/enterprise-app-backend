export const handler = (event: any) => {
  try {
    console.log(event);
  } catch (error: any) {
    console.error("Invoice Processer failed", error.stack);
  }
};

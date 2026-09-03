import { TextractInvoiceExtractor } from "../services/textractExtractor";



async function main() {
    const textract =  new TextractInvoiceExtractor();
    await textract.extract({bucket: 'goods-wise-qa', documentKey:'0458c418-f031-70a3-5ed6-1281f32f1eac/invoices/ad737753-efe9-4386-91a3-aeabb501971a/40414c4c-d3e6-4748-a77e-b9ece0804c1c/invoice.pdf'})
}

main()
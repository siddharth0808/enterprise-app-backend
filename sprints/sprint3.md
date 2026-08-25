# Sprint 3 — Invoice Import
**Sprint Goal**

Allow a business owner to upload a distributor invoice containing multiple products, review the extracted information, match products, and safely import the inventory.

# US-3.1 — Upload Invoice

As a business owner, I want to upload a distributor invoice so that I can add multiple inventory items without entering them manually.

Supported files

Initially:

    PDF
    JPG / JPEG
    PNG

**Acceptance Criteria:**

- User can select an invoice from their computer.
- File is uploaded to S3.
- Maximum file size is enforced.
- Unsupported file types are rejected.
- Upload progress is displayed.
- User can cancel before processing.
- Invoice belongs to the authenticated business.
- Original invoice is never modified.
- API
- POST /invoices

#

# US-3.2 — Store Invoice Metadata

Create an invoice record before processing.

**TypeScript:**

```
interface Invoice {
  id: string;
  businessId: string;

  invoiceNumber?: string;
  invoiceDate?: string;
  supplierName?: string;
  suplierContact?:string  
  documentKey: string;
  documentType: "PDF" | "IMAGE";

  status:
    | "UPLOADED"
    | "PROCESSING"
    | "REVIEW"
    | "IMPORTED"
    | "FAILED";

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

**Initial state:**
```
UPLOADED
```
#
# US-3.3 — Process Invoice

As a business owner, I want the system to analyze my invoice so that product information can be extracted automatically.

**Flow:**

```
S3
 ↓
Queue
 ↓
Invoice Analyzer Lambda
 ↓
OCR / AI
 ↓
Structured Invoice Data
```

The processing should be asynchronous.

Don't make the upload API wait for AI/OCR processing.

#
# US-3.4 — Extract Invoice Information

Extract:

**Invoice**
```
Invoice Number
Invoice Date
Supplier Name
Supplier Contact
```
**Products**
```
Product Name
SKU
Barcode
Quantity
Cost Price
Selling Price (if available)
```
**Example:**
```
{
  "invoiceNumber": "INV-10293",
  "invoiceDate": "2026-08-25",
  "supplierName": "ABC Distributors",
  "items": [
    {
      "name": "Maggi 70g",
      "quantity": 100,
      "costPrice": 12
    }
  ]
}
```

#
# US-3.5 — Match Existing Products

As a business owner, I want invoice products to be matched with my existing products so that duplicate products aren't created.

**Example:**
```
Invoice:
"Maggi 70g"

Existing:
"Maggi 70g"
```
→ Match.

**Possible matching priority:**
```
1. Barcode
2. SKU
3. Exact product identifier
4. Normalized product name
5. Fuzzy name matching
```
AI can assist with matching later, but the result must remain reviewable by the user.

#
# US-3.6 — Review Imported Products

As a business owner, I want to review the extracted products before importing them so that incorrect AI/OCR results don't affect my inventory.

**Show:**
```
24 products detected

18 Existing
6 New
2 Need Review
```
**Allow:**

- Edit product
- Change product match
- Exclude product
- Select/unselect products

No inventory changes happen yet.

#
# US-3.7 — Resolve New Products

**If no existing product matches:**
```
+ New Product
```
**User can provide:**
```
Product Name
SKU
Barcode
Category
Brand
Cost Price
Selling Price
Minimum Stock
```
The invoice quantity becomes the initial stock.

**Example:**

```
Pepsi 500ml

Quantity: 30

New Product
Initial Stock: 30
```

#
# US-3.8 — Confirm Import

As a business owner, I want to confirm the reviewed invoice so that the products and inventory are actually created/updated.

**Before confirmation:**
```
24 products
18 existing
6 new

Total units:
1,245
```
**Button:**
```
[ Confirm Import ]
```
The button must be disabled if required product information is missing.

#
# US-3.9 — Import Inventory Atomically

This is the most important backend story.

**After confirmation:**
```
Existing product
Current Stock = 20
Invoice Qty   = 100

New Stock = 120
```
**Create:**
```
InventoryTransaction

type = STOCK_IN
quantity = 100
```

**New product:**
```
Create Product
currentStock = 100
```
**and:**
```
InventoryTransaction
type = STOCK_IN
quantity = 100
```
**For each import operation, we need to ensure we don't end up with:**
```
Product updated
but transaction missing
```
**or:**
```
Transaction created
but product not updated
```
Use DynamoDB transactions where the operation fits within DynamoDB transaction limits.

For larger invoices, we'll need a batch/chunked import strategy with idempotency rather than assuming one DynamoDB transaction can contain an unlimited number of items.

#
# US-3.10 — Idempotent Import

This is especially important.

**Imagine the user clicks:**
```
Confirm Import
```
and the network times out.

They click it again.

We must not add the inventory twice.

***Use an importId / idempotency key:***
```
{
  "invoiceId": "invoice-123",
  "importId": "import-456"
}
```
**The backend should recognize that:**
```
import-456
```
has already been processed.

#
# US-3.11 — Import History

**Show previous imports:**
```
Date          Invoice       Supplier        Products   Status
----------------------------------------------------------------
25 Aug 2026   INV-10293     ABC Distributor    24      Imported
20 Aug 2026   INV-10251     XYZ Distributor    18      Imported
```
**Possible statuses:**
```
PROCESSING
REVIEW
IMPORTED
PARTIAL
FAILED
```
#
# US-3.12 — Import Result

**After completion:**
```
✓ Inventory Imported Successfully

24 products processed

18 existing products updated
6 new products created

1,245 units added
```
**For partial failure:**
```
Import Completed With Warnings

22 products imported
2 products failed

[ Review Failed Items ]
```
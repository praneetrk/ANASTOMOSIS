export interface InvoiceItem {
  Item_Description?: string;
  HSN_Code?: string;
  Quantity?: number | string;
  Unit?: string;
  Tax_Subtext?: string;
}

export interface InvoiceData {
  Invoice_No: string;
  Invoice_Date?: string;
  DC_No?: string;
  DC_Date?: string;
  PO_No?: string;
  Vehicle_No?: string;
  Location?: string;
  Buyer_Name?: string;
  Buyer_Address?: string;
  Shipped_To_Name?: string;
  Shipped_To_Address?: string;
  Buyer_GSTIN?: string;
  Buyer_PAN?: string;
  Vendor_Code?: string;
  items: InvoiceItem[];
}

export interface ParsedExcelRow {
  Invoice_No?: string | number;
  Invoice_Date?: string | number;
  DC_No?: string | number;
  DC_Date?: string | number;
  PO_No?: string | number;
  Vehicle_No?: string | number;
  Location?: string;
  Buyer_Name?: string;
  Buyer_Address?: string;
  Shipped_To_Name?: string;
  Shipped_To_Address?: string;
  Buyer_GSTIN?: string;
  Buyer_PAN?: string;
  Vendor_Code?: string;
  Item_Description?: string;
  HSN_Code?: string | number;
  Quantity?: string | number;
  Unit?: string;
  [key: string]: unknown;
}

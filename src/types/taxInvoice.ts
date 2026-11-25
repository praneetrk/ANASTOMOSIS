export interface TaxInvoiceItem {
  Sr?: number;
  Item_Description: string;
  HSN_Code?: string;
  Quantity: number | string;
  Unit?: string;
  Rate: number | string;
  Taxable_Amount?: number | string;
  GST_Rate?: number | string;
  GST_Amount?: number | string;
  Total_Amount?: number | string;
  Tax_Subtext?: string;
}

export interface TaxInvoiceData {
  docType?: "invoice";
  Invoice_No: string;
  Invoice_Date?: string;
  DC_No?: string;
  DC_Date?: string;
  PO_No?: string;
  Vehicle_No?: string;

  // Buyer / Consignee details
  Billed_To_Name?: string;
  Billed_To_Address?: string;
  Billed_To_State?: string;
  Billed_To_State_Code?: string;

  Shipped_To_Name?: string;
  Shipped_To_Address?: string;
  Shipped_To_State?: string;
  Shipped_To_State_Code?: string;

  Buyer_GSTIN?: string;
  Buyer_PAN?: string;
  Vendor_Code?: string;
  Place_Of_Supply?: string;
  Dispatched_Through?: string;

  // Items
  items: TaxInvoiceItem[];

  // Tax and Totals (editable/overridable)
  Total_Amount_Before_Tax?: number | string;
  CGST_Rate?: number | string;
  CGST_Amount?: number | string;
  SGST_Rate?: number | string;
  SGST_Amount?: number | string;
  IGST_Rate?: number | string;
  IGST_Amount?: number | string;
  Round_Off?: number | string;
  Total_Tax_Amount?: number | string;
  Total_Amount_After_Tax?: number | string;
  Amount_In_Words?: string;
  Note?: string;

  // Signatory & Bank Details
  Signatory_Name?: string;
  Signatory_Date?: string;
  Bank_Name?: string;
  Beneficiary_Name?: string;
  Branch_Name?: string;
  Account_No?: string;
  IFSC_Code?: string;

  // Header Details (Emergency Editable)
  Company_Name?: string;
  Company_Address?: string;
  Company_GSTIN?: string;

  // Footer Details (Emergency Editable)
  Terms_Conditions?: string;
  Signatory_Company_Text?: string;
  Signatory_Label?: string;
}


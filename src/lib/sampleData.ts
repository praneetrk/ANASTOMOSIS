import * as XLSX from "xlsx";
import { InvoiceData } from "@/types/invoice";

export const SAMPLE_INVOICES: InvoiceData[] = [
  {
    Invoice_No: "AE134-N/26-27",
    Invoice_Date: "27/10/2026",
    DC_No: "AE134-N/26-27",
    DC_Date: "27/10/2026",
    PO_No: "241128591",
    Vehicle_No: "RJ09GE7594",
    Location: "NAVSARI CBG",
    Buyer_Name: "M/S. Reliance Industries Limited",
    Buyer_Address:
      "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
    Shipped_To_Name: "M/S. Reliance Industries Limited",
    Shipped_To_Address:
      "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
    Buyer_GSTIN: "24AAACR5055K1ZD",
    Buyer_PAN: "AAACR5055K",
    Vendor_Code: "3778226",
    items: [
      {
        Item_Description: "MSW_CBG",
        HSN_Code: "3825 10 00",
        Quantity: "40.000",
        Unit: "TON",
        Tax_Subtext: "GST-0% (HSN 3825 10 00)",
      },
    ],
  },
  {
    Invoice_No: "AE135-N/26-27",
    Invoice_Date: "28/10/2026",
    DC_No: "AE135-N/26-27",
    DC_Date: "28/10/2026",
    PO_No: "241128592",
    Vehicle_No: "RJ09GE7595",
    Location: "NAVSARI CBG",
    Buyer_Name: "M/S. Reliance Industries Limited",
    Buyer_Address:
      "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
    Shipped_To_Name: "M/S. Reliance Industries Limited",
    Shipped_To_Address:
      "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
    Buyer_GSTIN: "24AAACR5055K1ZD",
    Buyer_PAN: "AAACR5055K",
    Vendor_Code: "3778226",
    items: [
      {
        Item_Description: "MSW_CBG",
        HSN_Code: "3825 10 00",
        Quantity: "38.500",
        Unit: "TON",
        Tax_Subtext: "GST-0% (HSN 3825 10 00)",
      },
    ],
  },
];

export function generateSampleExcelFile(): Uint8Array {
  const rows = [
    {
      Invoice_No: "AE134-N/26-27",
      Invoice_Date: "27/10/2026",
      DC_No: "AE134-N/26-27",
      DC_Date: "27/10/2026",
      PO_No: "241128591",
      Vehicle_No: "RJ09GE7594",
      Location: "NAVSARI CBG",
      Buyer_Name: "M/S. Reliance Industries Limited",
      Buyer_Address: "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
      Shipped_To_Name: "M/S. Reliance Industries Limited",
      Shipped_To_Address: "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
      Buyer_GSTIN: "24AAACR5055K1ZD",
      Buyer_PAN: "AAACR5055K",
      Item_Description: "MSW_CBG",
      HSN_Code: "3825 10 00",
      Quantity: "40.000",
      Unit: "TON",
    },
    {
      Invoice_No: "AE135-N/26-27",
      Invoice_Date: "28/10/2026",
      DC_No: "AE135-N/26-27",
      DC_Date: "28/10/2026",
      PO_No: "241128592",
      Vehicle_No: "RJ09GE7595",
      Location: "NAVSARI CBG",
      Item_Description: "MSW_CBG",
      HSN_Code: "3825 10 00",
      Quantity: "38.500",
      Unit: "TON",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DeliveryChallans");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Uint8Array(excelBuffer);
}

export function downloadSampleExcel(filename = "Delivery_Challan_Template.xlsx") {
  if (typeof window === "undefined") return;
  const uint8 = generateSampleExcelFile();
  const blob = new Blob([uint8 as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

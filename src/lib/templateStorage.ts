import { FieldConfig, getDefaultFieldConfigs } from "@/lib/templateExcelMerger";

export interface SavedTemplate {
  id: string;
  name: string;
  docType: "challan" | "invoice";
  updatedAt: string;
  configs: Record<string, FieldConfig>;
}

const STORAGE_KEY = "anastomosis_saved_templates_v1";

export const PRESET_TEMPLATES: SavedTemplate[] = [
  {
    id: "preset-reliance-survey-641",
    name: "Reliance - Survey 641 (Nikol / Ahmedabad / Navsari)",
    docType: "challan",
    updatedAt: "2026-11-26",
    configs: {
      ...getDefaultFieldConfigs(null, "challan"),
      Company_Address: {
        key: "Company_Address",
        label: "Issuer Office Address",
        category: "company",
        isConstant: true,
        value: "A-715, KRISH ELITE, S P RING ROAD, NIKOL, Ahmedabad-380049, Gujarat- India",
      },
      Buyer_Name: {
        key: "Buyer_Name",
        label: "Billed To Name",
        category: "receiver",
        isConstant: true,
        value: "M/S. Reliance Industries Limited",
      },
      Buyer_Address: {
        key: "Buyer_Address",
        label: "Billed To Address",
        category: "receiver",
        isConstant: true,
        value:
          "Survey No/Village: 641/A1, 641/A2, 641/B1, 641/B2 642 Part, 643, 644/A1, 644/A2, 644/B1, Navsari, Gujarat",
      },
      Shipped_To_Name: {
        key: "Shipped_To_Name",
        label: "Shipped To Name",
        category: "receiver",
        isConstant: true,
        value: "M/S. Reliance Industries Limited",
      },
      Shipped_To_Address: {
        key: "Shipped_To_Address",
        label: "Shipped To Address",
        category: "receiver",
        isConstant: true,
        value:
          "Survey No/Village: 641/A1, 641/A2, 641/B1, 641/B2 642 Part, 643, 644/A1, 644/A2, 644/B1, Navsari, Gujarat",
      },
      Buyer_GSTIN: {
        key: "Buyer_GSTIN",
        label: "Buyer GST No.",
        category: "receiver",
        isConstant: true,
        value: "24AAACR5055K1ZD",
      },
      Buyer_PAN: {
        key: "Buyer_PAN",
        label: "Buyer PAN No.",
        category: "receiver",
        isConstant: true,
        value: "AAACR5055K",
      },
      Location: {
        key: "Location",
        label: "Location / Site",
        category: "header",
        isConstant: true,
        value: "NAVSARI CBG",
      },
    },
  },
  {
    id: "preset-reliance-khadsupa",
    name: "Reliance - Khadsupa (Navsari CBG Plant)",
    docType: "challan",
    updatedAt: "2026-11-26",
    configs: {
      ...getDefaultFieldConfigs(null, "challan"),
      Company_Address: {
        key: "Company_Address",
        label: "Issuer Office Address",
        category: "company",
        isConstant: true,
        value: "A-715, KRISH ELITE, S P RING ROAD, NIKOL, Ahmedabad-380049, Gujarat- India",
      },
      Buyer_Name: {
        key: "Buyer_Name",
        label: "Billed To Name",
        category: "receiver",
        isConstant: true,
        value: "M/S. Reliance Industries Limited",
      },
      Buyer_Address: {
        key: "Buyer_Address",
        label: "Billed To Address",
        category: "receiver",
        isConstant: true,
        value: "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
      },
      Shipped_To_Name: {
        key: "Shipped_To_Name",
        label: "Shipped To Name",
        category: "receiver",
        isConstant: true,
        value: "M/S. Reliance Industries Limited",
      },
      Shipped_To_Address: {
        key: "Shipped_To_Address",
        label: "Shipped To Address",
        category: "receiver",
        isConstant: true,
        value: "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
      },
      Buyer_GSTIN: {
        key: "Buyer_GSTIN",
        label: "Buyer GST No.",
        category: "receiver",
        isConstant: true,
        value: "24AAACR5055K1ZD",
      },
      Buyer_PAN: {
        key: "Buyer_PAN",
        label: "Buyer PAN No.",
        category: "receiver",
        isConstant: true,
        value: "AAACR5055K",
      },
      Location: {
        key: "Location",
        label: "Location / Site",
        category: "header",
        isConstant: true,
        value: "NAVSARI CBG",
      },
    },
  },
  {
    id: "preset-reliance-jamnagar",
    name: "Reliance - Jamnagar Solar (Lalpur)",
    docType: "invoice",
    updatedAt: "2026-11-26",
    configs: {
      ...getDefaultFieldConfigs(null, "invoice"),
      Company_Address: {
        key: "Company_Address",
        label: "Issuer Office Address",
        category: "company",
        isConstant: true,
        value: "A-715, KRISH ELITE, S P RING ROAD, NIKOL, Ahmedabad-380049, Gujarat- India",
      },
      Buyer_Name: {
        key: "Buyer_Name",
        label: "Billed To Name",
        category: "receiver",
        isConstant: true,
        value: "M/S. Reliance New Solar Energy Limited",
      },
      Buyer_Address: {
        key: "Buyer_Address",
        label: "Billed To Address",
        category: "receiver",
        isConstant: true,
        value: "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006",
      },
      Shipped_To_Name: {
        key: "Shipped_To_Name",
        label: "Shipped To Name",
        category: "receiver",
        isConstant: true,
        value: "Reliance New Solar Energy Limited",
      },
      Shipped_To_Address: {
        key: "Shipped_To_Address",
        label: "Shipped To Address",
        category: "receiver",
        isConstant: true,
        value: "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006",
      },
      Buyer_GSTIN: {
        key: "Buyer_GSTIN",
        label: "Buyer GST No.",
        category: "receiver",
        isConstant: true,
        value: "24AALCR0464R1ZT",
      },
      Buyer_PAN: {
        key: "Buyer_PAN",
        label: "Buyer PAN No.",
        category: "receiver",
        isConstant: true,
        value: "AALCR0464R",
      },
      Location: {
        key: "Location",
        label: "Location / Site",
        category: "header",
        isConstant: true,
        value: "JAMNAGAR",
      },
    },
  },
];

export function getSavedTemplates(docType?: "challan" | "invoice"): SavedTemplate[] {
  if (typeof window === "undefined") {
    return PRESET_TEMPLATES.filter((t) => !docType || t.docType === docType);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const customTemplates: SavedTemplate[] = raw ? JSON.parse(raw) : [];
    const all = [...PRESET_TEMPLATES, ...customTemplates];
    return docType ? all.filter((t) => t.docType === docType) : all;
  } catch {
    return PRESET_TEMPLATES.filter((t) => !docType || t.docType === docType);
  }
}

export function saveCustomTemplate(template: Omit<SavedTemplate, "id" | "updatedAt">): SavedTemplate {
  const newTemplate: SavedTemplate = {
    ...template,
    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    updatedAt: new Date().toISOString().split("T")[0],
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const customTemplates: SavedTemplate[] = raw ? JSON.parse(raw) : [];
      // Replace if same name, else add
      const filtered = customTemplates.filter((t) => t.name.toLowerCase() !== template.name.toLowerCase());
      filtered.push(newTemplate);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to save template to localStorage:", e);
    }
  }

  return newTemplate;
}

export function deleteCustomTemplate(id: string): void {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const customTemplates: SavedTemplate[] = raw ? JSON.parse(raw) : [];
      const updated = customTemplates.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to delete template from localStorage:", e);
    }
  }
}

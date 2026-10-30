export const BUSINESS_TYPES = [
  { id: "grocery", label: "Grocery / general store" },
  { id: "clothing", label: "Clothing / footwear" },
  { id: "electronics", label: "Electronics / accessories" },
  { id: "other", label: "Other business" }
];

export const PRODUCT_FIELDS = [
  { id: "brand", label: "Brand", type: "text" },
  { id: "size", label: "Size", type: "text" },
  { id: "color", label: "Colour", type: "text" },
  { id: "packSize", label: "Pack size / weight", type: "text" },
  { id: "flavour", label: "Flavour", type: "text" },
  { id: "model", label: "Model / compatibility", type: "text" },
  { id: "expiryDate", label: "Expiry date", type: "date" }
];

export const STANDARD_PRODUCT_FIELDS = [
  { id: "name", label: "Product name", required: true },
  { id: "unit", label: "Unit", required: true }
];
import {
  BUSINESS_TYPES,
  PRODUCT_FIELDS,
  STANDARD_PRODUCT_FIELDS
} from "./config/catalogueOptions.js";

import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { JSONFilePreset } from "lowdb/node";

const app = express();
const PORT = process.env.PORT || 3000;

const db = await JSONFilePreset("db.json", {
  products: [],
  transactions: [],
  businessConfig: null
});

// Add the default configuration only if one does not exist.
// Existing products and transactions are not replaced.
if (!db.data.businessConfig) {
  db.data.businessConfig = {
    businessType: "grocery",
    customBusinessType: "",
    enabledProductFields: ["brand", "packSize"],
    customProductFields: []
  };

  await db.write();
}

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Udyami backend is running"
  });
});

// Retrieve the product catalogue
app.get("/api/products", (req, res) => {
  res.json(db.data.products);
});

// Retrieve the business configuration
app.get("/api/business-config", (req, res) => {
  res.json(db.data.businessConfig);
});

// Return the business types and product fields Udyami supports
app.get("/api/catalogue-options", (req, res) => {
  res.json({
    businessTypes: BUSINESS_TYPES,
    standardProductFields: STANDARD_PRODUCT_FIELDS,
    productFields: PRODUCT_FIELDS
  });
});

const normalizeLabel = (value) =>
  typeof value === "string" ? value.trim() : "";

const isUniqueList = (values) => {
  const normalized = values.map((value) => value.toLowerCase());
  return new Set(normalized).size === normalized.length;
};

// Update the business configuration
app.put("/api/business-config", async (req, res) => {
  const {
    businessType,
    customBusinessType = "",
    enabledProductFields,
    customProductFields = []
  } = req.body ?? {};

  const businessName = normalizeLabel(customBusinessType);

  if (!BUSINESS_TYPES.some((type) => type.id === businessType)) {
    return res.status(400).json({
      error: "Choose a supported business type."
    });
  }

  if (businessType === "other" && !businessName) {
    return res.status(400).json({
      error: "Please enter your business type."
    });
  }

  if (
    !Array.isArray(enabledProductFields) ||
    !enabledProductFields.every((field) => typeof field === "string")
  ) {
    return res.status(400).json({
      error: "enabledProductFields must be a list of field IDs."
    });
  }

  if (
    !Array.isArray(customProductFields) ||
    !customProductFields.every(
      (field) => typeof field === "string" && field.trim().length > 0
    )
  ) {
    return res.status(400).json({
      error: "Custom product fields must be non-empty strings."
    });
  }

  const enabledFields = enabledProductFields.map((field) => field.trim());
  const customFields = customProductFields.map((field) => field.trim());

  const supportedFieldIds = new Set(PRODUCT_FIELDS.map((field) => field.id));

  if (!enabledFields.every((field) => supportedFieldIds.has(field))) {
    return res.status(400).json({
      error: "One or more selected product fields are not supported."
    });
  }

  if (
    new Set(enabledFields).size !== enabledFields.length ||
    !isUniqueList(customFields)
  ) {
    return res.status(400).json({
      error: "Duplicate product fields are not allowed."
    });
  }

  if (customFields.length > 30 || customFields.some((field) => field.length > 50)) {
    return res.status(400).json({
      error: "Use at most 30 custom fields, each up to 50 characters."
    });
  }

  const reservedLabels = new Set([
    "product name",
    "name",
    "unit",
    ...PRODUCT_FIELDS.map((field) => field.label.toLowerCase()),
    ...PRODUCT_FIELDS.map((field) => field.id.toLowerCase())
  ]);

  if (
    customFields.some((field) => reservedLabels.has(field.toLowerCase()))
  ) {
    return res.status(400).json({
      error: "A custom field cannot duplicate a standard or supported field."
    });
  }

  const nextConfig = {
    businessType,
    customBusinessType: businessType === "other" ? businessName : "",
    enabledProductFields: enabledFields,
    customProductFields: customFields
  };

  await db.update((data) => {
    data.businessConfig = nextConfig;
  });

  res.json(nextConfig);
});


app.post("/api/products", async (req, res) => {
  const {
    name,
    unit,
    category = "",
    attributes = {}
  } = req.body ?? {};

  // Required standard fields
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof unit !== "string" ||
    !unit.trim()
  ) {
    return res.status(400).json({
      error: "Product name and unit are required."
    });
  }

  // Attributes must be a plain object
  if (
    attributes === null ||
    typeof attributes !== "object" ||
    Array.isArray(attributes)
  ) {
    return res.status(400).json({
      error: "Product attributes must be an object."
    });
  }

  const config = db.data.businessConfig;

  // Only accept fields enabled for this business
  const allowedFields = [
    ...(config?.enabledProductFields ?? []),
    ...(config?.customProductFields ?? [])
  ];

  const submittedFields = Object.keys(attributes);

  const invalidFields = submittedFields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      error: "One or more attributes are not enabled in Business Setup.",
      invalidFields
    });
  }

  // Validate and clean attribute values
  const cleanAttributes = {};

  for (const [field, value] of Object.entries(attributes)) {
    if (typeof value !== "string") {
      return res.status(400).json({
        error: `The value for "${field}" must be text.`
      });
    }

    const cleanedValue = value.trim();

    if (cleanedValue.length > 100) {
      return res.status(400).json({
        error: `The value for "${field}" must be 100 characters or fewer.`
      });
    }

    if (cleanedValue) {
      cleanAttributes[field] = cleanedValue;
    }
  }

  const cleanName = name.trim();
  const cleanUnit = unit.trim();

  const normalize = (value) =>
    String(value ?? "").trim().toLowerCase();

  // Compare configured attributes, not the product name alone.
  const duplicate = db.data.products.find((existing) => {
    if (
      normalize(existing.name) !== normalize(cleanName) ||
      normalize(existing.unit) !== normalize(cleanUnit)
    ) {
      return false;
    }

    return allowedFields.every(
      (field) =>
        normalize(existing.attributes?.[field]) ===
        normalize(cleanAttributes[field])
    );
  });

  if (duplicate) {
    return res.status(409).json({
      error:
        "A product with the same name, unit, and configured attributes already exists.",
      duplicateProductId: duplicate.id
    });
  }

  const product = {
    id: randomUUID(),
    name: cleanName,
    unit: cleanUnit,
    category:
      typeof category === "string" ? category.trim() : "",
    attributes: cleanAttributes,
    active: true,
    createdAt: new Date().toISOString()
  };

  await db.update(({ products }) => {
    products.push(product);
  });

  return res.status(201).json(product);
});


app.listen(PORT, () => {
  console.log(`Udyami backend running at http://localhost:${PORT}`);
});

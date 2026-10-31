
import {
  BUSINESS_TYPES,
  PRODUCT_FIELDS,
  STANDARD_PRODUCT_FIELDS
} from "./config/catalogueOptions.js";

import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID, timingSafeEqual } from "node:crypto";
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

// Verify API key for protected endpoints

const requireApiKey = (req, res, next) => {
  console.log("API REQUEST:", req.method, req.originalUrl);
  console.log(
    "API KEY PRESENT:",
    Boolean(req.get("x-api-key"))
  );

  const expectedKey = process.env.UDYAMI_API_KEY;
  const providedKey = req.get("x-api-key");

  // Ensure the server has an API key configured
  if (!expectedKey) {
    return res.status(500).json({
      error: "Server authentication is not configured."
    });
  }

  // Reject requests without an API key
  if (typeof providedKey !== "string") {
    return res.status(401).json({
      error: "Unauthorized: API key is missing or invalid."
    });
  }

  const expectedBuffer = Buffer.from(expectedKey, "utf8");
  const providedBuffer = Buffer.from(providedKey, "utf8");

  // Compare keys safely
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return res.status(401).json({
      error: "Unauthorized: API key is missing or invalid."
    });
  }

  next();
};

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Udyami backend is running"
  });
});

// Retrieve the product catalogue
app.get("/api/products", requireApiKey, (req, res) => {
  res.json(db.data.products);
});

// Retrieve the business configuration
app.get("/api/business-config", requireApiKey, (req, res) => {
  res.json(db.data.businessConfig);
});

// Retrieve supported business types and product fields
app.get("/api/catalogue-options", requireApiKey, (req, res) => {
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
app.put("/api/business-config",requireApiKey, async (req, res) => {
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


app.post("/api/products",requireApiKey, async (req, res) => {
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


// Add stock to an existing product
app.post("/api/stock/add", requireApiKey, async (req, res) => {
  console.log("ADD STOCK REQUEST:", JSON.stringify(req.body, null, 2));
  const { productId, quantity, confirmed } = req.body ?? {};

  // Require explicit confirmation from the voice interaction
  const isConfirmed =
    confirmed === true ||
    (typeof confirmed === "string" &&
      confirmed.trim().toLowerCase() === "true");

  if (!isConfirmed) {
    return res.status(400).json({
      error: "Stock update requires user confirmation."
    });
  }

  if (typeof productId !== "string" || !productId.trim()) {
    return res.status(400).json({
      error: "A valid product ID is required."
    });
  }

  const amount = Number(quantity);

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({
      error: "Quantity must be a positive number."
    });
  }

  const product = db.data.products.find(
    (item) => item.id === productId
  );

  if (!product || product.active === false) {
    return res.status(404).json({
      error: "Product not found or inactive."
    });
  }

  let result;

  await db.update((data) => {
    const currentProduct = data.products.find(
      (item) => item.id === productId
    );

    if (!currentProduct || currentProduct.active === false) {
      return;
    }

    const currentStock = Number(currentProduct.stock ?? 0);

    if (!Number.isFinite(currentStock) || currentStock < 0) {
      return;
    }

    currentProduct.stock = currentStock + amount;

    const transaction = {
      id: randomUUID(),
      type: "stock_add",
      productId: currentProduct.id,
      productName: currentProduct.name,
      quantity: amount,
      unit: currentProduct.unit,
      stockAfter: currentProduct.stock,
      createdAt: new Date().toISOString()
    };

    data.transactions.push(transaction);

    result = {
      product: currentProduct,
      transaction
    };
  });

  if (!result) {
    return res.status(400).json({
      error: "Stock could not be updated. Please check the product's current stock."
    });
  }

  return res.status(200).json({
    success: true,
    message: "Stock updated successfully.",
    product: result.product,
    transaction: result.transaction
  });
});

app.post("/api/bolna-session", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.bolna.ai/web-call/freeswitch-session",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: process.env.BOLNA_AGENT_ID,
        }),
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Bolna session error:", error);
    res.status(500).json({ error: "Could not create voice session." });
  }
});

app.listen(PORT, () => {
  console.log(`Udyami backend running at http://localhost:${PORT}`);
});

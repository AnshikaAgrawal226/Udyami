import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:3000/api";
const PRODUCTS_URL = `${API_BASE}/products`;
const CONFIG_URL = `${API_BASE}/business-config`;
const OPTIONS_URL = `${API_BASE}/catalogue-options`;

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Business configuration
  const [businessTypes, setBusinessTypes] = useState([]);
  const [productFields, setProductFields] = useState([]);
  const [businessType, setBusinessType] = useState("grocery");
  const [customBusinessType, setCustomBusinessType] = useState("");
  const [enabledProductFields, setEnabledProductFields] = useState([
    "brand",
    "packSize",
  ]);
  const [customProductFields, setCustomProductFields] = useState([]);
  const [newCustomField, setNewCustomField] = useState("");

  const [screen, setScreen] = useState("catalogue");

  // Product form
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");

  const [productAttributes, setProductAttributes] = useState({});

  useEffect(() => {
    async function loadInitialData() {
      try {
        setError("");

        const [productsResponse, optionsResponse, configResponse] =
          await Promise.all([
            fetch(PRODUCTS_URL),
            fetch(OPTIONS_URL),
            fetch(CONFIG_URL),
          ]);

        if (!productsResponse.ok || !optionsResponse.ok || !configResponse.ok) {
          throw new Error("Could not load Udyami data.");
        }

        const [productsData, optionsData, configData] = await Promise.all([
          productsResponse.json(),
          optionsResponse.json(),
          configResponse.json(),
        ]);

        setProducts(productsData);
        setBusinessTypes(optionsData.businessTypes || []);
        setProductFields(optionsData.productFields || []);

        setBusinessType(configData.businessType || "grocery");
        setCustomBusinessType(configData.customBusinessType || "");
        setEnabledProductFields(
          configData.enabledProductFields || ["brand", "packSize"]
        );
        setCustomProductFields(configData.customProductFields || []);
      } catch (err) {
        setError(
          err.message ||
            "Cannot connect to Udyami's backend. Check that it is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  async function loadProducts() {
    const response = await fetch(PRODUCTS_URL);

    if (!response.ok) {
      throw new Error("Could not load products.");
    }

    const data = await response.json();
    setProducts(data);
  }

  function toggleProductField(fieldId) {
    setEnabledProductFields((current) =>
      current.includes(fieldId)
        ? current.filter((id) => id !== fieldId)
        : [...current, fieldId]
    );
  }

  function addCustomField(event) {
    event.preventDefault();

    const fieldName = newCustomField.trim();

    if (!fieldName) {
      return;
    }

    const alreadyExists = [
      ...productFields.map((field) => field.label),
      ...customProductFields,
      "Product name",
      "Unit",
    ].some((existing) => existing.toLowerCase() === fieldName.toLowerCase());

    if (alreadyExists) {
      setError("That field already exists. Please choose another name.");
      return;
    }

    setCustomProductFields((current) => [...current, fieldName]);
    setNewCustomField("");
    setError("");
    setMessage("");
  }

  function removeCustomField(fieldName) {
    setCustomProductFields((current) =>
      current.filter((field) => field !== fieldName)
    );
  }

  async function saveBusinessConfig(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (businessType === "other" && !customBusinessType.trim()) {
      setError("Please enter your business type.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(CONFIG_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessType,
          customBusinessType: customBusinessType.trim(),
          enabledProductFields,
          customProductFields,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save business configuration.");
      }

      setBusinessType(data.businessType);
      setCustomBusinessType(data.customBusinessType || "");
      setEnabledProductFields(data.enabledProductFields || []);
      setCustomProductFields(data.customProductFields || []);
      setMessage("Business configuration saved successfully.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim() || !unit.trim()) {
      setError("Please enter a product name and unit.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(PRODUCTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          unit: unit.trim(),
          category: category.trim(),
          attributes: productAttributes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not add product.");
      }

      setProducts((current) => [...current, data]);
      setName("");
      setCategory("");
      setUnit("");
      setProductAttributes({});
      setMessage(`${data.name} added successfully.`);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const selectedBusinessLabel =
    businessType === "other"
      ? customBusinessType || "Other business"
      : businessTypes.find((type) => type.id === businessType)?.label ||
        businessType;

  if (loading) {
    return (
      <main className="app">
        <p className="empty">Loading Udyami...</p>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand-mark">U</div>
        <div>
          <h1>Udyami</h1>
          <p className="subtitle">Your business, simply managed.</p>
        </div>
      </header>

      <nav className="screen-nav" aria-label="Main navigation">
        <button
          type="button"
          className={screen === "catalogue" ? "nav-button selected" : "nav-button"}
          onClick={() => {
            setScreen("catalogue");
            setError("");
            setMessage("");
          }}
        >
          Product catalogue
        </button>

        <button
          type="button"
          className={screen === "setup" ? "nav-button selected" : "nav-button"}
          onClick={() => {
            setScreen("setup");
            setError("");
            setMessage("");
          }}
        >
          Business setup
        </button>
      </nav>

      {screen === "setup" ? (
        <>
          <section className="intro">
            <p className="eyebrow">PERSONALIZE UDYAMI</p>
            <h2>Business setup</h2>
            <p>
              Choose your business type and the product details you want to
              maintain. You can change these settings later.
            </p>
          </section>

          <section className="panel">
            <form onSubmit={saveBusinessConfig}>
              <label htmlFor="business-type">Business type *</label>
              <select
                id="business-type"
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
                required
              >
                {businessTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>

              {businessType === "other" && (
                <div className="field-spacer">
                  <label htmlFor="custom-business-type">
                    Enter your business type *
                  </label>
                  <input
                    id="custom-business-type"
                    value={customBusinessType}
                    onChange={(event) =>
                      setCustomBusinessType(event.target.value)
                    }
                    placeholder="e.g. Pharmacy or stationery shop"
                    required
                  />
                </div>
              )}

              <h3 className="field-heading">Product fields to maintain</h3>
              <p className="helper-text">
                Product name and unit are standard fields for every business.
              </p>

              <div className="standard-fields">
                <span>Product name · Required</span>
                <span>Unit · Required</span>
              </div>

              <div className="field-options">
                {productFields.map((field) => (
                  <label className="field-option" key={field.id}>
                    <input
                      type="checkbox"
                      checked={enabledProductFields.includes(field.id)}
                      onChange={() => toggleProductField(field.id)}
                    />
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>

              <h3 className="field-heading">Custom product fields</h3>
              <p className="helper-text">
                Add details specific to your business, such as material,
                supplier code, or shelf location.
              </p>

              <div className="custom-field-entry">
                <input
                  value={newCustomField}
                  onChange={(event) => setNewCustomField(event.target.value)}
                  placeholder="e.g. Material"
                  aria-label="New custom product field"
                  maxLength={50}
                />
                <button type="button" onClick={addCustomField}>
                  Add field
                </button>
              </div>

              {customProductFields.length > 0 && (
                <div className="custom-field-list">
                  {customProductFields.map((field) => (
                    <div className="custom-field-chip" key={field}>
                      <span>{field}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomField(field)}
                        aria-label={`Remove ${field}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="field-heading">Configuration preview</h3>
              <div className="config-preview">
                <p>
                  <strong>Business type:</strong> {selectedBusinessLabel}
                </p>
                <p>Product name</p>
                <p>Unit</p>

                {productFields
                  .filter((field) =>
                    enabledProductFields.includes(field.id)
                  )
                  .map((field) => (
                    <p key={field.id}>{field.label}</p>
                  ))}

                {customProductFields.map((field) => (
                  <p key={field}>{field}</p>
                ))}
              </div>

              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save business configuration"}
              </button>
            </form>

            {message && (
              <p className="success" role="status">
                {message}
              </p>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setScreen("catalogue");
                setError("");
                setMessage("");
              }}
            >
              Go to product catalogue
            </button>
          </section>
        </>
      ) : (
        <>
          <section className="intro">
            <p className="eyebrow">BUSINESS MANAGEMENT</p>
            <h2>Your product catalogue</h2>
            <p>
              Manage your products and prepare your catalogue for everyday
              stock and sales operations.
            </p>
            <p className="helper-text">
              Business type: <strong>{selectedBusinessLabel}</strong>
            </p>
          </section>

          <section className="panel">
            <h3>Add a product</h3>

            <form onSubmit={handleSubmit}>
              <label htmlFor="product-name">Product name *</label>
              <input
                id="product-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Maggi"
                required
              />

              <div className="form-row">
                <div>
                  <label htmlFor="product-unit">Unit *</label>
                  <input
                    id="product-unit"
                    value={unit}
                    onChange={(event) => setUnit(event.target.value)}
                    placeholder="e.g. packet"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="product-category">Category</label>
                  <input
                    id="product-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="e.g. Snacks"
                  />
                </div>
              </div>
              {/* Optional fields enabled in Business Setup */}
              {productFields
              .filter((field) => enabledProductFields.includes(field.id))
              .map((field) => (
                <div key={field.id}>
                  <label htmlFor={`attribute-${field.id}`}>
                    {field.label}
                  </label>
                  <input
                    id={`attribute-${field.id}`}
                    type={field.type === "date" ? "date" : "text"}
                    value={productAttributes[field.id] ?? ""}
                    onChange={(event) =>
                      setProductAttributes((current) => ({
                        ...current,
                        [field.id]: event.target.value,
                      }))
                    }
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              ))}

              {/* Custom fields added in Business Setup */}
              {customProductFields.map((field) => (
                <div key={field}>
                  <label htmlFor={`custom-attribute-${field}`}>
                    {field}
                  </label>
                  <input
                    id={`custom-attribute-${field}`}
                    type="text"
                    value={productAttributes[field] ?? ""}
                    onChange={(event) =>
                      setProductAttributes((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    placeholder={`Enter ${field.toLowerCase()}`}
                  />
                </div>
              ))}


              <button type="submit" disabled={saving}>
                {saving ? "Adding..." : "+ Add product"}
              </button>
            </form>

            {message && (
              <p className="success" role="status">
                {message}
              </p>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </section>

          <section className="catalogue">
            <div className="catalogue-heading">
              <h3>Products</h3>
              <span className="count">{products.length}</span>
            </div>

            {products.length === 0 ? (
              <p className="empty">
                No products yet. Add your first product above.
              </p>
            ) : (
              <div className="product-list">
                {products.map((product) => (
                  <article className="product-card" key={product.id}>
                    <div className="product-icon">
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="product-info">
                      <strong>{product.name}</strong>
                      <p>
                        {product.category || "Uncategorized"} · Unit: {product.unit}
                      </p>

                      {Object.entries(product.attributes ?? {}).map(([key, value]) => {
                        const supportedField = productFields.find(
                          (field) => field.id === key
                        );

                        const label = supportedField?.label ?? key;

                        return (
                          <p key={key}>
                            {label}: {value}
                          </p>
                        );
                      })}
                    </div>
                    <span className="active-label">
                      {product.active ? "Active" : "Inactive"}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <footer>Udyami · Simple tools for everyday business</footer>
    </main>
  );
}

export default App;
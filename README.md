# Udyami

### Voice-Enabled Business Platform

Udyami is a configurable business management platform designed to help small retailers manage their product catalogue and business operations through a simple, accessible interface.

The long-term vision is to let shopkeepers use natural voice commands in Hindi, English, and Hinglish to manage everyday business activities, with the system interpreting commands, presenting the proposed action for confirmation, and validating transactions before saving them.

## The Problem

Small retailers often manage product information and daily operations manually or across disconnected tools. This can make it difficult to maintain an organised catalogue, track business information, and manage operations efficiently.

## Our Solution

Udyami aims to bring essential business operations into one configurable platform.

The current prototype focuses on:

- Business-specific setup and configuration.
- A dynamic product catalogue.
- Configurable product attributes.
- Product creation and storage.
- A foundation for future voice-driven business operations.

## Current Features

- **Business configuration:** Select a business category such as grocery, clothing, or electronics, or specify another business type.
- **Dynamic product fields:** Enable relevant product attributes such as brand, size, colour, pack size, flavour, and model.
- **Custom attributes:** Add business-specific product fields.
- **Product catalogue:** Create and display products with their configured attributes.
- **Duplicate validation:** Distinguish products using their configured attributes rather than relying on product names alone.
- **Persistent storage:** Store business configuration and product data using a local JSON database.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express.js |
| Database | Lowdb |
| Communication | REST API |

## Project Structure

```text
voice-business-assistant/
├── backend/
│   ├── config/
│   │   └── catalogueOptions.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm

### 1. Clone the repository

```bash
git clone https://github.com/AnshikaAgrawal226/Udyami
cd voice-business-assistant
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the repository's actual clone URL.

### 2. Start the backend

Open a terminal:

```bash
cd backend
npm install
npm run dev
```

The backend runs at:

```text
http://localhost:3000
```

### 3. Start the frontend

Open another terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## Project Vision and Future Scope

The next development phases aim to introduce:

- Voice-based interaction using Bolna.
- Hindi, English, and Hinglish command support.
- Natural-language interpretation of business instructions.
- Confirmation and correction before important operations.
- Backend validation before committing transactions.
- Inventory, sales, purchases, and customer credit management.
- Supplier discrepancy resolution and reorder assistance.

## Development Philosophy

Udyami is being designed around three principles:

1. **Configurability:** Every business should be able to define its own catalogue and relevant product attributes.
2. **Accessibility:** Business operations should become easier through natural-language and voice-based interaction.
3. **Reliability:** Important business changes should be validated and confirmed before they are committed.

---

**Udyami — Simplifying everyday business operations.**
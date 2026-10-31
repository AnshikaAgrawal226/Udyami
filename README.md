# Udyami — Voice-Enabled Business Platform

**Udyami helps small retailers manage their product catalogue and stock operations through a simple web interface and voice commands.**

Shopkeepers can interact with Udyami using Hindi, English, or Hinglish. The platform connects a voice agent to backend operations so supported actions can be validated before being saved.

## The Problem

Small retailers often maintain product information and stock records manually or across disconnected tools. This makes routine operations time-consuming and increases the possibility of inconsistent records.

## Our Solution

Udyami brings product catalogue management and voice-driven stock operations into one configurable platform.

A shopkeeper can use the web interface to manage products or start a voice session with the Udyami agent.

### How the Voice Workflow Works

1. The shopkeeper starts a voice session.
2. They give an instruction in Hindi, English, or Hinglish.
3. The voice agent identifies the requested operation and relevant product.
4. The agent asks for clarification or confirmation when required.
5. The backend validates the request and processes the supported operation.
6. The agent communicates the result returned by the backend.

## Implemented Features

- **Business configuration:** Choose a business category or specify another business type.
- **Dynamic product fields:** Configure relevant product attributes such as brand and pack size.
- **Custom attributes:** Add business-specific product fields.
- **Product catalogue:** Add and view products with their configured attributes.
- **Product identification:** Use configured attributes to distinguish products with similar names.
- **Voice interface:** Start and end an in-app voice session connected to the Udyami Bolna agent.
- **Voice-driven stock addition:** Process supported stock additions through the voice workflow, subject to confirmation and backend validation.
- **Persistent storage:** Store business configuration, product information, and stock transaction records using Lowdb.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express.js |
| Database | Lowdb |
| Voice integration | Bolna Web Call SDK |
| Communication | REST API |

## Project Structure

```text
Udyami/
├── backend/
│   ├── config/
│   │   └── catalogueOptions.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- A Bolna account and configured Udyami voice agent for voice functionality

### 1. Clone the Repository

```bash
git clone https://github.com/AnshikaAgrawal226/Udyami.git
cd Udyami
```

### 2. Configure Backend Environment Variables

Create a `.env` file inside the `backend` directory:

```env
UDYAMI_API_KEY=your_udyami_api_key
BOLNA_API_KEY=your_bolna_api_key
BOLNA_AGENT_ID=your_bolna_agent_id
```

Replace the example values with your own credentials. Never commit the `.env` file or expose API keys in frontend code.

### 3. Start the Backend

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

Check its health at:

```text
http://localhost:3000/api/health
```

### 4. Start the Frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

Allow microphone access when prompted to use the voice interface.

## Future Scope

Planned development areas include:

- Voice-driven sales and purchase recording.
- Customer credit and ledger management.
- Supplier discrepancy resolution.
- Reorder assistance and inventory insights.
- Support for additional Indian languages.
- Expansion to more small-business categories.

These are planned extensions and are not represented as completed features in the current prototype.

## Development Principles

1. **Configurability:** Businesses should be able to maintain product fields relevant to their operations.
2. **Accessibility:** Voice interaction should make routine business operations easier.
3. **Reliability:** Important business changes should be validated, with confirmation where required.

---

**Udyami — Simplifying everyday business operations.**

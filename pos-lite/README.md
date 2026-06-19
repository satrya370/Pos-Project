# PosLite

**Lightweight POS System with AI Insights for Small Businesses**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-yellow.svg)

---

## Features

- **Product Management** - CRUD with variants (S/M/L/XL)
- **Stock Tracking** - Real-time inventory updates
- **Simple POS** - Quick checkout interface
- **Transaction Recording** - Complete sales history
- **Sales Reports** - Daily/Weekly/Monthly analytics
- **AI Insights** - Automated analysis via OpenAI
- **WhatsApp Notifications** - Daily summaries via Bailey
- **Telegram Bot** - Alert notifications
- **Excel Import** - Bulk product import

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | Zustand + React Query |
| Backend | Express.js + TypeScript |
| ORM | Prisma |
| Database | SQLite (dev) / PostgreSQL (prod) |
| AI | OpenAI GPT-3.5-turbo |

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd pos-lite

# Install all dependencies
npm run install:all

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Generate Prisma client & push database
npm run db:generate
npm run db:push

# Start development servers
npm run dev
```

### Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

---

## Project Structure

```
pos-lite/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API services
│   │   ├── stores/           # Zustand stores
│   │   └── utils/            # Utilities
│   ├── package.json
│   └── vite.config.ts
│
├── server/                    # Express Backend
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── jobs/             # Cron jobs
│   │   └── middleware/       # Auth, validation
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
│
├── docs/                      # Documentation
│   ├── SPEC.md               # System specification
│   ├── DEPENDENCIES.md        # Dependencies documentation
│   └── AI_ARCHITECTURE_REFERENCE.md
│
├── package.json               # Root package (workspaces)
├── .env.example               # Environment template
└── README.md
```

---

## Available Scripts

### Root (Workspace)

```bash
npm run dev              # Start both client & server
npm run dev:client       # Start frontend only
npm run dev:server       # Start backend only
npm run build            # Build both client & server
npm run install:all      # Install all dependencies
```

### Client

```bash
cd client
npm run dev              # Start Vite dev server
npm run build            # Production build
npm run lint             # ESLint check
```

### Server

```bash
cd server
npm run dev              # Start with hot reload (tsx)
npm run build            # Compile TypeScript
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run lint             # ESLint check
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-secret-key"

# OpenAI
OPENAI_API_KEY="sk-xxxxx"

# WhatsApp (Bailey)
BAILE_WA_API_KEY="your-key"

# Telegram
TELEGRAM_BOT_TOKEN="your-token"
TELEGRAM_OWNER_CHAT_ID="your-chat-id"
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register owner
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/restock` - Restock
- `POST /api/products/import` - Import from Excel
- `GET /api/products/low-stock` - Low stock alerts

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create (checkout)
- `PUT /api/transactions/:id/void` - Void

### Reports
- `GET /api/reports/daily` - Daily report
- `GET /api/reports/weekly` - Weekly report
- `GET /api/reports/monthly` - Monthly report
- `GET /api/reports/top-products` - Top sellers

### AI
- `GET /api/ai/insights/daily` - Get daily insight
- `GET /api/ai/insights/weekly` - Get weekly insight
- `POST /api/ai/test-notification` - Test notifications

---

## AI Features

### What It Does

1. **Daily Summary** - Automatic WhatsApp summary at 21:00 WIB
2. **Weekly Report** - Deep-dive analysis on Sundays
3. **Low Stock Alerts** - Real-time notifications when stock is low
4. **Trend Analysis** - Week-over-week comparison
5. **Bundling Recommendations** - Products frequently bought together

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    AI PIPELINE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Scheduler (node-cron) triggers at scheduled time         │
│  2. Fetch data from SQLite (daily sales, inventory)          │
│  3. Inject data into structured prompt                      │
│  4. Send to OpenAI GPT-3.5-turbo                           │
│  5. Cache result in AIInsightCache table (TTL: 23h/6d)     │
│  6. Send via WhatsApp/Telegram if enabled                  │
│                                                              │
│  Cost: ~$0.30/month (within $1 budget)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [SPEC.md](docs/SPEC.md) | Full system specification |
| [DEPENDENCIES.md](docs/DEPENDENCIES.md) | Dependencies documentation |
| [AI_ARCHITECTURE_REFERENCE.md](docs/AI_ARCHITECTURE_REFERENCE.md) | AI architecture reference |

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

**Built with care for small business owners in Indonesia 🇮🇩**
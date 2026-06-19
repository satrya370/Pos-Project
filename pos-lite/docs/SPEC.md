# POS System - SPEC.md
# Spec-Driven Development Document

**Project Name:** PosLite  
**Version:** 1.0.0  
**Date:** 2026-06-09  
**Status:** Draft  
**Deadline:** End of June 2026  

---

## 1. Overview

### 1.1 Project Summary

| Field | Value |
|-------|-------|
| **Project Name** | PosLite |
| **Type** | POS (Point of Sale) System - Lightweight Version |
| **Target Market** | Small business owners (Fashion & General Retail) selling via social media |
| **Business Scale** | < Rp 30 million/month, < 50 SKU, Single location (Online) |
| **Primary Purpose** | Simple sales recording, inventory management, and AI-powered insights for small merchants |
| **Delivery Date** | End of June 2026 |

### 1.2 Goals

1. **Primary Goal**  
   Provide a simple, affordable POS system that helps small merchants track sales and inventory without complex payment integrations.

2. **Secondary Goals**  
   - Reduce manual tracking using Excel/Sheets  
   - Provide AI-powered daily/weekly insights via WhatsApp and Telegram  
   - Generate actionable recommendations for inventory and bundling  

3. **Out of Scope (This Version)**  
   - Payment gateway integration  
   - Thermal printer support  
   - Member/loyalty system  
   - Mobile native app (responsive web only)  
   - Offline capability  

---

## 2. Technical Stack

### 2.1 Technology Choices

| Layer | Technology |
|-------|------------|
| **Frontend** | React + TypeScript |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand / React Query |
| **Charts** | Recharts |
| **Backend** | Express.js + TypeScript |
| **ORM** | Prisma |
| **Database** | SQLite (local) / PostgreSQL (production) |
| **Job Scheduler** | node-cron |
| **AI Service** | Multi-Provider (Groq, KoBoLLm, OpenRouter) |

### 2.2 AI Provider Stack

| Provider | Model | Cost | Role |
|----------|-------|------|------|
| **Groq** | Llama 3.1 8B / 70B | FREE | Output formatting, notifications |
| **KoBoLLm** | GPT OSS 120B | $0.09/1M | Deep analysis, recommendations |
| **OpenRouter** | gpt-4o-mini | $0.15/1M | Fallback provider |

### 2.3 Project Structure

```
pos-lite/
|-- client/                     # React Frontend
|-- server/                     # Express Backend
|   |-- src/
|       |-- services/
|           |-- ai/           # AI Multi-Agent System
|               |-- agents/   # Analysis, Output, Notification agents
|               |-- providers/ # Groq, KoBoLLm, OpenRouter
|               |-- pipelines/ # Task pipelines
|               |-- cache/    # Response caching
|               |-- router.ts # Agent router
|-- docs/                       # Documentation
```

---

## 3. Database Schema

### 3.1 Models Overview

**Entities:**
- Owner - User/Administrator
- Product - Items for sale with variants support
- Category - Product categorization
- Supplier - Product suppliers
- Transaction - Sales records
- TransactionItem - Individual items in a transaction
- StockMovement - Stock change history
- AIInsightCache - Cached AI-generated insights

### 3.2 Key Relationships

- Owner has many Products, Transactions, Suppliers
- Category has many Products
- Transaction has many TransactionItems
- StockMovement belongs to Product

---

## 4. Functionality Specification

### 4.1 MoSCoW Prioritization

#### MUST HAVE (MVP)
| # | Feature | Description |
|---|---------|-------------|
| M1 | Product Management | CRUD produk dengan variasi (size S/M/L/XL), nama, harga modal, harga jual, stok |
| M2 | Stock Tracking | Real-time stock update saat transaksi, tidak boleh minus |
| M3 | Simple POS/Cashier | Tambah produk ke keranjang, hitung total, catat transaksi |
| M4 | Transaction Recording | Simpan semua transaksi dengan invoice number |
| M5 | Basic Dashboard | Tampilkan total penjualan hari ini, minggu ini, bulan ini |
| M6 | Product Import | Import produk dari Excel/Google Sheets |
| M7 | Category Management | Organize produk ke dalam kategori |
| M8 | Supplier Management | Manage data supplier |

#### SHOULD HAVE
| # | Feature | Description |
|---|---------|-------------|
| S1 | Low Stock Alert | Real-time notification saat stok < threshold |
| S2 | Sales Report | Daily/weekly/monthly sales dengan perbandingan periode |
| S3 | Top/Bottom Products | Produk terbaik dan terburuk berdasarkan penjualan |
| S4 | Profit Calculation | Auto-calculate profit dari setiap transaksi |
| S5 | Daily WhatsApp Summary | Kirim ringkasan penjualan harian via WhatsApp |
| S6 | Weekly Dashboard Report | Report mingguan yang lebih mendalam di dashboard |

#### COULD HAVE
| # | Feature | Description |
|---|---------|-------------|
| C1 | Product Recommendation | AI rekomendasikan produk berdasarkan purchase history |
| C2 | Bundling Suggestion | AI rekomendasikan produk yang sering dibeli bersamaan |
| C3 | Trend Analysis | AI deteksi tren penjualan |
| C4 | Anomaly Detection | AI deteksi penjualan anomali |
| C5 | Restock Forecast | AI prediksi kapan stok akan habis |
| C6 | Telegram Bot | Channel notifikasi tambahan via Telegram |

#### WONT HAVE (This Version)
| # | Feature | Reason |
|---|---------|--------|
| W1 | Payment Integration | Out of scope - hanya pencatatan |
| W2 | Thermal Printer | Out of scope |
| W3 | Member/Loyalty System | Out of scope |
| W4 | Offline Mode | Selalu online acceptable |
| W5 | Mobile Native App | Responsive web cukup |

---

## 5. AI & Notification System

### 5.1 Multi-Agent Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-AGENT PIPELINE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   TASK REQUEST                                                              │
│        │                                                                    │
│        ▼                                                                    │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                    ROUTER AGENT                                    │    │
│   │   • Analyze task complexity                                        │    │
│   │   • Determine required pipeline                                   │    │
│   │   • Route to appropriate agents                                   │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│        │                                                                    │
│        ├──────────────────────────────────────────────────────────────┐     │
│        │                                                               │     │
│        ▼                                                               ▼     │
│   ┌───────────────────────┐                               ┌───────────────────────┐
│   │  SIMPLE TASK         │                               │  COMPLEX TASK        │
│   │  (Alerts, Summary)  │                               │  (Reports, Analysis) │
│   └───────────┬───────────┘                               └───────────┬───────────┘
│               │                                                       │
│               ▼                                                       ▼
│   ┌───────────────────────┐                               ┌───────────────────────┐
│   │  OUTPUT AGENT        │                               │  ANALYSIS AGENT       │
│   │  (Groq - Llama 8B)  │                               │  (KoBoLLm - GPT OSS) │
│   │                       │                               │                       │
│   │  • Format output     │                               │  • Deep analysis      │
│   │  • Add emojis        │                               │  • Pattern detection  │
│   │  • Structure text    │                               │  • Reasoning          │
│   └───────────┬───────────┘                               │  • Recommendations    │
│               │                                           └───────────┬───────────┘
│               │                                                       │
│               └──────────────────────┬──────────────────────────────┘
│                                      │
│                                      ▼
│                            ┌───────────────────────┐
│                            │  OUTPUT AGENT          │
│                            │  (Groq - Llama 70B)   │
│                            │                        │
│                            │  • Format analysis    │
│                            │  • Add structure      │
│                            └───────────┬───────────┘
│                                        │
│                                        ▼
│                            ┌───────────────────────┐
│                            │  NOTIFICATION AGENT   │
│                            │  (Groq - Llama 8B)    │
│                            │                        │
│                            │  • Format WA message  │
│                            │  • Format Telegram    │
│                            └───────────────────────┘
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Agent Specifications

#### 5.2.1 Analysis Agent (High Complexity)

| Property | Value |
|----------|-------|
| **Provider** | KoBoLLm (LiteLLM) |
| **Model** | GPT OSS 120B |
| **Max Tokens** | 8000 (input: 6000, output: 2000) |
| **Temperature** | 0.5 |
| **Cost** | $0.09/1M tokens |

**Responsibilities:**
- Deep analysis of sales data
- Pattern identification and trend detection
- Anomaly detection
- Stock forecasting
- Product recommendation generation
- Bundling opportunity analysis

**System Prompt:**
```
You are an expert business analyst specializing in small retail stores 
selling fashion and general merchandise.

Your role:
- Analyze sales data and identify patterns
- Detect trends, anomalies, and opportunities
- Provide actionable recommendations
- Forecast future performance

Analysis Framework:
1. DATA EXAMINATION
   - Review all provided metrics and numbers
   - Calculate key ratios (conversion, AOV, margin)

2. PATTERN IDENTIFICATION
   - Week-over-week trends
   - Product performance ranking
   - Customer behavior patterns

3. INSIGHT GENERATION
   - What patterns do you see?
   - Why are these patterns occurring?
   - What do they mean for the business?

4. RECOMMENDATIONS
   - Immediate actions (restock, promotions)
   - Medium-term strategies (bundling, pricing)
   - Long-term planning (inventory, sourcing)

5. FORECASTING
   - Stock depletion timeline
   - Sales projections
   - Resource needs

Always:
- Think step by step
- Support insights with data
- Provide specific, actionable recommendations
- Consider inventory constraints
- Factor in seasonal patterns
```

#### 5.2.2 Output Agent (Medium Complexity)

| Property | Value |
|----------|-------|
| **Provider** | Groq |
| **Model** | Llama 3.3 70B (complex) / Llama 3.1 8B (simple) |
| **Max Tokens** | 4000 (complex) / 2800 (simple) |
| **Temperature** | 0.4 |
| **Cost** | FREE |

**Responsibilities:**
- Format analysis results into clear structure
- Add visual markers (emojis)
- Ensure Indonesian language is natural
- Create scannable output

**System Prompt:**
```
You are an expert at formatting business reports and presentations.

Your role:
- Transform analysis results into clear, scannable output
- Structure information with proper hierarchy
- Add visual markers (emojis) for quick scanning
- Ensure Indonesian language is natural and professional

Formatting Rules:
1. USE EMOJIS SPARINGLY
   - 📊 for metrics/data
   - 📈 for positive trends
   - 📉 for negative trends
   - ⚠️ for alerts/warnings
   - 💡 for insights/recommendations
   - 🏆 for top performers
   - 📦 for inventory
   - 💰 for money/financial

2. STRUCTURE
   - Clear section headers
   - Bullet points for lists
   - Tables for comparisons
   - White space for readability

3. LOCALIZATION
   - Use proper Indonesian formatting
   - Currency: Rp X.XXX.XXX (dot for thousands)
   - Dates: DD MMMM YYYY
   - Numbers: Indonesian locale
```

#### 5.2.3 Notification Agent (Low Complexity)

| Property | Value |
|----------|-------|
| **Provider** | Groq |
| **Model** | Llama 3.1 8B |
| **Max Tokens** | 2000 (input: 1500, output: 500) |
| **Temperature** | 0.3 |
| **Cost** | FREE |

**Responsibilities:**
- Format WhatsApp/Telegram messages
- Create concise, scannable notifications
- Ensure mobile-friendly formatting

**System Prompt:**
```
You are a notification formatter for WhatsApp and Telegram messages.

Format:
1. HEADER
   - Type of notification
   - Date/time

2. KEY METRICS
   - Most important numbers only
   - Use abbreviations if needed

3. HIGHLIGHTS
   - Top performers or issues
   - Critical alerts

4. CALL TO ACTION
   - What should the owner do?
   - Be specific and actionable

Rules:
- Maximum 4096 characters
- Use emojis to highlight key points
- Prefer short sentences
- No tables (hard to read on mobile)
- Bullet points with minimal text
```

### 5.3 Task Pipelines

#### 5.3.1 Daily Summary Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  DAILY SUMMARY (Simple Task)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Data Aggregation (Server)                             │
│          - Fetch today and yesterday transactions              │
│          - Calculate totals, profit, items                     │
│                                                                  │
│  Step 2: OUTPUT AGENT (Groq Llama 8B - FREE)                   │
│          - Max Tokens: 3000                                     │
│          - Format daily summary                                 │
│                                                                  │
│  Step 3: NOTIFICATION AGENT (Groq Llama 8B - FREE)             │
│          - Max Tokens: 2000                                     │
│          - Format WhatsApp/Telegram message                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.3.2 Weekly Report Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  WEEKLY REPORT (Complex Task)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Data Aggregation (Server)                             │
│          - Fetch 7 days data                                    │
│          - Week-over-week comparison                            │
│          - Product performance metrics                          │
│                                                                  │
│  Step 2: ANALYSIS AGENT (KoBoLLm GPT OSS 120B - $0.09/1M)     │
│          - Max Tokens: 8000                                     │
│          - Deep analysis and insights                          │
│          - Trend detection                                      │
│          - Recommendations                                      │
│                                                                  │
│  Step 3: OUTPUT AGENT (Groq Llama 70B - FREE)                  │
│          - Max Tokens: 4000                                     │
│          - Format analysis into report                          │
│                                                                  │
│  Step 4: NOTIFICATION AGENT (Groq Llama 8B - FREE)             │
│          - Max Tokens: 2000                                     │
│          - Condensed notification                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.3.3 Product Recommendation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCT RECOMMENDATION (Complex Task)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Pattern Analysis (Server)                             │
│          - Analyze 30 days transactions                         │
│          - Build co-purchase matrix                             │
│          - Calculate product affinity                           │
│                                                                  │
│  Step 2: ANALYSIS AGENT (KoBoLLm GPT OSS 120B - $0.09/1M)     │
│          - Max Tokens: 6000                                     │
│          - Identify cross-sell opportunities                    │
│          - Generate product recommendations                     │
│          - Consider inventory and margins                       │
│                                                                  │
│  Step 3: OUTPUT AGENT (Groq Llama 70B - FREE)                  │
│          - Max Tokens: 3000                                     │
│          - Format recommendations list                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.3.4 Bundling Suggestion Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  BUNDLING SUGGESTION (Complex Task)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Transaction Analysis (Server)                         │
│          - Build item co-occurrence matrix                      │
│          - Calculate bundle scores                              │
│          - Get product margins                                  │
│                                                                  │
│  Step 2: ANALYSIS AGENT (KoBoLLm GPT OSS 120B - $0.09/1M)     │
│          - Max Tokens: 6000                                     │
│          - Find high-frequency product pairs                    │
│          - Calculate potential bundle margin                    │
│          - Suggest bundle pricing strategy                      │
│                                                                  │
│  Step 3: OUTPUT AGENT (Groq Llama 70B - FREE)                  │
│          - Max Tokens: 3000                                     │
│          - Format bundle suggestions                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.3.5 Low Stock Alert Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  LOW STOCK ALERT (Simple Task)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Inventory Check (Server)                              │
│          - Query products WHERE stock < minStockThreshold        │
│          - Calculate days until stockout                        │
│                                                                  │
│  Step 2: OUTPUT AGENT (Groq Llama 8B - FREE)                   │
│          - Max Tokens: 1500                                     │
│          - Format alert list                                    │
│                                                                  │
│  Step 3: NOTIFICATION AGENT (Groq Llama 8B - FREE)             │
│          - Max Tokens: 1000                                     │
│          - Format WhatsApp/Telegram alert                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Provider Configuration

```env
# ===========================================
# AI PROVIDER - GROQ (FREE - Output)
# ===========================================
GROQ_API_KEY="gsk_xxxxx"
GROQ_MODEL_LARGE="llama-3.3-70b-versatile"
GROQ_MODEL_SMALL="llama-3.1-8b-instant"
GROQ_TIMEOUT=45000

# ===========================================
# AI PROVIDER - KOBOILLM (PAID - Analysis)
# ===========================================
KOBO_API_KEY="your-kobo-api-key"
KOBO_BASE_URL="https://kobo.sharkcore.xyz/v1"
KOBO_MODEL="gpt-oss-120b"
KOBO_TIMEOUT=90000

# ===========================================
# AI PROVIDER - OPENROUTER (Fallback)
# ===========================================
OPENROUTER_API_KEY="sk-or-v1-xxxxx"
OPENROUTER_MODEL="openai/gpt-4o-mini"
OPENROUTER_TIMEOUT=45000

# ===========================================
# AI SETTINGS
# ===========================================
AI_TEMPERATURE_ANALYSIS=0.5
AI_TEMPERATURE_OUTPUT=0.4
AI_TEMPERATURE_NOTIFICATION=0.3

AI_MAX_TOKENS_ANALYSIS=2000
AI_MAX_TOKENS_OUTPUT=1000
AI_MAX_TOKENS_NOTIFICATION=500

AI_FALLBACK_ENABLED=true
AI_CACHE_ENABLED=true
```

### 5.5 Fallback Chain

```
ANALYSIS AGENT:
  KoBoLLm → Groq 70B → OpenRouter → Template

OUTPUT AGENT:
  Groq 70B → Groq 8B → OpenRouter → Template

NOTIFICATION AGENT:
  Groq 8B → Template
```

### 5.6 Caching Strategy

| Insight Type | TTL | Cache Key |
|-------------|-----|-----------|
| Daily Summary | 23 hours | `{ownerId}_daily_{date}` |
| Weekly Report | 6 days | `{ownerId}_weekly_{week}` |
| Recommendations | 7 days | `{ownerId}_recommendations` |
| Bundling | 7 days | `{ownerId}_bundling` |
| Low Stock | 1 hour | `{ownerId}_lowstock` |

### 5.7 Notification Templates

#### WhatsApp/Telegram Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 LAPORAN HARIAN
9 Juni 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Penjualan: Rp 2.500.000
📦 Transaksi: 15 pesanan
📈 vs kemarin: ▲ 12%

⚠️ STOK RENDAH:
• Kaos Polos M: 3 unit
• Hoodie Hitam: 2 unit

💡 Rekomendasi: Restok hoodie secepatnya
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5.8 Monthly Token Budget

| Task | Frequency | Tokens/Month | Provider | Cost |
|------|-----------|--------------|----------|------|
| Daily Summary | 30x | 150,000 | Groq | FREE |
| Low Stock Alerts | 90x | 180,000 | Groq | FREE |
| Weekly Report | 4x | 56,000 | KoBoLLm | ~$5 |
| Recommendations | 4x | 36,000 | KoBoLLm | ~$3 |
| **TOTAL** | | 422,000 | | **~$8/mo** |

*With caching enabled, actual cost significantly lower (estimated ~$3-5/month)*

---

## 6. User Interface Specification

### 6.1 Design System

**Color Palette:**
| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #2563EB | Buttons, links |
| Secondary | #64748B | Secondary text |
| Accent | #10B981 | Success, positive |
| Warning | #F59E0B | Alerts |
| Danger | #EF4444 | Errors, low stock |
| Background | #F8FAFC | Page background |
| Surface | #FFFFFF | Cards, panels |
| Text | #1E293B | Primary text |
| TextMuted | #64748B | Secondary text |

**Typography:**
- Font Family: Inter, system-ui, sans-serif
- H1: 24px / 700 weight
- H2: 20px / 600 weight
- H3: 16px / 600 weight
- Body: 14px / 400 weight
- Small: 12px / 400 weight

### 6.2 Responsive Breakpoints
| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Stack, full-width |
| Tablet | 640px - 1024px | 2-column |
| Desktop | > 1024px | Full layout |

---

## 7. API Specification

### 7.1 REST API Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login owner |
| POST | /api/auth/register | Register (first time setup) |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current owner |

#### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List all products |
| GET | /api/products/:id | Get single product |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| POST | /api/products/:id/restock | Add stock (restock) |
| POST | /api/products/import | Bulk import from Excel |
| GET | /api/products/low-stock | Get low stock products |

#### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/transactions | List transactions |
| GET | /api/transactions/:id | Get transaction detail |
| POST | /api/transactions | Create new transaction (checkout) |
| PUT | /api/transactions/:id/void | Void transaction |

#### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports/daily | Daily sales report |
| GET | /api/reports/weekly | Weekly sales report |
| GET | /api/reports/monthly | Monthly sales report |
| GET | /api/reports/top-products | Top/bottom selling products |
| GET | /api/reports/comparison | Compare periods |

#### AI & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ai/insights/daily | Get daily insight (cached) |
| GET | /api/ai/insights/weekly | Get weekly insight (cached) |
| GET | /api/ai/recommendations | Get product recommendations |
| GET | /api/ai/bundling | Get bundling suggestions |
| POST | /api/ai/generate | Manually trigger AI generation |
| POST | /api/ai/test-notification | Test WA/Telegram notification |

---

## 8. Non-Functional Requirements

| Metric | Target |
|--------|--------|
| Page Load Time | < 2 seconds |
| API Response Time | < 500ms |
| POS Checkout Time | < 3 seconds |
| AI Response Time | < 30 seconds (analysis) |
| Target Uptime | 99% |

**Security:**
- Password hashing (bcrypt)
- Environment variables for secrets
- Input validation (Zod)
- SQL injection prevention (Prisma)

---

## 9. Deployment Plan

### Free Tier Stack
```
┌─────────────────────────────────────────────────┐
|   Client (Vercel)  -   Server (Railway)       |
|       Free              $5 credit/month         │
├─────────────────────────────────────────────────┤
|   Database (Railway PostgreSQL)                 |
|   Free tier: 1GB storage                        │
├─────────────────────────────────────────────────┤
|   AI Providers:                                  |
|   - Groq (FREE)                                |
|   - KoBoLLm ($0.09/1M)                        │
|   - OpenRouter (fallback)                       │
├─────────────────────────────────────────────────┤
|   WhatsApp: Bailey API                          |
|   Telegram: BotFather                           │
└─────────────────────────────────────────────────┘
```

---

## 10. Development Roadmap

### Week 1: Foundation (June 9 - 15)
| Day | Task |
|-----|------|
| 1-2 | Project setup, database schema, Prisma |
| 3-4 | Auth system, basic CRUD API |
| 5-7 | Product management UI + API |

### Week 2: Core POS (June 16 - 22)
| Day | Task |
|-----|------|
| 1-2 | POS screen UI |
| 3-4 | Transaction API + flow |
| 5-7 | Dashboard + basic reports |

### Week 3: Import & Polish (June 23 - 29)
| Day | Task |
|-----|------|
| 1-2 | Excel import feature |
| 3-4 | AI multi-agent system |
| 5-6 | WhatsApp/Telegram integration |
| 7 | Testing, bug fixes, deployment |

---

## 11. Appendix

### Glossary
| Term | Definition |
|------|------------|
| SKU | Stock Keeping Unit - unique identifier for each product |
| POS | Point of Sale - system for recording transactions |
| Variant | Product variation (size, color, etc.) |
| Bundle | Package of multiple products sold together |
| Modal | Cost price (what you paid for the product) |
| AI Agent | Specialized AI component for specific task |
| Pipeline | Chain of AI agents processing a request |
| Cache | Temporary storage to reduce API calls |

### External Services
| Service | Purpose | Cost |
|---------|---------|------|
| Vercel | Frontend hosting | Free |
| Railway | Backend + DB hosting | $5 credit/month |
| Groq | AI output, notifications | Free |
| KoBoLLm | AI analysis, recommendations | $0.09/1M tokens |
| OpenRouter | AI fallback | $0.15/1M tokens |
| Bailey | WhatsApp API | Owner account |
| Telegram Bot | Telegram notifications | Free |

### Change Log
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-06-09 | AI Assistant | Initial SPEC.md creation |

---

**Document Status:** Ready for Review  
**Next Step:** Approve this SPEC to begin development
# AI Providers & Multi-Agent Architecture - PosLite

**Date:** 2026-06-09  
**Last Updated:** 2026-06-09  
**Status:** Final

---

## 1. Provider & Model Configuration

### 1.1 Provider Overview

| Provider | Model | Cost | Use Case |
|----------|-------|------|----------|
| **Groq** | Llama 3.1 8B / 70B | FREE | Output, notifications, formatting |
| **KoBoLLm** | GPT OSS 120B | $0.09/1M | Analysis, recommendations |
| **OpenRouter** | gpt-4o-mini | $0.15/1M | Fallback only |

### 1.2 Model Selection by Task Complexity

| Complexity | Provider | Model | Tasks |
|------------|----------|-------|-------|
| HIGH | KoBoLLm | GPT OSS 120B | Weekly reports, trend analysis, recommendations, bundling |
| MEDIUM | Groq | Llama 70B | Daily summaries, formatted output |
| LOW | Groq | Llama 8B | Notifications, simple alerts |

---

## 2. Multi-Agent Pipeline Architecture

### 2.1 Pipeline Flow

```
TASK REQUEST
     │
     ▼
ROUTER AGENT (classify complexity)
     │
     ├── HIGH COMPLEXITY ──────────────────┐
     │                                     │
     ▼                                     ▼
ANALYSIS AGENT                          OUTPUT AGENT
(KoBoLLm - GPT OSS 120B)              (Groq - Llama 70B)
     │                                     │
     └──────────────┬──────────────────────┘
                    ▼
             OUTPUT AGENT (formatted)
                    │
                    ▼
           NOTIFICATION AGENT
              (Groq - Llama 8B)
                    │
                    ▼
             FINAL OUTPUT
```

### 2.2 Agent Specifications

| Agent | Provider | Model | Max Tokens | Temp | Cost |
|-------|----------|-------|------------|------|------|
| **Analysis** | KoBoLLm | GPT OSS 120B | 8000 | 0.5 | $0.09/1M |
| **Output** | Groq | Llama 70B | 4000 | 0.4 | FREE |
| **Output (Simple)** | Groq | Llama 8B | 2800 | 0.3 | FREE |
| **Notification** | Groq | Llama 8B | 2000 | 0.3 | FREE |

---

## 3. Task Pipelines

### 3.1 Daily Summary Pipeline

```
Step 1: Data Aggregation (Server)
Step 2: OUTPUT AGENT (Groq Llama 8B) - format summary
Step 3: NOTIFICATION AGENT (Groq Llama 8B) - format WA/Telegram
```

### 3.2 Weekly Report Pipeline

```
Step 1: Data Aggregation (Server) - 7 days data
Step 2: ANALYSIS AGENT (KoBoLLm GPT OSS 120B) - deep analysis
Step 3: OUTPUT AGENT (Groq Llama 70B) - format report
Step 4: NOTIFICATION AGENT (Groq Llama 8B) - condensed alert
```

### 3.3 Product Recommendation Pipeline

```
Step 1: Pattern Analysis (Server) - transaction patterns
Step 2: ANALYSIS AGENT (KoBoLLm GPT OSS 120B) - recommendations
Step 3: OUTPUT AGENT (Groq Llama 70B) - format list
```

### 3.4 Bundling Suggestion Pipeline

```
Step 1: Transaction Analysis (Server) - co-purchase matrix
Step 2: ANALYSIS AGENT (KoBoLLm GPT OSS 120B) - bundle suggestions
Step 3: OUTPUT AGENT (Groq Llama 70B) - format suggestions
```

### 3.5 Low Stock Alert Pipeline

```
Step 1: Inventory Check (Server)
Step 2: OUTPUT AGENT (Groq Llama 8B) - format alert
Step 3: NOTIFICATION AGENT (Groq Llama 8B) - format message
```

---

## 4. Token Configuration

| Agent | Input | Output | Total |
|-------|-------|--------|-------|
| Analysis | 6000 | 2000 | 8000 |
| Output (complex) | 3000 | 1000 | 4000 |
| Output (simple) | 2000 | 800 | 2800 |
| Notification | 1500 | 500 | 2000 |

### 4.1 Monthly Token Estimate

| Task | Frequency | Tokens/Month | Provider | Cost |
|------|-----------|--------------|----------|------|
| Daily Summary | 30x | 150,000 | Groq | FREE |
| Low Stock Alerts | 90x | 180,000 | Groq | FREE |
| Weekly Report | 4x | 56,000 | KoBoLLm | ~$5 |
| Recommendations | 4x | 36,000 | KoBoLLm | ~$3 |
| **TOTAL** | | 422,000 | | **~$8/mo** |

*With caching, actual cost significantly lower*

---

## 5. Rate Limit Management

| Provider | Limit | Strategy |
|----------|-------|----------|
| Groq | 14,400/min | Safe limit 1000/min, queue system |
| KoBoLLm | Per plan | Only for analysis, cache results |
| OpenRouter | Per model | Fallback only |

---

## 6. Environment Configuration

```env
# GROQ (FREE)
GROQ_API_KEY="gsk_xxxxx"
GROQ_MODEL_LARGE="llama-3.3-70b-versatile"
GROQ_MODEL_SMALL="llama-3.1-8b-instant"

# KOBOILLM (PAID - Analysis)
KOBO_API_KEY="your-kobo-api-key"
KOBO_BASE_URL="https://kobo.sharkcore.xyz/v1"
KOBO_MODEL="gpt-oss-120b"

# OPENROUTER (FALLBACK)
OPENROUTER_API_KEY="sk-or-v1-xxxxx"
OPENROUTER_MODEL="openai/gpt-4o-mini"

# AI SETTINGS
AI_TEMPERATURE_ANALYSIS=0.5
AI_TEMPERATURE_OUTPUT=0.4
AI_TEMPERATURE_NOTIFICATION=0.3
AI_MAX_TOKENS_ANALYSIS=2000
AI_MAX_TOKENS_OUTPUT=1000
AI_MAX_TOKENS_NOTIFICATION=500
```

---

## 7. Fallback Chain

```
ANALYSIS AGENT:
  KoBoLLm → Groq 70B → OpenRouter → Template

OUTPUT AGENT:
  Groq 70B → Groq 8B → OpenRouter → Template

NOTIFICATION AGENT:
  Groq 8B → Template
```

---

## 8. System Prompts Summary

### Analysis Agent
- Deep analysis, step-by-step reasoning
- Identify patterns, trends, anomalies
- Generate actionable recommendations
- Stock forecasting

### Output Agent
- Format analysis into clear structure
- Use emojis sparingly (metrics, trends, alerts)
- Indonesian localization
- Scannable format

### Notification Agent
- Concise, mobile-friendly
- Max 4096 characters
- Prioritize key information
- Clear call to action

---

## 9. Summary

| Component | Configuration |
|-----------|---------------|
| Analysis | KoBoLLm GPT OSS 120B ($0.09/1M) |
| Output | Groq Llama 70B (FREE) |
| Notification | Groq Llama 8B (FREE) |
| Fallback | OpenRouter gpt-4o-mini ($0.15/1M) |
| Token Limits | 2000-8000 (no budget constraint) |
| Estimated Cost | ~$5-10/month with full features |
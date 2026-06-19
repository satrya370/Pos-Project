# Dependencies Documentation - PosLite

**Project:** PosLite  
**Version:** 1.0.0  
**Date:** 2026-06-09  
**Status:** Draft

---

## 1. Overview

Dokumen ini mendokumentasikan semua dependencies yang digunakan di PosLite.

---

## 2. Client Dependencies

### Core
- react ^18.2.0
- react-dom ^18.2.0
- react-router-dom ^6.22.0

### State Management
- zustand ^4.5.0
- @tanstack/react-query ^5.17.0

### HTTP and Data
- axios ^1.6.5
- xlsx ^0.18.5

### UI
- recharts ^2.10.4
- lucide-react ^0.312.0
- clsx ^2.1.0
- date-fns ^3.3.1

### Styling
- tailwindcss ^3.4.1
- autoprefixer ^10.4.17
- postcss ^8.4.33

### Dev
- typescript ^5.3.3
- vite ^5.0.12
- @vitejs/plugin-react ^4.2.1
- eslint ^8.56.0

---

## 3. Server Dependencies

### Web Framework
- express ^4.18.2
- cors ^2.8.5
- helmet ^7.1.0
- morgan ^1.10.0
- compression ^1.7.4

### Database
- @prisma/client ^5.9.0
- prisma ^5.9.0

### Auth
- bcryptjs ^2.4.3
- jsonwebtoken ^9.0.2

### Validation
- zod ^3.22.4

### AI
- openai ^4.26.0

### Utilities
- node-cron ^3.0.3
- dotenv ^16.4.0
- uuid ^9.0.1

### Dev
- typescript ^5.3.3
- tsx ^4.7.0

---

## 4. External Services (No NPM)

- OpenAI API - AI insights
- Bailey API - WhatsApp notifications
- Telegram Bot - Alerts

---

## 5. Cost Analysis

| Item | Monthly Cost |
|------|--------------|
| OpenAI GPT-3.5 | ~0.30 USD |
| Hosting | Free tier |
| Database | Free tier |

---

## 6. Security Notes

Run before production:
`
npm audit
`

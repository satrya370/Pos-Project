#!/bin/bash
set -e

echo "=========================================="
echo "  PosLite - Codespaces Setup"
echo "=========================================="

# Masuk ke folder project
cd pos-lite

# Install semua dependencies
echo ""
echo "📦 Installing dependencies..."
npm run install:all

# Setup .env jika belum ada
if [ ! -f "server/.env" ]; then
  echo ""
  echo "⚙️  Creating .env from .env.example..."
  cp .env.example server/.env

  # Generate random JWT secret
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" server/.env

  echo "✅ .env created (JWT secret auto-generated)"
  echo "⚠️  Edit server/.env untuk tambahkan API keys (Groq, dll) jika perlu"
fi

# Setup database
echo ""
echo "🗄️  Setting up database..."
cd server
npx prisma generate
npx prisma db push
cd ..

echo ""
echo "=========================================="
echo "  ✅ Setup selesai!"
echo ""
echo "  Jalankan dev server:"
echo "  cd pos-lite && npm run dev"
echo ""
echo "  Frontend → port 5173"
echo "  Backend  → port 3000"
echo "=========================================="

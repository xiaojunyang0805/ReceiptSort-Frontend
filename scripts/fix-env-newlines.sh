#!/bin/bash

# Fix Vercel environment variables - remove newlines and ensure consistency
echo "🔧 Fixing Vercel Environment Variables (removing newlines)"
echo "=========================================================="

# Read from .env.local and clean values
STRIPE_SECRET_KEY=$(grep "^STRIPE_SECRET_KEY=" .env.local | cut -d'=' -f2 | tr -d '\n\r"' | xargs)
STRIPE_PUBLISHABLE_KEY=$(grep "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" .env.local | cut -d'=' -f2 | tr -d '\n\r"' | xargs)
STRIPE_PRICE_STARTER=$(grep "^STRIPE_PRICE_STARTER=" .env.local | cut -d'=' -f2 | tr -d '\n\r"' | xargs)
STRIPE_PRICE_BASIC=$(grep "^STRIPE_PRICE_BASIC=" .env.local | cut -d'=' -f2 | tr -d '\n\r"' | xargs)
STRIPE_PRICE_PRO=$(grep "^STRIPE_PRICE_PRO=" .env.local | cut -d'=' -f2 | tr -d '\n\r"' | xargs)
STRIPE_PRICE_BUSINESS=$(grep "^STRIPE_PRICE_BUSINESS=" .env.local | cut -d'=' -f2 | tr -d '\n\r"' | xargs)

echo "1️⃣  Updating STRIPE_SECRET_KEY..."
echo "$STRIPE_SECRET_KEY" | vercel env add STRIPE_SECRET_KEY production

echo "2️⃣  Updating NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY..."
echo "$STRIPE_PUBLISHABLE_KEY" | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

echo "3️⃣  Updating STRIPE_PRICE_STARTER..."
echo "$STRIPE_PRICE_STARTER" | vercel env add STRIPE_PRICE_STARTER production

echo "4️⃣  Updating STRIPE_PRICE_BASIC..."
echo "$STRIPE_PRICE_BASIC" | vercel env add STRIPE_PRICE_BASIC production

echo "5️⃣  Updating STRIPE_PRICE_PRO..."
echo "$STRIPE_PRICE_PRO" | vercel env add STRIPE_PRICE_PRO production

echo "6️⃣  Updating STRIPE_PRICE_BUSINESS..."
echo "$STRIPE_PRICE_BUSINESS" | vercel env add STRIPE_PRICE_BUSINESS production

echo ""
echo "✅ All environment variables updated!"
echo ""
echo "7️⃣  Triggering deployment..."
git commit --allow-empty -m "Trigger redeploy with fixed env vars (no newlines)"
git push

echo ""
echo "=========================================================="
echo "✅ Done! Wait 1-2 minutes for deployment to complete."
echo "Then test at: https://receiptsort.vercel.app/credits"
echo "=========================================================="

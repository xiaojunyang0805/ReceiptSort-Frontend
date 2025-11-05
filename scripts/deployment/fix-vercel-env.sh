#!/bin/bash
# Fix Vercel Production Environment Variables
# Usage: bash scripts/fix-vercel-env.sh

echo "🔧 Fixing Vercel Production Environment Variables"
echo "=================================================="
echo ""

# Test mode Stripe credentials
STRIPE_SECRET_KEY="sk_test_51SFHT62Q25JDcEYXIAfXDKg2Qd78XO6ZIZILpeJ17kb6sMBTp9JQn0sHTdsoULxcAU93qahUCjP4Lz5a067AOARB00gZe4omin"
STRIPE_PUBLISHABLE_KEY="pk_test_51SFHT62Q25JDcEYXJ9Hir7huqLw1bOiVxFLq0Ae95pIxk8NHiayfwmKtnjZPGQg0jwF8iyUhNVF11xIl0YBFXqOY00noEHr540"

# Test mode Price IDs
STRIPE_PRICE_STARTER="price_1SJV7L2Q25JDcEYXN7qC2OoR"
STRIPE_PRICE_BASIC="price_1SJV7M2Q25JDcEYXOcEy3eUy"
STRIPE_PRICE_PRO="price_1SJV7M2Q25JDcEYXrww1qskN"
STRIPE_PRICE_BUSINESS="price_1SJV7N2Q25JDcEYXEULPIDoK"

echo "1️⃣  Adding STRIPE_SECRET_KEY..."
echo "$STRIPE_SECRET_KEY" | vercel env add STRIPE_SECRET_KEY production --force

echo "2️⃣  Adding NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY..."
echo "$STRIPE_PUBLISHABLE_KEY" | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production --force

echo "3️⃣  Adding STRIPE_PRICE_STARTER..."
echo "$STRIPE_PRICE_STARTER" | vercel env add STRIPE_PRICE_STARTER production --force

echo "4️⃣  Adding STRIPE_PRICE_BASIC..."
echo "$STRIPE_PRICE_BASIC" | vercel env add STRIPE_PRICE_BASIC production --force

echo "5️⃣  Adding STRIPE_PRICE_PRO..."
echo "$STRIPE_PRICE_PRO" | vercel env add STRIPE_PRICE_PRO production --force

echo "6️⃣  Adding STRIPE_PRICE_BUSINESS..."
echo "$STRIPE_PRICE_BUSINESS" | vercel env add STRIPE_PRICE_BUSINESS production --force

echo ""
echo "✅ All environment variables added!"
echo ""
echo "7️⃣  Triggering deployment..."
git commit --allow-empty -m "Trigger redeploy with fixed env vars"
git push

echo ""
echo "=================================================="
echo "✅ Done! Wait 1-2 minutes for deployment to complete."
echo "Then test at: https://receiptsort.vercel.app/credits"
echo "=================================================="

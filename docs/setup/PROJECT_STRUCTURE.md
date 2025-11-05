# ReceiptSort Project Structure

**Last Updated:** 2025-10-19
**Status:** Production-ready ✅

## 📁 Root Directory Structure

```
receiptsort/
├── src/                          # Next.js application source
├── public/                       # Static assets
├── supabase/                     # Database migrations and schemas
├── scripts/                      # Developer utility scripts
├── tests/                        # Automated test suite
├── docs/                         # Project documentation
├── test-results/                 # Test artifacts and screenshots
├── messages/                     # i18n translation files
├── Dev_note_01.md               # Development history (Days 1-4)
├── Dev_note_02.md               # Development history (Days 5-7)
└── PROJECT_STRUCTURE.md         # This file
```

## 📚 Documentation (`docs/`)

### Active Documentation

```
docs/
├── README.md                              # Documentation index
├── stripe-setup/
│   ├── STRIPE_DASHBOARD_SETTINGS.md      # Stripe Dashboard configuration
│   └── Stripe_implementation.md          # Complete Stripe implementation guide
└── archive/
    ├── PAYMENT_TESTING_GUIDE.md          # Historical payment testing guide
    ├── STRIPE_INVOICE_SETUP.md           # Historical invoice setup guide
    ├── WEBHOOK_SETUP_GUIDE.md            # Historical webhook guide
    └── STRIPE_AUTOMATION.md              # Historical automation scripts
```

**Key Files:**
- **Dev_note_01.md** - Days 1-4: Initial development, auth setup, upload functionality (Oct 7-13, 2025)
- **Dev_note_02.md** - Days 5-7: Market value enhancements, payment/invoice testing (Oct 13-19, 2025)
- **docs/stripe-setup/** - Current Stripe configuration and implementation
- **docs/archive/** - Historical documents (superseded but kept for reference)

## 🧪 Testing (`tests/` & `test-results/`)

### Test Files

```
tests/
├── README.md                    # Test suite documentation
├── quick-test.js               # Fast diagnostic (2 seconds)
├── payment-flow.test.js        # Backend testing (10 seconds)
└── browser-payment-test.js     # End-to-end browser automation (60 seconds)
```

### Test Results

```
test-results/
└── test-screenshots/           # Browser test screenshots
    ├── 01-login-page.png
    ├── 02-login-filled.png
    ├── 03-logged-in.png
    ├── 04-credits-page.png
    └── ...
```

## 🔧 Scripts (`scripts/`)

### Directory Structure

```
scripts/
├── README.md                      # Scripts documentation
├── debugging/                     # Emergency manual fixes (dev only)
│   ├── add-10-credits.mjs
│   ├── add-credits-manual.js
│   ├── add-transaction-record.js
│   └── fix-current-payment.mjs
├── test-utilities/               # Stripe testing scripts
│   ├── check-invoice-details.mjs
│   ├── check-invoices.mjs
│   ├── test-complete-workflow.mjs
│   └── ... (13 files total)
├── legacy-utilities/             # Historical validation scripts
│   ├── apply-credit-transactions-migration.js
│   ├── diagnose-auth.mjs
│   ├── validate-rls.mjs
│   ├── validate-schema.mjs
│   └── validate-storage.mjs
├── # i18n scripts (6 files)
├── add-account-billing-i18n.mjs
├── add-missing-translations.mjs
└── # Stripe testing scripts (6 files)
    ├── check-invoice-events.mjs
    ├── get-live-prices.mjs
    └── update-stripe-env.mjs
```

**Total Scripts:** 29 scripts organized into 4 categories

### Script Categories

1. **i18n Scripts (6)** - Translation management
2. **Stripe Testing Scripts (6)** - Active Stripe testing and diagnostics
3. **Debugging Scripts (4)** - Emergency manual fixes (development only)
4. **Test Utilities (13)** - Comprehensive Stripe invoice testing
5. **Legacy Utilities (5)** - Historical validation (reference only)

## 💻 Source Code (`src/`)

### Application Structure

```
src/
├── app/                          # Next.js 13+ app directory
│   ├── [locale]/                 # Internationalized routes
│   │   ├── (dashboard)/          # Dashboard pages (authenticated)
│   │   │   ├── receipts/
│   │   │   ├── history/
│   │   │   ├── credits/
│   │   │   ├── profile/
│   │   │   └── account/
│   │   ├── (auth)/               # Authentication pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   └── layout.tsx
│   └── api/                      # API routes
│       ├── auth/
│       ├── credits/
│       ├── stripe/
│       │   └── webhook/          # Stripe webhook handler
│       └── receipts/
├── components/                   # React components
│   ├── ui/                       # Shadcn/ui components
│   ├── dashboard/                # Dashboard-specific components
│   └── shared/                   # Shared components
├── lib/                          # Utility libraries
│   ├── stripe.ts                 # Stripe integration
│   ├── supabase/                 # Supabase clients
│   └── utils.ts                  # Helper functions
└── middleware.ts                 # Next.js middleware (auth + i18n)
```

## 🗄️ Database (`supabase/`)

```
supabase/
└── migrations/
    ├── 20241004_initial_schema.sql
    ├── 20241006_credit_transactions.sql
    ├── 20251015_create_invoices_table.sql
    └── ... (migration files)
```

**Key Tables:**
- `profiles` - User profiles and credit balances
- `receipts` - Uploaded receipt data
- `credit_transactions` - Credit purchase and usage history
- `invoices` - Stripe invoice records

## 🌍 Internationalization (`messages/`)

```
messages/
├── en.json                       # English translations
├── nl.json                       # Dutch translations
└── zh.json                       # Chinese translations
```

**Supported Languages:**
- English (en) - Primary
- Dutch (nl) - Secondary
- Chinese (zh) - Secondary

## 🔐 Environment Variables

### Required Variables

**Stripe:**
- `STRIPE_SECRET_KEY` - Stripe API secret (test or live)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `STRIPE_PRICE_*` - Price IDs for credit packages

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key

**OpenRouter AI:**
- `OPENROUTER_API_KEY` - AI receipt processing

**App:**
- `NEXT_PUBLIC_URL` - Application base URL

### Environment Files

- `.env.local` - Local development (gitignored)
- `.env.example` - Example template
- Vercel Dashboard - Production variables

## 📦 Key Dependencies

### Production Dependencies
- **Next.js 14** - React framework
- **React 18** - UI library
- **Stripe** - Payment processing
- **Supabase** - Database and auth
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **date-fns** - Date utilities
- **i18next** - Internationalization

### Development Dependencies
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **Playwright** - Browser automation
- **Prettier** - Code formatting

## 🚀 Deployment

**Primary Deployment:**
- Platform: Vercel
- URL: https://receiptsort.seenano.nl
- Auto-deployment: Enabled (main branch)

**Associated Projects:**
- GitHub Main: https://github.com/xiaojunyang0805/receiptsort-project
- UI Library: https://github.com/xiaojunyang0805/receiptsort-ui
- Landing Page: https://github.com/xiaojunyang0805/receiptsort-landing
- Utilities: https://github.com/xiaojunyang0805/receiptsort-utils

## 📊 File Statistics

**Total Lines of Documentation:** ~150,000+ lines
- Dev_note_01.md: ~3,000 lines
- Dev_note_02.md: ~2,200 lines
- Stripe documentation: ~2,000 lines
- Other docs and README files: ~1,000 lines

**Total Scripts:** 29 utility scripts
**Total Tests:** 3 test suites
**Total Migrations:** 10+ database migrations

## 🔄 Development Workflow

### 1. Local Development
```bash
npm run dev                 # Start development server
node tests/quick-test.js    # Run quick diagnostic
```

### 2. Testing
```bash
npm test                    # Run all tests
node tests/browser-payment-test.js  # Browser automation
```

### 3. Deployment
```bash
git push                    # Auto-deploy to Vercel
vercel --prod              # Manual production deploy
```

## 📝 Documentation Philosophy

**Living Documentation Approach:**
1. **Active** - Current implementation (docs/stripe-setup/, Dev_note_02.md)
2. **Historical** - Development journey with all decisions (Dev_note_01.md, Dev_note_02.md)
3. **Archive** - Superseded but kept for reference (docs/archive/)

**All major decisions, issues, and solutions are documented in Dev_note_*.md files.**

## 🎯 Quick Navigation

### For Developers
- Start: `Dev_note_01.md` → `Dev_note_02.md`
- Stripe Setup: `docs/stripe-setup/`
- Scripts: `scripts/README.md`
- Tests: `tests/README.md`

### For Production
- Live Site: https://receiptsort.seenano.nl
- Stripe Dashboard: https://dashboard.stripe.com/
- Vercel Dashboard: https://vercel.com/xiaojunyang0805s-projects/receiptsort

### For Issues
- Payment Issues: `Dev_note_02.md` (Phase 2: Live Mode Testing)
- Auth Issues: `Dev_note_01.md` (Day 2: Authentication Setup)
- Database Issues: `supabase/migrations/`

---

**Project Status:** ✅ Production-ready (as of 2025-10-19)
**Latest Feature:** Invoice PDF auto-attachment to receipt emails
**Last Major Update:** Payment-invoice workflow testing complete

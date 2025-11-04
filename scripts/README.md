# Scripts

Organized utility scripts for development, testing, and deployment.

## 📁 Categories

### `/admin/` - Admin & User Management
- check-all-receipts.mjs
- check-xiaojun-templates.mjs
- process-pending-receipts.mjs

### `/database/` - Database Operations
- run-migration.mjs
- cleanup-old-exports.mjs
- cleanup-stuck-receipts.mjs

### `/debugging/` - Debugging Tools
- add-10-credits.mjs
- check-stuck-receipts.mjs
- reset-stuck-receipts.mjs

### `/deployment/` - Deployment & Environment
- fix-env-newlines.sh
- fix-vercel-env.sh
- setup-cron-secret.mjs
- update-stripe-env.mjs

### `/i18n/` - Translation Scripts
- add-account-billing-i18n.mjs
- add-missing-translations.mjs
- fix-receiptspage-translations.mjs

### `/stripe/` - Payment Testing
- check-invoice-events.mjs
- check-latest-transactions.mjs
- get-live-prices.mjs

### `/templates/` - Template Testing
- analyze-template.mjs
- test-smart-template-api.mjs
- test-xlsx-library.mjs

### `/testing/` - Test Utilities
- test-complete-export-flow.mjs
- test-api-direct.mjs
- compare-files-binary.mjs

### `/storage/` - Supabase Storage
- check-storage-permissions.mjs
- make-bucket-public.mjs
- update-bucket-mime-types.mjs

### `/legacy/` - Archived Scripts
- Old utilities (no longer actively used)

## 🚀 Usage

Run scripts from project root:
```bash
node scripts/admin/check-all-receipts.mjs
node scripts/testing/test-complete-export-flow.mjs
```

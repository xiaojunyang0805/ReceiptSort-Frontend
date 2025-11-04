# Project Cleanup & Reorganization Plan

**Date:** 2025-11-04
**Status:** 📋 Ready to Execute
**Goal:** Clean up root directory clutter, organize scripts, consolidate documentation

---

## Current Issues Identified

### 🔴 Critical Issues
1. **Root Directory Clutter**: 20+ files in root (docs, test scripts, temp files)
2. **11 Environment Files**: Multiple `.env` variants creating confusion
3. **Scattered Test Scripts**: Test files in both root and `/tests`
4. **Disorganized Scripts**: 50+ scripts in `/scripts` without clear categorization
5. **Duplicate Documentation**: Multiple README files, overlapping guides

### 🟡 Medium Priority
6. **Component Structure**: `components/landing/FinalCTA.tsx` duplicated in root
7. **Old Migration Files**: Legacy utilities that may no longer be needed
8. **Test Results**: 428KB of test results that should be gitignored

### 🟢 Low Priority
9. **Documentation Consolidation**: 4 Dev_note files + multiple guides
10. **Archive Organization**: Some docs already in `/docs/archive` but inconsistent

---

## Proposed New Structure

```
receiptsort/
├── .github/                          # GitHub workflows (existing)
├── docs/                             # 📚 ALL DOCUMENTATION
│   ├── development/                  # Development notes & guides
│   │   ├── Dev_note_01.md
│   │   ├── Dev_note_02.md
│   │   ├── Dev_note_03.md
│   │   └── Dev_note_04_AI_Template_Roadmap.md
│   ├── features/                     # Feature-specific docs
│   │   ├── CUSTOM_TEMPLATES_IMPLEMENTATION_SUMMARY.md
│   │   ├── TEMPLATE_FEATURE_FEASIBILITY.md
│   │   └── TRANSLATION_INTEGRATION_GUIDE.md
│   ├── setup/                        # Setup & configuration guides
│   │   ├── CRON_SETUP.md
│   │   ├── PROJECT_STRUCTURE.md
│   │   └── Web_Activity_Monitoring.md
│   ├── stripe-setup/                 # Stripe documentation (existing)
│   │   ├── STRIPE_DASHBOARD_SETTINGS.md
│   │   └── Stripe_implementation.md
│   ├── archive/                      # Old/deprecated docs (existing)
│   │   ├── PAYMENT_TESTING_GUIDE.md
│   │   ├── STRIPE_AUTOMATION.md
│   │   ├── STRIPE_INVOICE_SETUP.md
│   │   └── WEBHOOK_SETUP_GUIDE.md
│   ├── landing-page/                 # Landing page specific
│   │   └── receiptsort-landing-page-update-prompts.md
│   ├── marketing/                    # Marketing docs (moved from root)
│   │   ├── receiptsort_strategic_analysis.md
│   │   ├── ReceiptSorter-PreLaunch-5Day-Plan.md
│   │   └── SUBSCRIPTION_ANALYSIS.md
│   └── README.md                     # Documentation index
│
├── scripts/                          # 🔧 REORGANIZED SCRIPTS
│   ├── admin/                        # Admin & user management
│   │   ├── check-all-receipts.mjs
│   │   ├── check-xiaojun-templates.mjs
│   │   └── process-pending-receipts.mjs
│   ├── database/                     # Database operations
│   │   ├── run-migration.mjs
│   │   ├── cleanup-old-exports.mjs
│   │   └── cleanup-stuck-receipts.mjs
│   ├── debugging/                    # Debugging tools (existing)
│   │   ├── add-10-credits.mjs
│   │   ├── add-credits-manual.js
│   │   ├── check-stuck-receipts.mjs
│   │   └── reset-stuck-receipts.mjs
│   ├── deployment/                   # Deployment & env setup
│   │   ├── fix-env-newlines.sh
│   │   ├── fix-vercel-env.sh
│   │   ├── setup-cron-secret.mjs
│   │   └── update-stripe-env.mjs
│   ├── i18n/                         # Translation scripts
│   │   ├── add-account-billing-i18n.mjs
│   │   ├── add-invoices-i18n.mjs
│   │   ├── add-missing-translations.mjs
│   │   ├── add-profile-edit-i18n.mjs
│   │   ├── add-upload-button-translation.mjs
│   │   └── fix-receiptspage-translations.mjs
│   ├── legacy/                       # Old utilities (archived)
│   │   ├── apply-credit-transactions-migration.js
│   │   ├── diagnose-auth.mjs
│   │   ├── validate-rls.mjs
│   │   ├── validate-schema.mjs
│   │   └── validate-storage.mjs
│   ├── stripe/                       # Stripe & payment testing
│   │   ├── check-invoice-events.mjs
│   │   ├── check-latest-transactions.mjs
│   │   ├── check-recent-invoice.mjs
│   │   ├── check-webhook-event.mjs
│   │   ├── fix-stuck-invoice.mjs
│   │   └── get-live-prices.mjs
│   ├── templates/                    # Template testing
│   │   ├── analyze-template.mjs
│   │   ├── check-template-save.mjs
│   │   ├── test-smart-template-api.mjs
│   │   ├── test-template-population.mjs
│   │   └── test-xlsx-library.mjs
│   ├── testing/                      # Test utilities (consolidate)
│   │   ├── check-export-record.mjs
│   │   ├── check-invoice-details.mjs
│   │   ├── check-profiles.mjs
│   │   ├── check-schema.mjs
│   │   ├── compare-files-binary.mjs
│   │   ├── compare-local-vs-api.mjs
│   │   ├── test-api-direct.mjs
│   │   ├── test-complete-export-flow.mjs
│   │   ├── test-complete-workflow.mjs
│   │   ├── test-download-url.mjs
│   │   ├── test-export-issue.mjs
│   │   └── test-pdf-vision.mjs
│   ├── storage/                      # Supabase storage management
│   │   ├── check-storage-permissions.mjs
│   │   ├── make-bucket-public.mjs
│   │   └── update-bucket-mime-types.mjs
│   └── README.md                     # Scripts documentation
│
├── tests/                            # 🧪 TESTING
│   ├── fixtures/                     # Test data
│   │   └── test-receipts/           # Real receipt test files
│   ├── integration/                  # Integration tests
│   │   ├── browser-payment-test.js
│   │   └── payment-flow.test.js
│   ├── troubleshooting/              # Debugging guides
│   │   └── pdf-parsing-fix/         # 251026 PDF file failed parsing docs
│   ├── .gitignore                    # Ignore test-results/
│   ├── quick-test.js
│   └── README.md
│
├── tools/                            # 🛠️ DEVELOPMENT TOOLS (NEW)
│   ├── env/                          # Environment management
│   │   ├── .env.local.template       # Template for local dev
│   │   └── .env.example              # Example environment vars
│   └── temp/                         # Temporary test files
│       ├── check-receipt-093529.mjs  # One-off scripts
│       ├── test-vision-api.mjs
│       └── test-vision-base64.mjs
│
├── src/                              # Source code (NO CHANGES)
├── public/                           # Public assets (NO CHANGES)
├── messages/                         # i18n translations (NO CHANGES)
├── supabase/                         # Supabase migrations (NO CHANGES)
│
├── .env.local                        # Active local environment
├── .gitignore                        # Updated to ignore temp files
├── components.json                   # shadcn/ui config
├── next.config.mjs                   # Next.js config
├── package.json
├── README.md                         # Main project README
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## Cleanup Actions

### Phase 1: Root Directory Cleanup

#### A. Environment Files (11 → 2 files)
**KEEP:**
- `.env.local` - Active local development
- `.env.local.template` - Template for developers

**MOVE TO `tools/env/` (for reference):**
- `.env.production` - Production reference
- `.env.production.check`
- `.env.vercel.production`

**DELETE (duplicate/obsolete):**
- `.env.check` - Duplicate of .env.production.check
- `.env.production.clean` - Obsolete
- `.env.production.latest` - Obsolete
- `.env.production.local` - Duplicate
- `.env.vercel.check` - Duplicate
- `.env.vercel.production.check` - Duplicate

#### B. Documentation Files (Move to `docs/`)
**Move to `docs/development/`:**
- `Dev_note_01.md`
- `Dev_note_02.md`
- `Dev_note_03.md`
- `Dev_note_04_AI_Template_Roadmap.md`

**Move to `docs/features/`:**
- `CUSTOM_TEMPLATES_IMPLEMENTATION_SUMMARY.md`
- `TEMPLATE_FEATURE_FEASIBILITY.md`
- `TRANSLATION_INTEGRATION_GUIDE.md`

**Move to `docs/setup/`:**
- `CRON_SETUP.md`
- `PROJECT_STRUCTURE.md`
- `Web_Activity_Monitoring.md`

**Move to `docs/landing-page/`:**
- `docs/receiptsort-landing-page-update-prompts.md` (already in docs/)

**Move `marketing/` folder:**
- Move entire `marketing/` folder to `docs/marketing/`

#### C. Test/Temp Files (Move/Delete)
**Move to `tools/temp/`:**
- `check-receipt-093529.mjs` - One-off debugging script
- `test-vision-api.mjs` - One-off test
- `test-vision-base64.mjs` - One-off test
- `test-extraction-results.json` - Test output

**DELETE (obsolete):**
- `TEMPLATE_TRANSLATIONS.json` - Old translation file (redundant with messages/)

#### D. Component Files
**DELETE (duplicate):**
- `components/landing/FinalCTA.tsx` - Duplicate of `src/components/landing/FinalCTA.tsx`
- Delete entire `components/` folder at root (not needed)

### Phase 2: Scripts Reorganization

**Create new structure:**
```bash
scripts/
├── admin/         # 3 files
├── database/      # 3 files
├── debugging/     # 5 files (existing folder)
├── deployment/    # 4 files
├── i18n/          # 6 files
├── legacy/        # 5 files (from legacy-utilities/)
├── stripe/        # 6 files
├── templates/     # 5 files
├── testing/       # 13 files (consolidate test-utilities/)
└── storage/       # 3 files
```

**Consolidate:**
- Merge `scripts/test-utilities/` into `scripts/testing/`
- Move `scripts/legacy-utilities/` to `scripts/legacy/`
- Delete empty folders

### Phase 3: Tests Reorganization

**Create structure:**
```bash
tests/
├── fixtures/
│   └── test-receipts/       # Real test files (33MB)
├── integration/
│   ├── browser-payment-test.js
│   └── payment-flow.test.js
├── troubleshooting/
│   └── pdf-parsing-fix/     # 251026 docs (116KB)
└── README.md
```

**Update `.gitignore`:**
```gitignore
# Test outputs
tests/test-results/
tests/ExportTemplate/*.xlsx
*.test-output.json
```

### Phase 4: Create New Folders

**`tools/` directory:**
```bash
tools/
├── env/
│   ├── .env.local.template
│   ├── .env.example
│   └── README.md              # Environment setup guide
└── temp/
    └── .gitkeep               # Gitignored, but keep folder
```

**Update `.gitignore`:**
```gitignore
# Temporary development files
tools/temp/*
!tools/temp/.gitkeep

# Environment files
.env*.local
.env*.production*
.env*.check
!.env.local.template
!.env.example
```

---

## File Movements Summary

### Root → docs/
```
Dev_note_01.md                                  → docs/development/
Dev_note_02.md                                  → docs/development/
Dev_note_03.md                                  → docs/development/
Dev_note_04_AI_Template_Roadmap.md             → docs/development/
CUSTOM_TEMPLATES_IMPLEMENTATION_SUMMARY.md     → docs/features/
TEMPLATE_FEATURE_FEASIBILITY.md                → docs/features/
TRANSLATION_INTEGRATION_GUIDE.md               → docs/features/
CRON_SETUP.md                                   → docs/setup/
PROJECT_STRUCTURE.md                            → docs/setup/
Web_Activity_Monitoring.md                     → docs/setup/
marketing/                                      → docs/marketing/
```

### Root → tools/
```
check-receipt-093529.mjs                        → tools/temp/
test-vision-api.mjs                             → tools/temp/
test-vision-base64.mjs                          → tools/temp/
test-extraction-results.json                    → tools/temp/
.env.local.template                             → tools/env/
.env.production                                 → tools/env/
.env.production.check                           → tools/env/
.env.vercel.production                          → tools/env/
```

### scripts/ reorganization
```
scripts/*.mjs                                   → scripts/{category}/
scripts/test-utilities/*                        → scripts/testing/
scripts/legacy-utilities/*                      → scripts/legacy/
```

### tests/ reorganization
```
tests/test-receipts/                            → tests/fixtures/test-receipts/
tests/251026 PDF file failed parsing/           → tests/troubleshooting/pdf-parsing-fix/
tests/*.js                                      → tests/integration/
```

### Files to DELETE
```
.env.check
.env.production.clean
.env.production.latest
.env.production.local
.env.vercel.check
.env.vercel.production.check
TEMPLATE_TRANSLATIONS.json
components/ (entire folder at root)
```

---

## Benefits After Cleanup

### 📁 Clean Root Directory
**Before:** 20+ files
**After:** ~10 config files only
- `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`
- `.env.local`, `.gitignore`, `.eslintrc.json`
- `README.md`, `vercel.json`, `components.json`

### 📚 Organized Documentation
- All docs in `/docs` with clear categorization
- Development notes chronologically ordered
- Feature docs separated from setup guides
- Marketing materials in dedicated folder

### 🔧 Categorized Scripts
- Easy to find: "Where's the template test script?" → `scripts/templates/`
- Clear purpose: Deployment, testing, debugging, i18n
- Deprecated scripts in `scripts/legacy/` (not deleted, just archived)

### 🧪 Structured Tests
- Test data in `fixtures/`
- Integration tests separated
- Troubleshooting guides preserved

### 🛠️ Developer Tools
- Environment templates in `tools/env/`
- Temporary scripts in `tools/temp/` (gitignored)
- Clear separation from production code

---

## Risk Assessment

### ⚠️ Risks
1. **Breaking imports:** Moving scripts might break references
2. **Lost history:** Git history follows file moves
3. **Deployment issues:** Environment file changes might affect Vercel

### ✅ Mitigations
1. **Use `git mv`** - Preserves history
2. **Test after each phase** - Verify nothing breaks
3. **Keep backup** - `.env.local` stays in root
4. **Document changes** - Update READMEs in each folder

---

## Execution Plan

### Step 1: Backup (Safety First)
```bash
git checkout -b cleanup/project-reorganization
git add -A && git commit -m "Backup before cleanup"
```

### Step 2: Create New Folders
```bash
mkdir -p docs/{development,features,setup,landing-page}
mkdir -p scripts/{admin,database,deployment,i18n,stripe,templates,testing,storage}
mkdir -p tests/{fixtures,integration,troubleshooting}
mkdir -p tools/{env,temp}
```

### Step 3: Move Documentation
```bash
# Execute moves with git mv to preserve history
git mv Dev_note_*.md docs/development/
git mv CUSTOM_TEMPLATES_*.md docs/features/
# ... etc
```

### Step 4: Reorganize Scripts
```bash
# Move scripts by category
# ... detailed commands
```

### Step 5: Clean Environment Files
```bash
git mv .env.production tools/env/
# Delete obsolete files
git rm .env.check .env.production.clean
# ... etc
```

### Step 6: Update .gitignore
```bash
# Add new patterns
echo "tools/temp/*" >> .gitignore
echo "!tools/temp/.gitkeep" >> .gitignore
```

### Step 7: Create README files
```bash
# docs/README.md - Documentation index
# scripts/README.md - Scripts catalog
# tools/README.md - Developer tools guide
```

### Step 8: Test & Verify
```bash
npm run build
npm run lint
# Verify all imports still work
```

### Step 9: Commit & Push
```bash
git add -A
git commit -m "chore: Reorganize project structure for better maintainability"
git push origin cleanup/project-reorganization
```

---

## Post-Cleanup Checklist

- [ ] Root directory has <15 files
- [ ] All documentation in `/docs`
- [ ] Scripts categorized in `/scripts/{category}/`
- [ ] Tests organized in `/tests`
- [ ] Environment files cleaned up
- [ ] `.gitignore` updated
- [ ] README files in all major folders
- [ ] `npm run build` succeeds
- [ ] All imports working
- [ ] Git history preserved (check with `git log --follow`)

---

## Maintenance Going Forward

### Rules for Future Development

1. **Documentation:** Always goes in `/docs/{category}/`
2. **Scripts:** New scripts go in appropriate `/scripts/{category}/`
3. **Test Files:** One-off tests go in `tools/temp/` (gitignored)
4. **Environment Files:** Never commit multiple variants, use `.env.local.template`
5. **Root Directory:** Keep clean! Config files only.

---

**Status:** 📋 Ready to Execute
**Estimated Time:** 1-2 hours
**Impact:** Zero functionality changes, massive organization improvement
**Next Step:** Execute Phase 1 (Root Directory Cleanup)

**Last Updated:** 2025-11-04

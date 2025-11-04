# Project Organization

**Last Updated:** 2025-11-04  
**Status:** ✅ Organized

This document explains the new project structure after cleanup.

## 📁 Root Directory (Clean!)

```
receiptsort/
├── .env.local              # Local development environment (gitignored)
├── .gitignore              # Git ignore patterns
├── .eslintrc.json          # ESLint configuration
├── components.json         # shadcn/ui configuration
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies
├── tailwind.config.ts      # Tailwind CSS config
├── tsconfig.json           # TypeScript config
├── vercel.json             # Vercel deployment config
└── README.md               # Main project README
```

**Rule:** Only configuration files in root. Everything else organized into folders.

## 📚 Documentation (`/docs/`)

All documentation consolidated here:

```
docs/
├── development/           # Dev notes (session logs)
├── features/              # Feature implementation guides
├── setup/                 # Setup & configuration
├── stripe-setup/          # Payment integration
├── marketing/             # Marketing strategy
├── landing-page/          # Landing page updates
├── archive/               # Deprecated docs
└── README.md              # Documentation index
```

## 🔧 Scripts (`/scripts/`)

Categorized utility scripts:

```
scripts/
├── admin/                 # User & receipt management
├── database/              # Migrations & cleanup
├── debugging/             # Debugging tools
├── deployment/            # Env setup & deployment
├── i18n/                  # Translation utilities
├── stripe/                # Payment testing
├── templates/             # Template testing
├── testing/               # Test utilities (consolidated)
├── storage/               # Supabase storage
├── legacy/                # Archived scripts
└── README.md              # Scripts catalog
```

## 🧪 Tests (`/tests/`)

Organized testing structure:

```
tests/
├── fixtures/              # Test data & receipts
├── integration/           # Integration tests
├── troubleshooting/       # Debugging guides
└── README.md              # Testing documentation
```

## 🛠️ Tools (`/tools/`)

Developer utilities:

```
tools/
├── env/                   # Environment templates
│   ├── .env.local.template
│   ├── .env.production (reference)
│   └── README.md
├── temp/                  # Temporary scripts (gitignored)
│   └── .gitkeep
└── README.md
```

## 💻 Source Code (`/src/`)

No changes - follows Next.js conventions:

```
src/
├── app/                   # Next.js app directory
│   ├── [locale]/         # Internationalized routes
│   ├── api/              # API routes
│   └── actions/          # Server actions
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── dashboard/       # Dashboard components
│   ├── landing/         # Landing page components
│   └── shared/          # Shared components
├── lib/                  # Utility libraries
├── hooks/                # React hooks
├── types/                # TypeScript types
└── i18n/                # Internationalization
```

## 🗄️ Database (`/supabase/`)

Database migrations and configuration:

```
supabase/
└── migrations/           # SQL migration files
```

## 🌍 Translations (`/messages/`)

i18n translation files:

```
messages/
├── en.json              # English
├── zh.json              # Chinese
├── nl.json              # Dutch
├── de.json              # German
├── fr.json              # French
├── es.json              # Spanish
└── ja.json              # Japanese
```

## 🎨 Public Assets (`/public/`)

Static files served from root:

```
public/
├── images/              # Images
├── icons/               # Icons
└── ...
```

## 📋 Finding Things

### "Where do I put...?"

| What | Where | Example |
|------|-------|---------|
| Development notes | `docs/development/` | Dev_note_05.md |
| Feature guide | `docs/features/` | NEW_FEATURE.md |
| Setup guide | `docs/setup/` | DEPLOYMENT.md |
| Admin script | `scripts/admin/` | manage-users.mjs |
| Test script | `scripts/testing/` | test-new-feature.mjs |
| Debugging script | `scripts/debugging/` | debug-issue.mjs |
| Test data | `tests/fixtures/` | sample-receipts/ |
| Temp experiment | `tools/temp/` | quick-test.mjs |
| Env template | `tools/env/` | .env.example |

### "Where is...?"

| Looking for | Location |
|-------------|----------|
| Dev notes | `docs/development/Dev_note_*.md` |
| AI template roadmap | `docs/development/Dev_note_04_AI_Template_Roadmap.md` |
| Template testing | `scripts/templates/` |
| Payment testing | `scripts/stripe/` |
| Translation scripts | `scripts/i18n/` |
| Test utilities | `scripts/testing/` |
| Environment templates | `tools/env/` |

## 🔄 Maintenance Rules

### Adding New Files

1. **Documentation** → `docs/{category}/filename.md`
2. **Scripts** → `scripts/{category}/filename.mjs`
3. **Test Data** → `tests/fixtures/`
4. **Temp Scripts** → `tools/temp/` (gitignored)

### Cleanup Schedule

- **Weekly**: Review `tools/temp/` and delete old experiments
- **Monthly**: Archive old docs to `docs/archive/`
- **Quarterly**: Review `scripts/legacy/` and delete if unused

### What NOT to Do

- ❌ Don't put files in root (except configs)
- ❌ Don't commit to `tools/temp/` (it's gitignored)
- ❌ Don't commit real `.env` values
- ❌ Don't duplicate files across folders

## ✅ Benefits of New Structure

| Before | After |
|--------|-------|
| 20+ files in root | ~10 config files only |
| Scattered docs | All in `/docs/` |
| Mixed scripts | Categorized in `/scripts/{category}/` |
| 11 env files | 1 active + templates in `/tools/env/` |
| Unclear organization | Clear, documented structure |

## 📝 Related Documents

- **Cleanup Plan**: `PROJECT_CLEANUP_PLAN.md` (detailed execution plan)
- **Project Structure**: `docs/setup/PROJECT_STRUCTURE.md` (architecture)
- **Scripts Catalog**: `scripts/README.md`
- **Documentation Index**: `docs/README.md`

---

**Questions?** Check the README in each folder for more details.

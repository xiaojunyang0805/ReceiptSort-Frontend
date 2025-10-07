# Internationalization (i18n) Implementation Guide

## ✅ What Has Been Completed

### 1. Core Setup
- ✅ Installed `next-intl` package
- ✅ Created i18n configuration (`src/i18n/config.ts`, `src/i18n/request.ts`)
- ✅ Set up middleware with combined i18n and auth handling
- ✅ Updated `next.config.mjs` to use next-intl plugin
- ✅ Created `[locale]` directory structure

### 2. Translation Files
Complete translation files have been created for all 6 languages in `/messages/`:
- ✅ `en.json` - English (default)
- ✅ `nl.json` - Dutch
- ✅ `de.json` - German
- ✅ `fr.json` - French
- ✅ `es.json` - Spanish
- ✅ `ja.json` - Japanese

### 3. Components
- ✅ Created LanguageSwitcher component
- ✅ Updated Navbar with translations and language switcher
- ✅ Created locale-aware navigation utilities (`src/lib/navigation.ts`)

### 4. Layouts
- ✅ Updated root layout for locale support
- ✅ Created `[locale]/layout.tsx` with NextIntlClientProvider
- ✅ Created `[locale]/page.tsx` (home page)

---

## 🚧 What Needs to Be Completed

### Step 1: Move All Routes to [locale] Directory

You need to move these directories from `src/app/` to `src/app/[locale]/`:

```bash
# Currently in src/app/:
- (auth)/          → Move to src/app/[locale]/(auth)/
- (dashboard)/     → Move to src/app/[locale]/(dashboard)/
- pricing/         → Move to src/app/[locale]/pricing/
- privacy/         → Move to src/app/[locale]/privacy/
- terms/           → Move to src/app/[locale]/terms/
- contact/         → Move to src/app/[locale]/contact/
```

**To move these on Windows:**

Option 1 - Using File Explorer:
1. Open File Explorer and navigate to `D:\receiptsort\src\app\`
2. Select each folder and cut (Ctrl+X)
3. Navigate to `D:\receiptsort\src\app\[locale]\`
4. Paste (Ctrl+V)

Option 2 - Using PowerShell:
```powershell
Move-Item "D:\receiptsort\src\app\(auth)" "D:\receiptsort\src\app\[locale]\(auth)"
Move-Item "D:\receiptsort\src\app\(dashboard)" "D:\receiptsort\src\app\[locale]\(dashboard)"
Move-Item "D:\receiptsort\src\app\pricing" "D:\receiptsort\src\app\[locale]\pricing"
Move-Item "D:\receiptsort\src\app\privacy" "D:\receiptsort\src\app\[locale]\privacy"
Move-Item "D:\receiptsort\src\app\terms" "D:\receiptsort\src\app\[locale]\terms"
Move-Item "D:\receiptsort\src\app\contact" "D:\receiptsort\src\app\[locale]\contact"
```

### Step 2: Update All Components to Use Translations

#### Pattern 1: Client Components
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/navigation'  // Use this instead of next/link

export function MyComponent() {
  const t = useTranslations('namespace')  // e.g., 'hero', 'features', etc.

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <Link href="/signup">{t('button')}</Link>
    </div>
  )
}
```

#### Pattern 2: Server Components
```tsx
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/navigation'

export default function MyPage() {
  const t = useTranslations('namespace')

  return (
    <div>
      <h1>{t('title')}</h1>
      <Link href="/pricing">{t('link')}</Link>
    </div>
  )
}
```

#### Pattern 3: Components with Async Translations (for metadata)
```tsx
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'page' })

  return {
    title: t('title'),
    description: t('description'),
  }
}
```

### Step 3: Update Specific Components

#### Landing Page Components to Update:

1. **Hero.tsx** (`src/components/landing/Hero.tsx`)
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/navigation'

export function Hero() {
  const t = useTranslations('hero')

  return (
    // Replace hardcoded text with:
    <h1>{t('headline')}</h1>
    <p>{t('subheadline')}</p>
    // etc.
  )
}
```

2. **Features.tsx** - Use `t('features.title')`, `t('features.items.upload.title')`, etc.
3. **HowItWorks.tsx** - Use `t('howItWorks.title')`, `t('howItWorks.steps.upload.title')`, etc.
4. **FAQ.tsx** - Use `t('faq.title')`, etc.
5. **FinalCTA.tsx** - Use `t('finalCTA.title')`, etc.
6. **Footer.tsx** - Use `t('footer.description')`, etc.

#### Dashboard Components to Update:

All components in `src/components/dashboard/` need similar updates using the `dashboard` namespace:
- `ReceiptUpload.tsx` → `t('dashboard.uploadSection.*')`
- `ReceiptList.tsx` → `t('dashboard.receiptsTable.*')`
- `CreditPackages.tsx` → `t('dashboard.credits.*')`
- etc.

#### Auth Components to Update:

- `AuthForm.tsx` → Use `t('auth.loginTitle')`, `t('auth.email')`, etc.

### Step 4: Update All Link Imports

Find and replace across your codebase:

**Before:**
```tsx
import Link from 'next/link'
```

**After:**
```tsx
import { Link } from '@/lib/navigation'
```

This ensures all internal links preserve the locale in the URL.

### Step 5: Delete Old Files

After moving routes to `[locale]`, delete the old `src/app/page.tsx` file (the one NOT in [locale]).

### Step 6: Test the Implementation

1. **Start the dev server:**
```bash
npm run dev
```

2. **Test each language:**
- Visit `http://localhost:3000` (should default to English)
- Visit `http://localhost:3000/nl` (Dutch)
- Visit `http://localhost:3000/de` (German)
- Visit `http://localhost:3000/fr` (French)
- Visit `http://localhost:3000/es` (Spanish)
- Visit `http://localhost:3000/ja` (Japanese)

3. **Test the language switcher:**
- Click the globe icon in the navbar
- Select different languages
- Verify navigation preserves the selected language

4. **Test authentication flow:**
- Try logging in with different languages active
- Ensure redirects preserve the locale

5. **Test dashboard routes:**
- Navigate to dashboard pages in different languages
- Verify all text is translated

---

## 📚 Translation File Structure

All translations are in `/messages/{locale}.json` with this structure:

```json
{
  "common": { /* Shared UI elements */ },
  "hero": { /* Landing page hero section */ },
  "features": { /* Features section */ },
  "howItWorks": { /* How it works section */ },
  "socialProof": { /* Social proof section */ },
  "faq": { /* FAQ section */ },
  "finalCTA": { /* Final CTA section */ },
  "auth": { /* Authentication pages */ },
  "dashboard": { /* Dashboard sections */ },
  "pricing": { /* Pricing page */ },
  "footer": { /* Footer */ },
  "navigation": { /* Navigation links */ }
}
```

To use nested translations:
```tsx
t('features.items.upload.title')  // "Upload from Any Device"
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot find module '@/lib/navigation'"
**Solution:** Make sure you created `src/lib/navigation.ts` (already done)

### Issue 2: Translation key not found
**Solution:** Check the JSON path matches exactly. It's case-sensitive.

### Issue 3: Links break when switching languages
**Solution:** Use `import { Link } from '@/lib/navigation'` instead of `next/link`

### Issue 4: Middleware conflicts
**Solution:** Already handled - middleware chains i18n → auth

### Issue 5: API routes not working
**Solution:** API routes should stay in `src/app/api/`, NOT moved to `[locale]/api/`

---

## 🌍 Adding More Translations Later

To add a new language:

1. Add the locale code to `src/i18n/config.ts`:
```typescript
export const locales = ['en', 'nl', 'de', 'fr', 'es', 'ja', 'it'] as const;
```

2. Add the locale name:
```typescript
export const localeNames: Record<Locale, string> = {
  // ... existing
  it: 'Italiano',
};
```

3. Create `messages/it.json` by copying `messages/en.json` and translating

4. Update middleware matcher if needed (in `src/middleware.ts`)

---

## 📝 Quick Reference

### Import Statements
```tsx
// For client components
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

// For server components
import { getTranslations } from 'next-intl/server'

// For navigation
import { Link, useRouter, usePathname } from '@/lib/navigation'
```

### Usage Examples
```tsx
// Basic translation
const t = useTranslations('namespace')
t('key')

// With variables
t('welcome', { name: 'John' })
// In JSON: "welcome": "Hello {name}!"

// Rich text (with HTML)
t.rich('description', {
  b: (chunks) => <strong>{chunks}</strong>
})
```

---

## 🚀 Ready to Launch

Before deploying:
1. ✅ All components use translations
2. ✅ All Links use locale-aware navigation
3. ✅ Test all languages work
4. ✅ Test auth flow in multiple languages
5. ✅ Update environment variables if needed
6. ✅ Test production build: `npm run build`

---

## 💡 Pro Tips

1. **SEO:** Add locale alternates in metadata for each page
2. **Performance:** Translations are automatically code-split by next-intl
3. **Browser Language:** Middleware auto-detects and redirects based on `Accept-Language` header
4. **URL Strategy:** Using `localePrefix: 'as-needed'` means English (default) URLs stay clean (`/pricing`), while other languages have prefix (`/de/pricing`)

---

## Need Help?

- next-intl docs: https://next-intl-docs.vercel.app/
- Your translation files: `/messages/*.json`
- Your i18n config: `src/i18n/config.ts`

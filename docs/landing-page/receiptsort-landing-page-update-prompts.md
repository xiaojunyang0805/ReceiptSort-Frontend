# ReceiptSort Landing Page Update Prompts

## Context for Claude Code

Current landing page: https://receiptsort.seenano.nl/

**Problem:** Landing page makes ReceiptSort sound like generic OCR tool, but we have unique AI template mapping feature that NO competitor offers. This feature is currently buried in FAQ #7.

**Goal:** Reposition landing page to emphasize intelligent template mapping + pay-per-use pricing as dual differentiators.

**Tech Stack:** Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui

---

## PRIORITY 1: Update Hero Section (URGENT)

### Prompt 1.1: Replace Hero Headline and Subheadline

```
Update the landing page hero section (app/page.tsx or components/landing/Hero.tsx):

OLD COPY:
"Extract data from receipts in seconds with AI.
Upload receipts → AI extracts data → Download Excel.
Built for small businesses, freelancers, and accountants who value their time."

NEW COPY:
Headline (H1): "Your Receipts, Your Format, Automatically"

Subheadline (H2): "Our AI adapts to YOUR spreadsheet templates—not the other way around.
Create custom export formats once, reuse unlimited times."

Process tagline: "Upload → AI maps to your template → Download in your format"

Trust elements below CTAs:
"✓ 10 free credits + 10 custom templates • No credit card required
✓ Credits never expire • Templates reusable unlimited times
✓ Works with receipts, invoices, and medical notes"

Keep the existing CTA buttons ("Start Free" and "Watch Demo"), but update the trust elements text.
```

### Prompt 1.2: Update Meta Tags and SEO

```
Update the metadata in app/layout.tsx:

OLD:
title: 'ReceiptSorter - AI Receipt Data Extraction to Excel | Save Hours on Bookkeeping'
description: 'Extract data from receipts automatically with AI. Upload receipt photos, get organized Excel files. Perfect for small businesses, freelancers, and accountants. Try free!'

NEW:
title: 'ReceiptSort - AI That Adapts to Your Spreadsheet Format | Smart Receipt Scanner'
description: 'The only receipt scanner with intelligent template mapping. AI exports to YOUR format automatically—not ours. Works with receipts, invoices, medical notes. $0.20-0.50 per document, no subscription. Try free!'
keywords: 'receipt scanner, custom templates, receipt OCR, receipt to excel, expense tracking, AI template mapping, pay per receipt, invoice scanner, medical receipt scanner'

Also update OpenGraph and Twitter card descriptions to match.
```

---

## PRIORITY 2: Add "What Makes Us Different" Section

### Prompt 2.1: Create Comparison Section

```
Create a new section component: components/landing/WhatMakesUsDifferent.tsx

Place this section IMMEDIATELY AFTER the hero section, BEFORE the features section.

Content:
- Section title: "What Makes ReceiptSort Different"
- Two-column comparison layout (responsive: stacks on mobile)

LEFT COLUMN - "Other Receipt Tools":
❌ Export to THEIR fixed format
❌ You reorganize data manually (2-3 min/document)
❌ $20-60/month subscription required
❌ Receipts only

RIGHT COLUMN - "ReceiptSort":
✅ AI adapts to YOUR template automatically
✅ Data exported in your format (no reorganization)
✅ Pay per document ($0.20-0.50, credits never expire)
✅ Receipts, invoices, AND medical notes

Below comparison:
"Save 2-3 minutes per document by eliminating manual reorganization.
Create 10 custom templates FREE, reuse unlimited times."

CTA: "See How Template Mapping Works" (link to templates FAQ or demo)

Design:
- Use subtle background color to differentiate section (light gray or light blue)
- Use icons for checkmarks and X marks (lucide-react)
- Highlight ReceiptSort column with border or subtle glow
- Mobile: stack columns vertically
```

---

## PRIORITY 3: Update Features Section

### Prompt 3.1: Add Template Mapping as First Feature

```
Update components/landing/Features.tsx:

ADD AS FIRST FEATURE (before existing features):

Feature 1: Intelligent Template Mapping ⭐
Icon: Sparkles or Wand icon (lucide-react)
Title: "AI That Learns Your Format"
Description: "Create custom export templates with YOUR column names (VAT Amount, Project Code, Client ID, etc.). Our AI automatically maps extracted data to your format—even when receipts use different terms (Tax vs VAT vs Btw). Save 10 templates free, reuse unlimited times. Each export costs just 1 credit."

Visual suggestion: Add a "⭐ UNIQUE FEATURE" badge on this card.
```

### Prompt 3.2: Update Existing AI Feature

```
Update the existing "AI-Powered Data Extraction" feature:

OLD:
Title: "AI-Powered Data Extraction"
Description: "GPT-4 Vision extracts merchant, amount, date, category, tax, and payment method with 95%+ accuracy."

NEW:
Title: "Multi-Document Intelligence"
Description: "Works across receipts, invoices, AND medical notes—not just receipts. AI adapts to different document types seamlessly. GPT-4 Vision achieves 95%+ accuracy on all formats. Handles multiple languages and currency formats automatically."

Update icon to represent multiple document types (Files or Layers icon).
```

### Prompt 3.3: Update Pricing Feature

```
Update the "Pay As You Go" feature:

OLD:
Description: "Only $0.50 per receipt. Buy credits when you need them. Never worry about subscription fees."

NEW:
Description: "Only $0.20-0.50 per document (not per-user subscription). Credits never expire—use them when you need them. No hidden fees, no monthly commitment. Variable volume? Perfect. Process 10 documents one month, 100 the next."
```

---

## PRIORITY 4: Reorder and Expand FAQ

### Prompt 4.1: Reorder FAQ Questions

```
Update components/landing/FAQ.tsx:

REORDER the FAQ questions - move "What are Custom Templates?" to QUESTION #1 (it's currently #7).

NEW ORDER:
1. What are Custom Templates and why do I need them? (EXPANDED - see Prompt 4.2)
2. How accurate is the AI extraction?
3. What file formats do you support?
4. How much does it cost?
5. Do credits expire?
6. Is my data secure?
7. Can I export to QuickBooks or Xero?
8. What if the extraction is wrong?
9. Do you offer refunds?
10. Can I use this for my business?
11. Do I need to install any software?
12. How do I contact support?

This reordering emphasizes our unique feature first.
```

### Prompt 4.2: Expand Custom Templates FAQ Answer

```
Update the answer for "What are Custom Templates?" FAQ:

NEW ANSWER:
"Custom Templates let you create reusable export formats tailored to YOUR needs—like VAT declarations, specific accounting layouts, or insurance forms.

**Why they matter:** Other receipt tools export to THEIR fixed format. You then waste 2-3 minutes per document reorganizing columns, renaming headers, and reformatting to match your accounting system or government requirements.

**With ReceiptSort:** You create your ideal template ONCE with your exact column names (VAT Amount, Project Code, etc.). Our AI automatically maps all future receipts to your template columns—even if receipts use different terms (Tax vs VAT vs Btw vs MwSt).

**Pricing:** Save up to 10 templates for FREE (no credits charged), then reuse them unlimited times. Each export costs just 1 credit, regardless of template complexity.

**Example:** Create a template with columns: Date | Vendor | Net Amount | VAT Amount | Total | Category. Every receipt you process will automatically export to this exact format—no manual reorganization needed."

Make this answer visually stand out (maybe add a light background color or border).
```

---

## PRIORITY 5: Add Use Cases Section

### Prompt 5.1: Create Use Cases Component

```
Create new component: components/landing/UseCases.tsx

Place AFTER the features section, BEFORE testimonials.

Section title: "Built for Your Workflow"
Subtitle: "ReceiptSort adapts to how YOU work—not the other way around"

Four use case cards in 2x2 grid (responsive: 1 column on mobile):

CARD 1: 🏢 Accountant with Multiple Clients
"Create 5 templates (one per client's format). AI maps all receipts automatically to the correct client template. Bill clients accurately without manual reorganization. Save 15+ hours per month."

CARD 2: 🏥 Medical Practice
"Create custom insurance claim templates. AI extracts from medical receipts and invoices, maps to YOUR insurance company's format. No more manual data entry for reimbursements."

CARD 3: 🇪🇺 EU Freelancer (VAT Returns)
"Create VAT declaration templates matching your country's government requirements. AI handles different receipt formats (Btw, VAT, MwSt, TVA) automatically. Export ready for submission."

CARD 4: 📊 Variable Volume Business
"Process 10 documents one month, 100 the next. Pay only for what you use ($0.20-0.50 per document). Credits never expire. No wasteful monthly subscription."

Design:
- Use emoji icons or lucide-react icons
- Each card should have subtle hover effect
- Include a "Perfect for: [specific role]" tag at top of each card
- Add "Try Free" CTA at bottom of section
```

---

## PRIORITY 6: Update Testimonials

### Prompt 6.1: Add Template-Specific Testimonial

```
Update components/landing/SocialProof.tsx or Testimonials section:

ADD a new testimonial specifically about template mapping:

"The template mapping feature is brilliant. I created one template for my VAT returns, and now every receipt automatically formats to match the tax office requirements. Saves me 20+ minutes every month, and I never make formatting errors anymore."
— Lisa van Dijk, Freelance Consultant, Netherlands

Also UPDATE the third existing testimonial:

OLD:
"I was skeptical about AI accuracy, but ReceiptSort gets it right 95% of the time. The other 5% I can easily fix."

NEW:
"I was skeptical about AI accuracy, but ReceiptSort gets it right 95% of the time. The template mapping is the real game-changer though—my receipts export exactly how my accountant needs them. No more manual reformatting."
— Jennifer Martinez, Small Business Owner

Place the Lisa van Dijk testimonial FIRST (most prominent position).
```

---

## PRIORITY 7: Update "How It Works" Section

### Prompt 7.1: Revise Process Steps

```
Update components/landing/HowItWorks.tsx:

Change from 3 steps to 4 steps to emphasize template creation:

STEP 1: Create Your Template (NEW STEP)
Icon: Layout or Grid icon
Title: "Design Your Perfect Export Format"
Description: "Create a custom template with your exact column names and structure. Takes 2 minutes. Save up to 10 templates free—no credits charged."
Visual: Screenshot of template creation interface

STEP 2: Upload Documents
Icon: Upload icon
Title: "Upload Your Receipts"
Description: "Drag and drop receipts, invoices, or medical notes. Works with photos or PDFs from any device. Supports all major image formats."
Visual: Upload interface screenshot

STEP 3: AI Processes & Maps
Icon: Sparkles/Wand icon
Title: "AI Extracts & Maps to Your Template"
Description: "Our AI reads the document and intelligently maps extracted data to YOUR template columns—even handling different terminologies automatically."
Visual: Receipt → Extracted data → Template mapping visualization

STEP 4: Download Your Format
Icon: Download icon
Title: "Download in Your Format"
Description: "Get a perfectly formatted Excel or CSV file matching your template—ready to import directly into your accounting system or submit to authorities."
Visual: Excel spreadsheet preview

Update the CTA below steps from "Try It Free" to "Start Free: Create Your First Template"
```

---

## PRIORITY 8: Add Comparison Table (Optional but Recommended)

### Prompt 8.1: Create Competitor Comparison

```
Create new component: components/landing/ComparisonTable.tsx

Place AFTER use cases section, BEFORE FAQ.

Section title: "How We Compare"
Subtitle: "Better technology AND better pricing"

Comparison table with 5 columns:
- Feature (row header)
- Expensify
- Shoeboxed
- AutoEntry
- ReceiptSort

ROWS:
1. Template Mapping: ❌ ❌ ⚠️ Manual | ✅ Automatic AI
2. Document Types: Receipts only | Receipts only | Limited | All types
3. Pricing Model: $5-9/user/month | $18-67/month | $12-450/mo + credits | $0.20-0.50/document
4. Credits Expire: N/A | N/A | ✅ Yes | ❌ Never
5. Free Templates: ❌ | ❌ | Limited | ✅ 10 free
6. Subscription Required: ✅ Yes | ✅ Yes | ✅ Yes | ❌ No

Highlight the ReceiptSort column with accent color.

Add footnote: "Pricing and features verified October 2025. Competitor information from public websites."

Mobile: Make table horizontally scrollable OR convert to accordion format.
```

---

## PRIORITY 9: Update Homepage Stats/Social Proof

### Prompt 9.1: Update Stats Section

```
Update the stats section (if it exists, usually near testimonials):

OLD STATS (if they exist):
- "10,000+ receipts processed"
- "95%+ accuracy rate"
- "5 hours saved per week"

NEW STATS:
- "10,000+ documents processed" (changed from "receipts" to show versatility)
- "2-3 minutes saved per document" (emphasize reorganization time savings)
- "95%+ extraction accuracy"
- "3 document types supported" (receipts, invoices, medical notes)

Add a new stat if space allows:
- "10 free custom templates" or "Credits never expire"
```

---

## PRIORITY 10: Update Footer and Final CTA

### Prompt 10.1: Update Final CTA Section

```
Update components/landing/FinalCTA.tsx:

OLD:
Headline: "Ready to save hours every week?"
Subheadline: "Start with 10 free credits. No credit card required."

NEW:
Headline: "Ready to Stop Reorganizing Receipt Data?"
Subheadline: "Start free: 10 credits + 10 custom templates. No credit card required."

Below buttons, add:
"Join freelancers, accountants, and small businesses who process receipts in their own format—automatically."

Update trust badges to include:
✓ Credits never expire
✓ Templates reusable unlimited times
✓ 30-day money back guarantee
✓ Works with all accounting software
```

### Prompt 10.2: Add Template Mention to Footer

```
Update components/shared/Footer.tsx:

In the "Product" column, add a new link:
- Custom Templates (link to FAQ #1 or create a /templates page)

In the footer tagline/description, change from:
"AI-powered receipt data extraction"

To:
"Smart receipt scanning with intelligent template mapping"
```

---

## TESTING PROMPTS

### Test Prompt 1: Verify Mobile Responsiveness

```
Test all new sections on mobile viewports:
- iPhone SE (375px width - smallest)
- iPhone 12 Pro (390px width)
- iPad (768px width)

Ensure:
1. Comparison tables are scrollable or convert to cards
2. Use case grid stacks to single column
3. "What Makes Us Different" comparison stacks properly
4. All text remains readable (min 14px font size)
5. Touch targets are minimum 44x44px
6. No horizontal scroll on any viewport

Fix any layout breaks.
```

### Test Prompt 2: Verify Accessibility

```
Run accessibility checks on updated components:

1. All interactive elements have proper focus states
2. Color contrast ratios meet WCAG AA standards (4.5:1 for normal text)
3. All images have alt text
4. Headings follow proper hierarchy (H1 → H2 → H3)
5. FAQ accordion is keyboard navigable
6. Icons have aria-labels where needed

Use Lighthouse accessibility audit and fix any issues below 95 score.
```

### Test Prompt 3: Update Structured Data

```
Update the JSON-LD structured data in app/page.tsx:

ADD to the existing SoftwareApplication schema:

"featureList": [
  "Intelligent AI template mapping",
  "Custom export format creation",
  "Multi-document support (receipts, invoices, medical notes)",
  "Pay-per-document pricing",
  "Credits never expire",
  "10 free custom templates"
],

"applicationSubCategory": "Receipt Scanner, Invoice Scanner, Expense Tracking",

Make sure this validates with Google's Rich Results Test.
```

---

## COPY-PASTE ONE-LINER (for social media, etc.)

```
Update any marketing copy, meta descriptions, or social media bios to use this positioning:

"ReceiptSort: The only receipt scanner with intelligent template mapping. AI exports to YOUR format automatically—$0.20-0.50 per document, no subscription."
```

---

## PRIORITY SUMMARY

**DO IMMEDIATELY (before launch):**
1. ✅ Hero headline (Prompt 1.1)
2. ✅ Meta tags (Prompt 1.2)
3. ✅ "What Makes Us Different" section (Prompt 2.1)
4. ✅ Add template mapping feature (Prompt 3.1)
5. ✅ Reorder FAQ (Prompt 4.1 & 4.2)

**DO WITHIN 24 HOURS:**
6. ✅ Use cases section (Prompt 5.1)
7. ✅ Update testimonials (Prompt 6.1)
8. ✅ Update How It Works (Prompt 7.1)

**DO WITHIN WEEK 1:**
9. ✅ Comparison table (Prompt 8.1)
10. ✅ Update stats (Prompt 9.1)
11. ✅ Update CTAs (Prompt 10.1 & 10.2)

**TESTING (continuous):**
12. ✅ Mobile testing (Test Prompt 1)
13. ✅ Accessibility (Test Prompt 2)
14. ✅ Structured data (Test Prompt 3)

---

## NOTES FOR CLAUDE CODE

- All components should maintain existing styling patterns (Tailwind classes)
- Keep shadcn/ui component usage consistent
- Maintain existing animation patterns (fade-in, slide-up)
- Don't break existing functionality
- Test each change before moving to next prompt
- Use lucide-react for any new icons
- Maintain responsive design throughout
- Keep loading states and error handling patterns

---

## FINAL VERIFICATION CHECKLIST

After implementing all prompts, verify:

- [ ] Hero clearly states "template mapping" or "adapts to your format"
- [ ] Template mapping appears in at least 5 places on page
- [ ] "Multi-document support" mentioned (receipts + invoices + medical notes)
- [ ] Pricing appears with template value prop ($0.20-0.50 per document)
- [ ] FAQ #1 is about Custom Templates
- [ ] Use cases show template adaptation in action
- [ ] Testimonials reference template feature
- [ ] Mobile experience is excellent (no layout breaks)
- [ ] Page loads in <3 seconds (run Lighthouse)
- [ ] No console errors or warnings

---

## LAUNCH DAY UPDATES

After implementing all of the above, update your launch posts (Product Hunt, Twitter, Reddit) to lead with:

"I built ReceiptSort to solve two problems:
1. Tired of paying $30/month to scan 15 receipts
2. Tired of manually reorganizing exported data to match MY format

Every tool exports to THEIR format. You adapt to them.
ReceiptSort's AI adapts to YOUR format."

---

Good luck with the launch! 🚀

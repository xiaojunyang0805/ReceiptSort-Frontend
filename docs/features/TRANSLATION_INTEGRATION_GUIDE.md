# Translation Integration Guide for Custom Templates Feature

## Overview
This guide shows exactly where to add template translations in all three language files.

---

## 1. messages/en.json

### Location 1: Add to `dashboard.credits` section (after subscriptions, before exports)

Find the line with `"subscriptions": {` and add this AFTER the subscriptions closing brace:

```json
"templates": {
  "title": "Custom Export Templates",
  "description": "Create reusable templates for VAT declarations, accounting, and more",
  "cost": "Cost per template",
  "credits": "credits",
  "maxTemplates": "Maximum templates",
  "exportCost": "Export with template",
  "free": "FREE",
  "perfectFor": "Perfect for:",
  "useCase1": "VAT declarations and tax reporting",
  "useCase2": "Custom accounting formats",
  "useCase3": "Multi-country compliance",
  "useCase4": "Automated workflows",
  "manageButton": "Manage Templates"
},
```

### Location 2: Add new `dashboard.templates` section (after exports section)

Add this as a new top-level section under `dashboard`:

```json
"templates": {
  "pageTitle": "Export Templates - ReceiptSort",
  "pageDescription": "Manage your custom export templates for receipts",
  "title": "Export Templates",
  "description": "Create custom templates to export receipts in your preferred format",
  "quota": {
    "title": "Template Quota",
    "description": "Your template usage",
    "remaining": "{count, plural, =0 {No templates remaining} one {1 template remaining} other {{count} templates remaining}}",
    "limitReached": "You've reached the maximum number of templates. Delete unused templates to create new ones."
  },
  "createButton": "Create New Template",
  "noTemplates": "No templates created yet",
  "noTemplatesDescription": "Create your first template to export receipts in custom formats like VAT declarations",
  "createFirstTemplate": "Create Your First Template",
  "exportCount": "Times used",
  "fieldsMapped": "Fields mapped",
  "created": "Created",
  "lastUsed": "Last used",
  "deleteSuccess": "Template deleted successfully",
  "info": {
    "title": "How Custom Templates Work",
    "point1": "Pay {credits} credits once to create a template",
    "point2": "Export unlimited times for FREE",
    "point3": "Perfect for VAT declarations and accounting",
    "point4": "Map receipt fields to your template columns"
  },
  "deleteDialog": {
    "title": "Delete Template?",
    "description": "Are you sure you want to delete \"{name}\"? This action cannot be undone.",
    "warning": "Note: No credits will be refunded for deleted templates.",
    "deleting": "Deleting..."
  },
  "errors": {
    "fetchFailed": "Failed to load templates",
    "deleteFailed": "Failed to delete template"
  },
  "uploadDialog": {
    "title": "Create Export Template",
    "description": "Upload your Excel template and configure field mapping",
    "steps": {
      "upload": "Upload",
      "configure": "Configure",
      "confirm": "Confirm"
    },
    "uploading": "Uploading template...",
    "clickToUpload": "Click to upload template file",
    "fileTypes": "Excel files (.xlsx, .xls)",
    "maxSize": "Max file size: {size}MB",
    "uploadHint": "Upload your VAT declaration form, accounting template, or any Excel file you want to populate with receipt data",
    "uploadSuccess": "Template uploaded successfully",
    "uploadError": "Failed to upload template",
    "fields": {
      "name": "Template Name",
      "description": "Description (optional)",
      "sheetName": "Sheet Name",
      "startRow": "Start Row",
      "mapping": "Field Mapping"
    },
    "placeholders": {
      "name": "e.g., VAT Declaration Q4 2025",
      "description": "e.g., Quarterly VAT report for Netherlands"
    },
    "mappingHint": "Enter the column letter (A, B, C, etc.) for each field you want to include",
    "fieldsMapped": "fields mapped",
    "next": "Next",
    "confirm": {
      "title": "Confirm Template Creation",
      "creditCharge": "This will charge {credits} credits",
      "balance": "Your balance: {balance} credits",
      "insufficientCredits": "Insufficient credits. Please purchase more credits.",
      "benefits": "What you get:",
      "benefit1": "Unlimited exports with this template (FREE)",
      "benefit2": "Auto-populate your Excel forms",
      "benefit3": "Edit and update mapping anytime",
      "saving": "Creating template...",
      "createTemplate": "Create Template"
    },
    "errors": {
      "nameRequired": "Template name is required",
      "mappingRequired": "At least one field mapping is required"
    },
    "saveSuccess": "{credits} credits charged. Template created!",
    "saveError": "Failed to create template"
  }
}
```

---

## 2. messages/nl.json

Follow the same structure as English, but use these Dutch translations:

### In `dashboard.credits`:

```json
"templates": {
  "title": "Aangepaste Export Sjablonen",
  "description": "Maak herbruikbare sjablonen voor BTW-aangiften, boekhouding en meer",
  "cost": "Kosten per sjabloon",
  "credits": "credits",
  "maxTemplates": "Maximum sjablonen",
  "exportCost": "Exporteren met sjabloon",
  "free": "GRATIS",
  "perfectFor": "Perfect voor:",
  "useCase1": "BTW-aangiften en belastingrapportage",
  "useCase2": "Aangepaste boekhoudformaten",
  "useCase3": "Multi-land naleving",
  "useCase4": "Geautomatiseerde workflows",
  "manageButton": "Sjablonen Beheren"
}
```

### New `dashboard.templates` section:
(See TEMPLATE_TRANSLATIONS.json for full Dutch translation)

---

## 3. messages/zh.json

Follow the same structure, Chinese translations:

### In `dashboard.credits`:

```json
"templates": {
  "title": "自定义导出模板",
  "description": "创建可重复使用的模板用于增值税申报、会计等",
  "cost": "每个模板费用",
  "credits": "积分",
  "maxTemplates": "最大模板数",
  "exportCost": "使用模板导出",
  "free": "免费",
  "perfectFor": "适用于：",
  "useCase1": "增值税申报和税务报告",
  "useCase2": "自定义会计格式",
  "useCase3": "多国合规",
  "useCase4": "自动化工作流程",
  "manageButton": "管理模板"
}
```

### New `dashboard.templates` section:
(See TEMPLATE_TRANSLATIONS.json for full Chinese translation)

---

## Quick Implementation Steps

1. **Open each messages file** (en.json, nl.json, zh.json)

2. **Find `dashboard.credits.subscriptions`** and add `templates` section after it

3. **Find `dashboard.exports`** and add new `dashboard.templates` section after it

4. **Verify JSON syntax** - make sure commas are correct

5. **Test** - Load the app and check if translations appear

---

## Verification Checklist

- [ ] `dashboard.credits.templates.title` appears on Credits page
- [ ] `dashboard.templates.title` appears on Templates page
- [ ] Template upload dialog shows translated text
- [ ] All three languages (en, nl, zh) work correctly
- [ ] No JSON syntax errors

---

## Full Translations Reference

See `TEMPLATE_TRANSLATIONS.json` for complete translations in all three languages.

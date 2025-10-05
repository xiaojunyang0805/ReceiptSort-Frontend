# Export Functionality Testing Guide

## Overview

This guide covers testing the CSV and Excel export functionality with various data scenarios to ensure data integrity, performance, and compatibility across different applications.

## Test Scenarios

### 1. Basic Data Tests

#### Test 1.1: Single Receipt
- **Data**: 1 receipt with complete data
- **Expected**: Clean export with all fields populated
- **Verify**: Opens correctly in all applications

#### Test 1.2: Special Characters
- **Data**: Merchant names with: quotes, ampersands, Unicode (é, ñ, ü), emojis
- **Expected**: Characters display correctly, no encoding issues
- **Verify**:
  - "Test & Co." displays as "Test & Co."
  - Café displays as Café
  - 🎉 emoji renders or is safely stripped

#### Test 1.3: Null/Missing Fields
- **Data**: Receipts with null category, tax, payment method, notes
- **Expected**: Empty cells in CSV, blank cells in Excel
- **Verify**: No errors, "null" or "undefined" text

#### Test 1.4: Different Currencies
- **Data**: USD, EUR, GBP, JPY receipts
- **Expected**: Currency codes preserved
- **Verify**:
  - $100.00 (USD)
  - €85.50 (EUR)
  - £75.25 (GBP)
  - ¥10000 (JPY)

### 2. Volume Tests

#### Test 2.1: 10 Receipts
- **Expected Time**: <1 second
- **File Size**:
  - CSV: ~1-2 KB
  - Excel: ~15-20 KB

#### Test 2.2: 100 Receipts
- **Expected Time**: <5 seconds
- **File Size**:
  - CSV: ~10-15 KB
  - Excel: ~150-200 KB

#### Test 2.3: 1000 Receipts (Max Limit)
- **Expected Time**: <10 seconds
- **File Size**:
  - CSV: ~100-150 KB
  - Excel: ~1-2 MB

#### Test 2.4: Over 1000 Receipts
- **Expected**: Error message
- **Verify**: "Export limit exceeded. Maximum 1000 receipts per export."

### 3. Application Compatibility Tests

#### CSV Export Compatibility

**Microsoft Excel (Desktop)**
- [ ] Opens without errors
- [ ] Special characters display correctly
- [ ] Dates recognized as dates (not text)
- [ ] Numbers formatted correctly
- [ ] Currency symbols preserved

**Google Sheets**
- [ ] Imports without errors
- [ ] Special characters display correctly
- [ ] Dates recognized as dates
- [ ] Numbers formatted correctly
- [ ] UTF-8 encoding preserved

**Apple Numbers (Mac)**
- [ ] Opens without errors
- [ ] Special characters display correctly
- [ ] Dates recognized as dates
- [ ] Numbers formatted correctly

**QuickBooks Import**
- [ ] CSV format accepted
- [ ] Date format recognized (MM/DD/YYYY)
- [ ] Amount format accepted
- [ ] Category mapping available

#### Excel Export Compatibility

**Microsoft Excel (Desktop)**
- [ ] Opens without errors
- [ ] Blue header with white text displays
- [ ] Alternating row colors visible
- [ ] Currency formatting ($#,##0.00) displays
- [ ] Date formatting (MM/DD/YYYY) displays
- [ ] SUM formulas calculate correctly
- [ ] Summary sheet displays
- [ ] Auto-filter works
- [ ] Header stays frozen when scrolling

**Google Sheets**
- [ ] Opens without errors
- [ ] Formatting preserved (colors, fonts)
- [ ] Formulas calculate correctly
- [ ] Summary sheet displays
- [ ] Auto-filter works

**Apple Numbers (Mac)**
- [ ] Opens without errors
- [ ] Basic formatting preserved
- [ ] Formulas calculate correctly
- [ ] Summary sheet displays

### 4. Data Integrity Tests

#### Test 4.1: No Data Loss
- **Method**: Export → Reimport → Compare
- **Verify**:
  - All receipts present
  - All amounts match
  - All dates match
  - All categories match

#### Test 4.2: Formula Accuracy
- **Verify Excel**:
  - Amount total = SUM(B2:Bn)
  - Tax total = SUM(F2:Fn)
  - Manual calculation matches formula
  - Summary stats accurate

#### Test 4.3: Date Display
- **CSV**: Check dates aren't converted to numbers (43XXX format)
- **Excel**: Check dates display as MM/DD/YYYY
- **Verify**: Date sorting works correctly

#### Test 4.4: Currency Symbols
- **Verify**:
  - $ symbol preserved for USD
  - € symbol preserved for EUR
  - £ symbol preserved for GBP
  - ¥ symbol preserved for JPY

### 5. Performance Benchmarks

| Receipt Count | CSV Time | Excel Time | CSV Size | Excel Size |
|--------------|----------|------------|----------|------------|
| 1            | <100ms   | <200ms     | ~200B    | ~15KB      |
| 10           | <500ms   | <1s        | ~2KB     | ~20KB      |
| 100          | <2s      | <5s        | ~15KB    | ~150KB     |
| 1000         | <8s      | <10s       | ~150KB   | ~1.5MB     |

**Performance Requirements:**
- ✅ 100 receipts: <5 seconds
- ✅ 1000 receipts: <10 seconds
- ✅ No memory issues
- ✅ No timeout errors

### 6. Filter & Export Tests

#### Test 6.1: Date Range Export
- **Filter**: Last Month
- **Verify**: Only receipts from last month included

#### Test 6.2: Category Filter Export
- **Filter**: Food & Dining only
- **Verify**: Only Food & Dining receipts included

#### Test 6.3: Status Filter Export
- **Filter**: Completed only
- **Verify**: Only completed receipts included

#### Test 6.4: Combined Filters
- **Filter**: This Year + Shopping + Amount >$50
- **Verify**: All conditions met in exported data

### 7. Preset Export Tests

#### Test 7.1: This Month
- **Verify**: Receipts from current month only

#### Test 7.2: Q1/Q2/Q3/Q4
- **Verify**: Receipts from correct quarter

#### Test 7.3: This Year
- **Verify**: Receipts from January 1 to December 31

#### Test 7.4: All Time
- **Verify**: All completed receipts included

## Running Automated Tests

### Setup
```bash
# Install dependencies
npm install

# Set environment variables
export TEST_USER_ID="your-user-id"
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"
```

### Run Test Script
```bash
# Start dev server
npm run dev

# In another terminal, run tests
npx tsx scripts/test-export.ts
```

### Check Results
```bash
# View generated files
ls test-exports/

# Open files for manual verification
open test-exports/test-export-*.csv
open test-exports/test-export-*.xlsx
```

## Manual Testing Checklist

### Pre-Export
- [ ] Upload at least 100 test receipts
- [ ] Process receipts (ensure 'completed' status)
- [ ] Verify receipts have diverse data (dates, amounts, categories)

### During Export
- [ ] Select receipts with checkboxes
- [ ] Apply various filters
- [ ] Use export presets
- [ ] Choose CSV format
- [ ] Choose Excel format
- [ ] Test large exports (>50 receipts warning)
- [ ] Test max limit (1000 receipt error)

### Post-Export
- [ ] Open CSV in Excel
- [ ] Open CSV in Google Sheets
- [ ] Open CSV in Numbers
- [ ] Open Excel in Excel
- [ ] Open Excel in Google Sheets
- [ ] Open Excel in Numbers
- [ ] Verify all data integrity checks
- [ ] Check export history page

## Known Limitations

1. **Max Export**: 1000 receipts per export
2. **Special Characters**: Emojis may not display in all apps
3. **Date Format**: CSV dates are text (MM/DD/YYYY)
4. **Currency**: Excel currency format is USD-centric ($)
5. **Performance**: Large exports (>500) may take 5-10 seconds

## Troubleshooting

### Issue: Special characters garbled
**Solution**: Ensure UTF-8 encoding when opening CSV

### Issue: Dates show as numbers (43XXX)
**Solution**: Format column as Date in Excel

### Issue: Export times out
**Solution**: Reduce receipt count or use date filters

### Issue: Formula errors in Excel
**Solution**: Ensure Excel version supports formulas (2016+)

### Issue: Empty export
**Solution**: Ensure receipts are 'completed' status

## Security Validation

- [ ] User can only export own receipts
- [ ] RLS policies enforced
- [ ] No SQL injection vulnerabilities
- [ ] Export logs recorded
- [ ] No sensitive data leakage

## Optimization Checklist

- [x] Database queries optimized (select only needed fields)
- [x] Export limits enforced (1000 max)
- [x] Warning for large exports (>50)
- [ ] Caching implemented (future enhancement)
- [ ] Progress tracking (future enhancement)
- [x] Performance benchmarks met

## Success Criteria

✅ All test scenarios pass
✅ Files open correctly in all tested applications
✅ Data integrity verified (no loss)
✅ Performance meets benchmarks (<5s for 100)
✅ Security validation passes
✅ User experience is smooth

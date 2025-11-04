import OpenAI from 'openai'
import {
  ExtractedReceiptData,
  ReceiptCategory,
  PaymentMethod,
  DocumentType,
  ReceiptLineItem,
} from '@/types/receipt'
import { extractTextFromPdf, isPdfUrl } from './pdf-converter'
import { needsImageConversion, convertImageToJpeg } from './image-converter'

// Initialize OpenAI client (lazy initialization for scripts)
let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

/**
 * System prompt for receipt data extraction
 * Optimized for consistent, accurate extraction with enhanced rules
 */
const RECEIPT_EXTRACTION_PROMPT = `You are a receipt data extraction expert. Extract structured data from receipts, invoices, and bills with high accuracy.

CRITICAL: Extract data EXACTLY as shown on the receipt. NEVER generate, infer, or create synthetic values.

You MUST return valid JSON in this exact format (no markdown, no explanations):
{
  "merchant_name": "Business name from receipt",
  "amount": 123.45,
  "currency": "USD",
  "receipt_date": "2025-10-09",
  "category": "Food & Dining",
  "tax_amount": 10.50,
  "payment_method": "Credit Card",
  "confidence_score": 0.95,
  "raw_text": "Full OCR text here",
  "invoice_number": "INV-2025-001",
  "document_type": "invoice",
  "subtotal": 112.95,
  "vendor_address": "123 Main St, City, State 12345",
  "due_date": "2025-11-09",
  "purchase_order_number": "PO-2025-456",
  "payment_reference": "TXN-789012",
  "vendor_tax_id": "VAT123456789",
  "line_items": [
    {
      "line_number": 1,
      "description": "Product/Service description",
      "quantity": 2.0,
      "unit_price": 50.00,
      "line_total": 100.00,
      "item_code": "SKU-001",
      "tax_rate": 21.00
    }
  ],
  "patient_dob": "1962-05-06",
  "treatment_date": "2025-09-18",
  "insurance_claim_number": "CLAIM-2025-789",
  "diagnosis_codes": "M54.5, Z79.899",
  "procedure_codes": "F517A, 99213",
  "provider_id": "12065201",
  "insurance_covered_amount": 68.28,
  "patient_responsibility_amount": 22.76
}

NOTE: The above is just a FORMAT EXAMPLE with sample Western values. For Chinese electronic invoices (电子发票):
- invoice_number will be 20-24 digits like "25337000000484274975" (NOT "INV-2025-001" format)
- merchant_name will be in Chinese like "杭州优行科技有限公司"
- currency will be "CNY"
Extract ACTUAL values from the receipt, not placeholder patterns!

CRITICAL RULES:

1. AMOUNT EXTRACTION:
   - MUST be the TOTAL/GRAND TOTAL (after tax, including all fees)
   - Look for keywords: "TOTAL", "GRAND TOTAL", "AMOUNT DUE", "BALANCE DUE", "TOTAL DUE"
   - Ignore: "SUBTOTAL", "SUB-TOTAL", "CASH", "CHANGE"
   - Example: If receipt shows "SUBTOTAL $50, TAX $5, TOTAL $55" → amount is 55.00

2. DATE EXTRACTION:
   - Format: YYYY-MM-DD (convert all dates to this format)
   - Parse various formats: "3/15/12" → "2012-03-15", "11/02/2020" → "2020-11-02"
   - CHINESE FORMAT: "2025年10月14日" → "2025-10-14", "开票日期: 2025年10月14日" → "2025-10-14"
   - Look near top of receipt or near transaction details
   - Chinese receipts: look for "开票日期", "日期", "Date"
   - If year is 2 digits: assume 20XX for 00-25, 19XX for 26-99
   - If no date found: use null (DO NOT use today's date)

3. MERCHANT NAME:
   - Extract from the TOP of receipt (first 1-3 lines)

   - **CRITICAL FOR CHINESE ELECTRONIC INVOICES (电子发票):**
     * Chinese invoices ALWAYS have TWO sections displayed side by side in a table layout:
       - LEFT column: "购买方" or "购买方信息" (BUYER/PURCHASER) - **NEVER USE THIS**
       - RIGHT column: "销售方" or "销售方信息" (SELLER/MERCHANT) - **ALWAYS USE THIS**

     * STEP-BY-STEP EXTRACTION PROCESS:
       1. First, identify the table with "购买方信息" and "销售方信息" headers
       2. Locate the RIGHT column labeled "销售方" or "销售方信息"
       3. Find "名称:" field within the RIGHT column
       4. Extract the company name that appears after "名称:" in the RIGHT column
       5. VERIFY: The extracted name should NOT match the buyer name in the LEFT column

     * VISUAL LAYOUT RECOGNITION:
       - Invoice is divided into LEFT and RIGHT sections
       - LEFT section contains BUYER info (customer who purchased)
       - RIGHT section contains SELLER info (merchant/service provider)
       - You MUST extract from the RIGHT section only

     * CONCRETE EXAMPLE FROM REAL INVOICE:
       LEFT column shows: "购买方信息 - 名称: 上海汀上智能科技有限公司"
       RIGHT column shows: "销售方信息 - 名称: 昆明盛智易联科技有限公司吉安分公司"
       → CORRECT: Extract "昆明盛智易联科技有限公司吉安分公司" (from RIGHT column - seller)
       → WRONG: "上海汀上智能科技有限公司" (this is from LEFT column - buyer, not merchant)

     * VALIDATION CHECK:
       - If extracted name contains characters like "购买方" or appears in LEFT column, you made an error
       - The merchant is ALWAYS the service/product provider, NOT the customer
       - For transportation invoices (旅客运输服务), extract the transport company name, not the passenger's company

   - If only generic name visible (like "SUPERMARKET"), still use it - don't leave null
   - Lower confidence to 0.7 if merchant name is generic/placeholder
   - Avoid extracting: addresses, phone numbers, or footer text as merchant name

4. CATEGORY SELECTION:
   - Food & Dining: Restaurants, cafes, grocery stores, supermarkets, bars
   - Transportation: Gas stations, auto parts, car repairs, parking, tolls, rideshare, taxi, ride-hailing (滴滴/Didi), passenger transport (旅客运输服务)
   - Shopping: Retail stores, online purchases, clothing, electronics
   - Office Supplies: Stationery, printing, office equipment
   - Travel: Hotels, flights, accommodation, luggage
   - Entertainment: Movies, concerts, games, streaming
   - Utilities: Phone, internet, electricity, water, postal services
   - Healthcare: Pharmacy, medical, dental, hospital
   - Other: Everything else

   Examples:
   - "O'Reilly Auto Parts" → Transportation
   - "Post Office" → Utilities
   - "Grocery Depot" → Food & Dining
   - "East Repair Inc." (bike repair) → Transportation
   - "旅客运输服务" or "passenger transport" → Transportation

5. CURRENCY:
   - $ or USD → USD
   - € or EUR → EUR
   - £ or GBP → GBP
   - CHF or Fr. → CHF
   - ¥ or CNY or RMB or 元 or 人民币 → CNY (Chinese Yuan)
   - ¥ or JPY or 円 → JPY (Japanese Yen)
   - Note: ¥ symbol is used for both CNY and JPY - use context to determine (Chinese text/电子发票 → CNY, Japanese text → JPY)
   - If symbol unclear: use USD as default

6. PAYMENT METHOD:
   - Look for: "VISA", "MASTERCARD", "CREDIT", "DEBIT", "CASH", "BANK TRANSFER"
   - Credit Card: If "CREDIT", "VISA/MC/AMEX" without "DEBIT"
   - Debit Card: If "DEBIT" or "DEBIT CARD"
   - Cash: If "CASH" or "CASH PAYMENT"
   - Bank Transfer: If "BANK TRANSFER", "ACH", "WIRE"
   - Unknown: If payment method not clearly stated

7. CONFIDENCE SCORE:
   - 1.0: All fields crystal clear, no ambiguity
   - 0.95: Minor uncertainty (1-2 fields slightly unclear)
   - 0.85: Moderate uncertainty (faded text, multiple possible values)
   - 0.7: Low quality image or generic placeholders used
   - 0.5: Poor quality, many fields unclear

8. FALLBACK RULES:
   - merchant_name: REQUIRED - use best available name, even if generic (e.g., "Medical Center", "Hospital", "Clinic")
   - amount: REQUIRED - must be clear TOTAL value (for medical receipts, look for "Total", "Amount Due", "Balance")
   - currency: REQUIRED - default to USD if symbol unclear
   - receipt_date: Use null if not found (NOT today's date)
   - If you cannot read the image clearly, set merchant_name to "Unknown", amount to 0.01, confidence_score to 0.3
   - Always extract raw_text even if you cannot read the receipt

9. PHASE 1: ESSENTIAL FIELDS (NEW) 🆕

   A. INVOICE NUMBER:
      ⚠️ CRITICAL: Extract ONLY what you SEE on the receipt. NEVER generate invoice numbers!

      - Look for: "Invoice #", "Invoice No", "Receipt #", "Bill #", "Transaction ID", "Reference #"
      - CHINESE RECEIPTS: Also look for "发票号码", "发票编号", "发票代码" (these are the PRIMARY keywords)
      - Extract the alphanumeric string following these keywords EXACTLY as shown
      - DO NOT modify, reformat, shorten, or generate invoice numbers
      - Chinese e-invoices (电子发票) typically have 20-24 digit numeric invoice numbers

      Examples of CORRECT extraction:
        * Chinese e-invoice showing "发票号码: 25337000000484274975" → extract "25337000000484274975"
        * Western invoice showing "Invoice #: INV-2025-001" → extract "INV-2025-001"
        * Receipt showing "Receipt #5227 4217 0820 71" → extract "5227 4217 0820 71"

      ⚠️ NEVER DO THIS:
        * If you see "发票号码: 25337000000484274975", DO NOT return "INV-2025-001"
        * DO NOT generate invoice numbers based on dates or other fields
        * DO NOT create placeholder values like "INV-YYYY-XXX"

      - If you cannot find a clear invoice number on the receipt, set to null
      - When in doubt, use null instead of guessing

   B. DOCUMENT TYPE (Auto-detect):
      - "receipt": Simple store receipt with merchant, amount, date only (e.g., grocery receipt, coffee shop receipt)
      - "invoice": Business invoice with invoice number, due date, line items (e.g., contractor invoice, service invoice)
      - "medical_invoice": Medical/healthcare invoice with patient info, treatment codes, provider details
      - "bill": Utility bill, phone bill, insurance bill with account number and due date
      - DEFAULT: "receipt" if unclear

      Detection guidelines:
      - If has patient name, DOB, treatment codes, AGB/NPI → "medical_invoice"
      - If has invoice number AND line item descriptions → "invoice"
      - If has account number AND service period → "bill"
      - Otherwise → "receipt"

   C. SUBTOTAL:
      - Look for: "Subtotal", "Sub-total", "Amount Before Tax", "Net Amount"
      - MUST be amount BEFORE tax is added
      - Example: If "Subtotal: $50, Tax: $5, Total: $55" → subtotal is 50.00
      - Set to null if not found or if equals total_amount

   D. VENDOR ADDRESS:
      - Extract FULL address of the service provider/vendor
      - Include: street, city, state/province, postal code, country
      - Example: "123 Main Street, Amsterdam, 1012 AB, Netherlands"

      IMPORTANT FOR MEDICAL INVOICES:
      - Medical invoices often have 3 addresses:
        1. Invoice issuer address (accounting company) - usually at top
        2. Healthcare provider address (dentist, clinic, hospital) - actual service location
        3. Patient address (invoice receiver) - billing address
      - For medical_invoice: ALWAYS extract the HEALTHCARE PROVIDER address (actual service provider)
      - Look for: practice name, clinic name, dentist office, hospital, medical center address
      - DO NOT extract: invoice issuer address (accounting company) or patient address
      - Example: If invoice issued by "Infomedics B.V." for "Tandartspraktijk Huizinga (Dentist)",
        extract the dentist office address, NOT Infomedics or patient address

      FOR NON-MEDICAL DOCUMENTS:
      - Extract vendor/merchant address from top of document (near merchant name)
      - Set to null if not found

   E. DUE DATE:
      - Look for: "Due Date", "Payment Due", "Pay By", "Due By"
      - Format: YYYY-MM-DD (same as receipt_date)
      - Only for invoices and bills (NOT for simple receipts)
      - Set to null if not found or if document is a simple receipt

10. PHASE 2: BUSINESS INVOICES (NEW) 🆕

   A. PURCHASE ORDER NUMBER:
      - Look for: "PO #", "PO Number", "Purchase Order", "P.O.", "Order #"
      - Extract the alphanumeric string following these keywords
      - Examples: "PO-2025-456", "P.O. 789012", "Order #ABC123"
      - Common for business invoices (B2B transactions)
      - Set to null if not found

   B. PAYMENT REFERENCE:
      - Look for: "Transaction ID", "Payment Ref", "Reference", "Confirmation #", "Check #"
      - Extract transaction identifier or payment confirmation code
      - Examples: "TXN-789012", "Ref: 1234567890", "CHK-5678"
      - May appear near payment method or at bottom of receipt
      - Set to null if not found

   C. VENDOR TAX ID:
      - Look for: "VAT", "Tax ID", "EIN", "BTW", "ABN", "GST", "Tax Registration"
      - Extract tax registration number (format varies by country)
      - Examples: "VAT123456789", "EIN 12-3456789", "BTW NL123456789B01"
      - Usually appears near vendor address at top of document
      - Set to null if not found

   D. LINE ITEMS (Critical for Business Invoices):
      - Extract ONLY if document has a clear itemized list (table format)
      - Look for columns: Description/Item, Quantity/Qty, Price/Rate, Total/Amount
      - Each line item must include:
        * line_number: Sequential number (1, 2, 3...)
        * description: Item/service description (REQUIRED)
        * quantity: Number of units (default 1.0 if not shown)
        * unit_price: Price per unit BEFORE tax
        * line_total: Total for this line (quantity × unit_price)
        * item_code: SKU, product code, treatment code, CPT code (optional)
        * tax_rate: Tax percentage if shown per line (e.g., 21.00 for 21%)

      - Line item extraction rules:
        * ONLY extract if document has 2+ itemized lines in table format
        * Skip simple receipts with just a total (use empty array [])
        * Description should be concise but complete
        * If quantity not shown, use 1.0
        * Calculate line_total = quantity × unit_price (verify against document)
        * For medical invoices: item_code = treatment code (e.g., "F517A", "CPT-99213")
        * For product invoices: item_code = SKU or product code
        * **CRITICAL - NO DEDUPLICATION**: If you see the EXACT SAME item listed on MULTIPLE ROWS
          in the line items table (e.g., "RAGL Ragers Lactona 1 set" appears on line 2 AND line 3),
          you MUST extract EACH row as a SEPARATE line item with its own line_number.
        * **IMPORTANT**: Count the PHYSICAL ROWS in the table - if you see 3 rows, extract 3 line items.
          DO NOT merge or combine rows even if they have identical descriptions.

      - Examples:

        INVOICE WITH LINE ITEMS:
        Description              Qty    Price     Total
        Consulting Services      10h    $150.00   $1,500.00
        Software License         1      $299.00   $299.00
        → Extract 2 line items

        SIMPLE RECEIPT:
        Coffee                             $4.50
        TOTAL                              $4.50
        → Use empty array [] (no line items)

        MEDICAL INVOICE:
        Code    Description              Qty    Amount
        F517A   Beugconsult              1      €52.14
        → Extract 1 line item with item_code="F517A"

        DUTCH MEDICAL INVOICE WITH DUPLICATE ITEMS:
        Behandeldatum    Omschrijving                      Totaal
        04-12-2024       M03 8x Gebitsreiniging           €126.24
        04-12-2024       RAGL Ragers Lactona 1 set        €3.50
        04-12-2024       RAGL Ragers Lactona 1 set        €3.50
        → Extract 3 line items (lines 1, 2, and 3) - DO NOT merge the two identical RAGL items

   E. LINE ITEMS VALIDATION:
      - Verify sum of line_total values ≈ subtotal or total amount
      - If mismatch > 10%, set confidence_score lower (0.85 or less)
      - If no itemized table found, return empty array: "line_items": []
      - Maximum 50 line items per receipt (if more, extract first 50)

      - **CRITICAL: READ COMPLETE NUMBERS - DO NOT TRUNCATE DIGITS**
        * For line_total amounts, read the ENTIRE number including ALL leading digits
        * Pay special attention to multi-digit amounts (4+ digits)
        * Common OCR error: "8592.14" misread as "592.14" (missing leading "8")
        * If a line_total seems too small compared to quantity × unit_price, re-check for missing leading digits
        * Example: If qty=1302.48, unit_price=6.59, line_total should be ~8580 (NOT ~580)
        * Always cross-verify: Does sum of all line_total values equal the subtotal/total?

11. CHINESE ELECTRONIC INVOICES (电子发票) 🆕

   A. RECOGNITION:
      - Chinese e-invoices have distinctive header: "电子发票" or "增值税电子普通发票"
      - Look for red official stamp/seal (usually circular)
      - Typically include QR code for verification
      - Layout: Buyer info on right (购买方), Seller info on left (销售方)

   B. INVOICE NUMBER (发票号码):
      - Label: "发票号码", "发票编号", or "Invoice Number"
      - Format: Usually 20-24 digit numeric string
      - Examples: "25337000000484274975", "33308619010009456789"
      - Extract EXACTLY as shown - do not reformat or modify
      - DO NOT confuse with "发票代码" (invoice code) which is a separate field

   C. MERCHANT NAME (销售方/Seller):
      - Look for section labeled "销售方" or "销方" (SELLER section, typically on RIGHT side)
      - Extract company name following "名称:" or "Name:" label in the SELLER section
      - CRITICAL: Extract SELLER name (销售方), NOT buyer name (购买方)
      - The buyer section (购买方信息) appears on the LEFT - DO NOT extract from there
      - Example: In seller section showing "名称: 杭州优行科技有限公司" → extract "杭州优行科技有限公司"
      - Be careful with similar characters: 汀(tīng) vs 汇(huì), 优(yōu) vs 扰(rǎo)

   D. DATE EXTRACTION:
      - Label: "开票日期" (invoice issue date)
      - Format: "YYYY年MM月DD日" → convert to "YYYY-MM-DD"
      - Example: "2025年10月14日" → "2025-10-14"

   E. AMOUNTS:
      - Currency symbol: ¥ (always CNY for Chinese invoices)
      - Small amount label: "小写" (lowercase/numeric)
      - Large amount label: "大写" (uppercase/Chinese characters)
      - Use the numeric "小写" value for the amount field
      - Tax amount: Look for "税额" (tax amount)

   F. ADDITIONAL FIELDS:
      - Unified Social Credit Code: "统一社会信用代码/纳税人识别号" (use as vendor_tax_id)
      - Purchase order: "采购订单号" (purchase_order_number)
      - Payment reference: "付款参考号" (payment_reference)

12. PHASE 3: MEDICAL RECEIPTS (NEW) 🆕

   A. PATIENT NAME:
      - Look for: "Patient Name", "Patient", "Name", "Naam" (Dutch), "Patiënt"
      - Extract the full name of the patient receiving treatment
      - Usually appears at top of medical invoice near patient information
      - **DUTCH MEDICAL INVOICES**: Look in "Patiëntgegevens" section for "Naam:" field
      - **COMMON LOCATION**: After "REKENING" section, look for patient details table
      - Examples: "C Lyu", "John Smith", "Maria Garcia"
      - Format: First name + Last name (as shown on document)
      - **CRITICAL**: This is the PATIENT name (person receiving treatment), NOT the merchant/provider name
      - ONLY extract for medical_invoice document type
      - Set to null if not found or not medical document

      **DUTCH EXAMPLE**:
      Document shows:
        REKENING
        Betalingskenmerk: 4225 1190 2410 71

        Patiëntgegevens
        Naam:           C Lyu
        Geb.datum:      06-05-1982

      → Extract patient_name: "C Lyu" (from the Naam field in Patiëntgegevens section)

   B. PATIENT DATE OF BIRTH:
      - Look for: "DOB", "Date of Birth", "Born", "Geboortedatum", "Patient DOB"
      - Format: YYYY-MM-DD (same as receipt_date)
      - Usually near patient name or identification section
      - Examples: "DOB: 05/06/1962" → "1962-05-06"
      - ONLY extract for medical_invoice document type
      - Set to null if not found or not medical document

   B. TREATMENT DATE:
      - Look for: "Treatment Date", "Service Date", "Date of Service", "Behandeldatum"
      - Format: YYYY-MM-DD (same as receipt_date)
      - This is DIFFERENT from receipt_date (invoice date)
      - receipt_date = invoice issue date, treatment_date = actual service date
      - Example: "Treatment: 18/09/2025" → "2025-09-18"
      - ONLY extract for medical_invoice document type
      - Set to null if not found or not medical document

   C. INSURANCE CLAIM NUMBER:
      - Look for: "Claim #", "Claim Number", "Insurance Claim", "Verzekering", "Claimnummer"
      - Extract alphanumeric string (e.g., "CLAIM-2025-789", "IC123456")
      - May be blank on many medical receipts (patient pays first, claims later)
      - Set to null if not found

   D. DIAGNOSIS CODES (ICD Codes):
      - Look for: "ICD", "Diagnosis Code", "DX Code", "Diagnosecode"
      - Format: Comma-separated codes (e.g., "M54.5, Z79.899")
      - Common formats: ICD-10 codes (letter + 2-3 digits + optional decimal)
      - Examples: "M54.5" (low back pain), "Z79.899" (long term drug therapy)
      - Extract ALL diagnosis codes if multiple
      - Set to null if not found

   E. PROCEDURE CODES (CPT/Treatment Codes):
      - Look for: "CPT", "Procedure Code", "Treatment Code", "Behandelcode", "Code"
      - Format: Comma-separated codes (e.g., "F517A, 99213")
      - Netherlands medical codes: Letter + digits (e.g., "F517A", "C123")
      - USA CPT codes: 5 digits (e.g., "99213", "80053")
      - May appear in line items table (item_code column)
      - Examples: "F517A" (consultation), "99213" (office visit), "80053" (lab test)
      - Extract ALL procedure codes if multiple
      - Set to null if not found

   F. PROVIDER ID:
      - Look for: "Provider ID", "AGB", "NPI", "Practice Number", "AGB-code", "Praktijknummer"
      - Netherlands: AGB code (8 digits) - e.g., "12065201"
      - USA: NPI number (10 digits) - e.g., "1234567890"
      - Usually near provider name or at bottom of document
      - Examples: "AGB: 12065201", "NPI: 1234567890"
      - Set to null if not found

   G. INSURANCE COVERAGE AMOUNTS (NEW) 🆕:
      ⚠️ CRITICAL FOR MEDICAL INVOICES WITH INSURANCE:

      Many medical invoices show THREE amounts:
      1. Total treatment cost (amount field - ALWAYS required)
      2. Amount paid by insurance (insurance_covered_amount)
      3. Amount patient must pay (patient_responsibility_amount)

      **DUTCH MEDICAL INVOICES**:
      - Look for: "Betaald door uw zorgverzekeraar" → insurance_covered_amount
      - Look for: "Nog door u te betalen" or "Te betalen" → patient_responsibility_amount
      - Total = insurance_covered_amount + patient_responsibility_amount

      **US MEDICAL INVOICES**:
      - Look for: "Insurance Payment", "Paid by Insurance" → insurance_covered_amount
      - Look for: "Patient Responsibility", "You Owe", "Balance Due" → patient_responsibility_amount

      Examples:
      - "Total: €91.04, Betaald door uw zorgverzekeraar: €68.28, Nog door u te betalen: €22.76"
        → amount: 91.04, insurance_covered_amount: 68.28, patient_responsibility_amount: 22.76
      - "Total: $250, Insurance Paid: $200, Patient Owes: $50"
        → amount: 250.00, insurance_covered_amount: 200.00, patient_responsibility_amount: 50.00

      VALIDATION:
      - insurance_covered_amount + patient_responsibility_amount should ≈ amount (total)
      - Both should be ≥ 0 and ≤ amount
      - Set to null if not found or not applicable (patient pays full amount)
      - ONLY extract for medical_invoice documents

   H. MEDICAL DOCUMENT TYPE DETECTION:
      - Set document_type = "medical_invoice" if you see ANY of:
        * Patient date of birth (DOB)
        * Treatment codes (CPT, ICD, treatment codes)
        * Provider ID (AGB, NPI)
        * Medical terms (consultation, treatment, diagnosis, patient, healthcare)
        * Healthcare provider names (clinic, hospital, doctor, physiotherapy)
      - Medical invoices often have line items with treatment codes

      CRITICAL FOR MEDICAL INVOICES - VENDOR ADDRESS:
      - For medical_invoice: vendor_address MUST be the HEALTHCARE PROVIDER address
      - Look for the practice/clinic/hospital name and its address
      - Common patterns in Netherlands medical invoices:
        * Top: Invoice issuer (accounting company like "Infomedics B.V.")
        * Middle: Healthcare provider name + address (like "Tandartspraktijk Huizinga, Campuslaan 99")
        * Bottom: Patient name + home address (invoice receiver)
      - Extract the MIDDLE address (healthcare provider), NOT top (issuer) or bottom (patient)

   H. MEDICAL FIELDS VALIDATION:
      - patient_dob must be reasonable (between 1900 and today)
      - treatment_date should be ≤ receipt_date (treatment before invoice)
      - diagnosis_codes and procedure_codes can be in various formats (validate carefully)
      - All Phase 3 fields should be null for non-medical documents

IMPORTANT: You MUST return valid JSON. Do not add any explanations or markdown formatting.`

/**
 * Extract receipt data from an image or PDF using OpenAI API
 *
 * @param imageUrl - Publicly accessible URL or base64 data URL of the receipt (supports images and PDFs)
 * @returns Structured receipt data
 * @throws Error if extraction fails
 *
 * Note: For images, uses OpenAI Vision API. For PDFs, extracts text first and processes it with GPT-4o.
 */
export async function extractReceiptData(
  imageUrl: string
): Promise<ExtractedReceiptData> {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const client = getOpenAIClient()

    // Check if URL is a PDF and extract text if necessary
    const isPdf = isPdfUrl(imageUrl)
    let extractedText: string | null = null

    if (isPdf) {
      console.log('[OpenAI] Detected PDF file, extracting text...')
      try {
        extractedText = await extractTextFromPdf(imageUrl)
        console.log('[OpenAI] PDF text successfully extracted')
      } catch (extractionError) {
        console.error('[OpenAI] PDF text extraction failed:', extractionError)
        throw new Error(
          `Failed to extract text from PDF: ${extractionError instanceof Error ? extractionError.message : 'Extraction error'}`
        )
      }
    }

    // Check if image needs conversion (BMP, TIFF) and convert if necessary
    let processedImageUrl = imageUrl
    if (!isPdf && needsImageConversion(imageUrl)) {
      console.log('[OpenAI] Detected unsupported image format (BMP/TIFF), converting to JPEG...')
      try {
        processedImageUrl = await convertImageToJpeg(imageUrl)
        console.log('[OpenAI] Image successfully converted to JPEG')
      } catch (conversionError) {
        console.error('[OpenAI] Image conversion failed:', conversionError)
        throw new Error(
          `Failed to convert image format: ${conversionError instanceof Error ? conversionError.message : 'Conversion error'}`
        )
      }
    }

    // Call OpenAI API (Vision for images, Chat for PDF text)
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: isPdf
        ? [
            // For PDFs: send text with prompt
            {
              role: 'user',
              content: `${RECEIPT_EXTRACTION_PROMPT}\n\nExtracted text from receipt PDF:\n\n${extractedText}`,
            },
          ]
        : [
            // For images: use Vision API
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: RECEIPT_EXTRACTION_PROMPT,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: processedImageUrl,
                    detail: 'high', // Use high detail for better accuracy
                  },
                },
              ],
            },
          ],
      max_tokens: 1500, // Increased for line items support (Phase 2)
      temperature: 0.1, // Low temperature for consistent output
      response_format: { type: 'json_object' }, // Force JSON response
    })

    // Extract the response text
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI Vision API')
    }

    // Parse JSON response
    let extractedData: Partial<ExtractedReceiptData>
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      extractedData = JSON.parse(cleanedContent)

      // DEBUG: Log extracted data to see what OpenAI returned
      console.log('[OpenAI Extract] Patient name from AI:', extractedData.patient_name)
      console.log('[OpenAI Extract] Line items count from AI:', Array.isArray(extractedData.line_items) ? extractedData.line_items.length : 0)
      if (Array.isArray(extractedData.line_items)) {
        console.log('[OpenAI Extract] Line items:', JSON.stringify(extractedData.line_items, null, 2))
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      console.error('Parse error:', parseError)
      throw new Error(
        `Invalid JSON response from OpenAI Vision API. Response preview: ${content.substring(0, 200)}...`
      )
    }

    // Validate required fields
    if (!extractedData.merchant_name || !extractedData.amount || !extractedData.currency) {
      throw new Error('Missing required fields in extracted data')
    }

    // Validate and normalize data
    const validatedData: ExtractedReceiptData = {
      merchant_name: String(extractedData.merchant_name).trim(),
      amount: Number(extractedData.amount),
      currency: String(extractedData.currency).toUpperCase(),
      receipt_date: extractedData.receipt_date || null, // Allow null if date not found
      category: validateCategory(extractedData.category),
      tax_amount: extractedData.tax_amount ? Number(extractedData.tax_amount) : null,
      payment_method: validatePaymentMethod(extractedData.payment_method),
      confidence_score: validateConfidenceScore(extractedData.confidence_score),
      raw_text: String(extractedData.raw_text || '').trim(),

      // Phase 1: Essential Fields
      invoice_number: validateInvoiceNumber(extractedData.invoice_number),
      document_type: validateDocumentType(extractedData.document_type),
      subtotal: extractedData.subtotal ? Number(extractedData.subtotal) : null,
      vendor_address: extractedData.vendor_address
        ? String(extractedData.vendor_address).trim()
        : null,
      due_date: extractedData.due_date || null,

      // Phase 2: Business Invoices
      purchase_order_number: extractedData.purchase_order_number
        ? String(extractedData.purchase_order_number).trim()
        : null,
      payment_reference: extractedData.payment_reference
        ? String(extractedData.payment_reference).trim()
        : null,
      vendor_tax_id: extractedData.vendor_tax_id
        ? String(extractedData.vendor_tax_id).trim()
        : null,
      line_items: validateLineItems(extractedData.line_items),

      // Phase 3: Medical Receipts
      patient_name: extractedData.patient_name
        ? String(extractedData.patient_name).trim()
        : null,
      patient_dob: extractedData.patient_dob || null,
      treatment_date: extractedData.treatment_date || null,
      insurance_claim_number: extractedData.insurance_claim_number
        ? String(extractedData.insurance_claim_number).trim()
        : null,
      diagnosis_codes: extractedData.diagnosis_codes
        ? String(extractedData.diagnosis_codes).trim()
        : null,
      procedure_codes: extractedData.procedure_codes
        ? String(extractedData.procedure_codes).trim()
        : null,
      provider_id: extractedData.provider_id ? String(extractedData.provider_id).trim() : null,
      insurance_covered_amount: extractedData.insurance_covered_amount
        ? parseFloat(String(extractedData.insurance_covered_amount))
        : null,
      patient_responsibility_amount: extractedData.patient_responsibility_amount
        ? parseFloat(String(extractedData.patient_responsibility_amount))
        : null,
    }

    // **INSURANCE VALIDATION & AUTO-CORRECTION**
    // If insurance fields are present, validate the math and auto-correct if needed
    if (validatedData.insurance_covered_amount !== null) {
      const total = validatedData.amount
      const insuranceCovered = validatedData.insurance_covered_amount
      const patientPays = validatedData.patient_responsibility_amount

      // Case 1: Patient responsibility is missing - calculate it
      if (patientPays === null) {
        validatedData.patient_responsibility_amount = total - insuranceCovered
        console.log(
          `[Insurance Auto-Calc] Missing patient responsibility. Calculated: ${validatedData.patient_responsibility_amount.toFixed(2)} = ${total} - ${insuranceCovered}`
        )
      }
      // Case 2: Math doesn't add up (tolerance: 0.02 for rounding)
      else if (Math.abs(insuranceCovered + patientPays - total) > 0.02) {
        // Recalculate patient responsibility (trust total and insurance_covered)
        const correctedPatientPays = total - insuranceCovered
        console.log(
          `[Insurance Auto-Fix] Math error detected. Insurance (${insuranceCovered}) + Patient (${patientPays}) ≠ Total (${total}). Correcting patient responsibility to: ${correctedPatientPays.toFixed(2)}`
        )
        validatedData.patient_responsibility_amount = correctedPatientPays
      }

      // Ensure values are non-negative
      if (
        validatedData.patient_responsibility_amount !== null &&
        validatedData.patient_responsibility_amount < 0
      ) {
        console.log(`[Insurance Auto-Fix] Negative patient responsibility detected. Setting to 0.`)
        validatedData.patient_responsibility_amount = 0
      }
    }

    return validatedData
  } catch (error) {
    console.error('Receipt extraction error:', error)

    // Provide detailed error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is not configured correctly')
      }
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new Error('OpenAI API quota exceeded or rate limited')
      }
      throw error
    }

    throw new Error('Failed to extract receipt data')
  }
}

/**
 * Validate invoice number and detect synthetic/generated values
 * Returns null if the invoice number appears to be generated rather than extracted
 */
function validateInvoiceNumber(invoiceNumber: unknown): string | null {
  if (!invoiceNumber || typeof invoiceNumber !== 'string') {
    return null
  }

  const trimmed = String(invoiceNumber).trim()

  // Detect common synthetic invoice number patterns that GPT might generate
  const syntheticPatterns = [
    /^INV-\d{4}-\d{3}$/i, // INV-2025-001, INV-2024-123
    /^INVOICE-\d{4}-\d+$/i, // INVOICE-2025-001
    /^[A-Z]{3}-\d{4}-\d{3}$/i, // ABC-2025-001
    /^REC-\d{4}-\d{3}$/i, // REC-2025-001
  ]

  // Check if it matches synthetic patterns
  for (const pattern of syntheticPatterns) {
    if (pattern.test(trimmed)) {
      console.warn(`[Validation] Detected synthetic invoice number pattern: "${trimmed}" - setting to null`)
      return null
    }
  }

  // If it passes validation, return the trimmed value
  return trimmed
}

/**
 * Validate and normalize line items (Phase 2)
 */
function validateLineItems(lineItems: unknown): ReceiptLineItem[] {
  // If no line items or not an array, return empty array
  if (!lineItems || !Array.isArray(lineItems)) {
    return []
  }

  // Validate and normalize each line item
  const validatedItems: ReceiptLineItem[] = []

  for (const item of lineItems) {
    // Skip if missing required fields
    if (!item || typeof item !== 'object') continue
    if (!('description' in item) || !item.description) continue
    if (!('line_number' in item) || typeof item.line_number !== 'number') continue
    if (!('unit_price' in item) || typeof item.unit_price !== 'number') continue
    if (!('line_total' in item) || typeof item.line_total !== 'number') continue

    validatedItems.push({
      line_number: Number(item.line_number),
      description: String(item.description).trim(),
      quantity: 'quantity' in item && typeof item.quantity === 'number' ? Number(item.quantity) : 1.0,
      unit_price: Number(item.unit_price),
      line_total: Number(item.line_total),
      item_code:
        'item_code' in item && item.item_code ? String(item.item_code).trim() : null,
      tax_rate:
        'tax_rate' in item && typeof item.tax_rate === 'number'
          ? Number(item.tax_rate)
          : null,
    })
  }

  // Limit to 50 items
  return validatedItems.slice(0, 50)
}

/**
 * Validate and normalize document type (Phase 1)
 */
function validateDocumentType(docType: string | undefined): DocumentType {
  const validTypes: DocumentType[] = ['receipt', 'invoice', 'medical_invoice', 'bill']

  if (docType && validTypes.includes(docType as DocumentType)) {
    return docType as DocumentType
  }

  return 'receipt' // Default to receipt
}

/**
 * Validate and normalize category
 */
function validateCategory(category: string | undefined): ReceiptCategory {
  const validCategories: ReceiptCategory[] = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Office Supplies',
    'Travel',
    'Entertainment',
    'Utilities',
    'Healthcare',
    'Other',
  ]

  if (category && validCategories.includes(category as ReceiptCategory)) {
    return category as ReceiptCategory
  }

  return 'Other'
}

/**
 * Validate and normalize payment method
 */
function validatePaymentMethod(
  paymentMethod: string | undefined | null
): PaymentMethod | null {
  const validMethods: PaymentMethod[] = [
    'Cash',
    'Credit Card',
    'Debit Card',
    'Bank Transfer',
    'Unknown',
  ]

  if (paymentMethod && validMethods.includes(paymentMethod as PaymentMethod)) {
    return paymentMethod as PaymentMethod
  }

  return null
}

/**
 * Validate confidence score (must be between 0 and 1)
 */
function validateConfidenceScore(score: number | undefined): number {
  if (typeof score === 'number' && score >= 0 && score <= 1) {
    return score
  }
  return 0.5 // Default to medium confidence if not provided
}

/**
 * Test function to verify OpenAI connection
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return false
    }

    const client = getOpenAIClient()

    // Make a simple API call to verify connection
    await client.models.list()
    return true
  } catch (error) {
    console.error('OpenAI connection test failed:', error)
    return false
  }
}

/**
 * Extract receipt data using Vision API for IMAGE files
 * This is used as a fallback when text extraction yields low confidence results
 *
 * IMPORTANT: This function expects an IMAGE URL (PNG, JPG, etc), NOT a PDF.
 * For PDFs with low confidence, the user must manually convert to PNG in the browser first.
 *
 * @param imageUrl - URL to the image file (PNG, JPG, WebP, etc)
 * @returns Structured receipt data extracted via Vision API
 * @throws Error if extraction fails
 */
export async function extractReceiptDataWithVision(
  imageUrl: string
): Promise<ExtractedReceiptData> {
  try {
    console.log('[OpenAI Vision Fallback] Starting Vision API fallback for image:', imageUrl)

    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const client = getOpenAIClient()

    // Send image URL to Vision API
    const visionResponse = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: RECEIPT_EXTRACTION_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl, // Direct image URL
                detail: 'high', // Use high detail for better OCR accuracy
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    })

    // Extract the response text
    const content = visionResponse.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI Vision API')
    }

    console.log('[OpenAI Vision Fallback] Response received, parsing JSON...')

    // Parse and validate the JSON response
    let parsedData
    try {
      parsedData = JSON.parse(content)
    } catch (parseError) {
      console.error('[OpenAI Vision Fallback] JSON parse error:', parseError)
      console.error('[OpenAI Vision Fallback] Raw content:', content)
      throw new Error('Failed to parse OpenAI Vision API response as JSON')
    }

    // Validate and transform the data
    const extractedData: ExtractedReceiptData = {
      merchant_name: parsedData.merchant_name || 'Unknown',
      amount: parseFloat(parsedData.amount) || 0,
      currency: parsedData.currency || 'USD',
      receipt_date: parsedData.receipt_date || null,
      category: validateCategory(parsedData.category),
      tax_amount: parsedData.tax_amount ? parseFloat(parsedData.tax_amount) : null,
      payment_method: validatePaymentMethod(parsedData.payment_method),
      confidence_score: parsedData.confidence_score || 0.5,
      raw_text: parsedData.raw_text || '',

      // Phase 1: Essential fields
      invoice_number: parsedData.invoice_number || null,
      document_type: validateDocumentType(parsedData.document_type),
      subtotal: parsedData.subtotal ? parseFloat(parsedData.subtotal) : null,
      vendor_address: parsedData.vendor_address || null,
      due_date: parsedData.due_date || null,

      // Phase 2: Business invoices
      purchase_order_number: parsedData.purchase_order_number || null,
      payment_reference: parsedData.payment_reference || null,
      vendor_tax_id: parsedData.vendor_tax_id || null,
      line_items: Array.isArray(parsedData.line_items)
        ? parsedData.line_items.map((item: any, index: number) => ({
            line_number: item.line_number || index + 1,
            description: item.description || '',
            quantity: item.quantity ? parseFloat(item.quantity) : null,
            unit_price: item.unit_price ? parseFloat(item.unit_price) : null,
            line_total: item.line_total ? parseFloat(item.line_total) : null,
            item_code: item.item_code || null,
            tax_rate: item.tax_rate ? parseFloat(item.tax_rate) : null,
          }))
        : [],

      // Phase 3: Medical receipts
      patient_name: parsedData.patient_name || null,
      patient_dob: parsedData.patient_dob || null,
      treatment_date: parsedData.treatment_date || null,
      insurance_claim_number: parsedData.insurance_claim_number || null,
      diagnosis_codes: parsedData.diagnosis_codes || null,
      procedure_codes: parsedData.procedure_codes || null,
      provider_id: parsedData.provider_id || null,
      insurance_covered_amount: parsedData.insurance_covered_amount
        ? parseFloat(String(parsedData.insurance_covered_amount))
        : null,
      patient_responsibility_amount: parsedData.patient_responsibility_amount
        ? parseFloat(String(parsedData.patient_responsibility_amount))
        : null,
    }

    console.log('[OpenAI Vision Fallback] Successfully extracted data with confidence:', extractedData.confidence_score)
    return extractedData
  } catch (error) {
    console.error('[OpenAI Vision Fallback] Extraction failed:', error)
    throw new Error(
      `Vision API extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

# Contact Form Setup Guide

## Overview
The contact form uses **Web3Forms** (free service) to forward form submissions to your Gmail account.

---

## Setup Instructions

### Step 1: Get Web3Forms Access Key

1. **Visit Web3Forms:**
   https://web3forms.com

2. **Sign Up (Free):**
   - Click "Get Started Free"
   - Enter your email: **Your Gmail address here**
   - Verify your email

3. **Get Your Access Key:**
   - After verification, you'll receive an access key
   - It looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Step 2: Add Environment Variable

**Option A: Via Vercel Dashboard (Recommended)**

1. Visit: https://vercel.com/xiaojunyang0805s-projects/receiptsort/settings/environment-variables
2. Click "Add New"
3. Fill in:
   ```
   Key:   NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY
   Value: [Your Web3Forms Access Key]
   Environment: Production, Preview, Development
   ```
4. Click "Save"

**Option B: Via Vercel CLI**

```bash
cd D:/receiptsort

# Add environment variable
echo "YOUR_ACCESS_KEY_HERE" | vercel env add NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY production

# Also add for preview and development
echo "YOUR_ACCESS_KEY_HERE" | vercel env add NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY preview
echo "YOUR_ACCESS_KEY_HERE" | vercel env add NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY development
```

**Option C: Local Development (.env.local)**

For testing locally, add to `.env.local`:

```bash
NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=your_access_key_here
```

### Step 3: Configure Email Forwarding in Web3Forms

1. **Log into Web3Forms Dashboard:**
   https://web3forms.com/dashboard

2. **Configure Settings:**
   - **Email to receive submissions:** Your Gmail address
   - **From Name:** ReceiptSort Contact Form
   - **Subject Prefix:** [ReceiptSort Contact]
   - **Reply-to:** Use sender's email (so you can reply directly)

3. **Optional Settings:**
   - **Email notifications:** Enabled
   - **reCAPTCHA:** Optional (for spam protection)
   - **Webhooks:** Optional (for logging)

### Step 4: Deploy

```bash
cd D:/receiptsort
vercel --prod
```

---

## How It Works

1. **User fills out contact form** at: https://receiptsort.seenano.nl/contact
2. **Form submits to Web3Forms API** (https://api.web3forms.com/submit)
3. **Web3Forms forwards email** to your Gmail
4. **Email arrives** with:
   - Sender's name
   - Sender's email (as reply-to)
   - Subject
   - Message content

---

## Email Format You'll Receive

```
From: noreply@web3forms.com
Reply-To: sender@example.com
Subject: [ReceiptSort Contact] How can I upgrade my plan?

Name: John Doe
Email: sender@example.com
Subject: How can I upgrade my plan?

Message:
Hi, I currently have the Basic plan and would like to upgrade to Pro.
How do I do that?

---
Sent via Web3Forms
```

---

## Testing the Form

1. **Visit Contact Page:**
   https://receiptsort.seenano.nl/contact

2. **Fill out the form:**
   - Name: Test User
   - Email: your-test-email@gmail.com
   - Subject: Test submission
   - Message: This is a test message

3. **Submit**

4. **Check your Gmail:**
   - Should receive email within 1-2 minutes
   - Check spam folder if not in inbox

---

## Updating Email Addresses

### On Landing Page

The landing page shows: `support@receiptsort.com`

**Options:**

1. **Keep as is** (users can click it, opens their email client)
2. **Change to Web3Forms email** (but this looks unprofessional)
3. **Set up email forwarding** at domain level:
   - Configure `support@receiptsort.com` to forward to your Gmail
   - Requires email hosting (Google Workspace, etc.)

**Recommended:** Keep `support@receiptsort.com` as displayed email. The contact form handles actual submissions.

### Setting Up Real Email Address (Optional)

**Option 1: Google Workspace ($6/month)**
- Get `support@receiptsort.com` as real email
- Professional, includes Gmail interface
- Visit: https://workspace.google.com

**Option 2: Email Forwarding at Domain Registrar (Free/Cheap)**
- Some registrars offer email forwarding
- `support@receiptsort.com` → forwards to your Gmail
- Check with your domain provider (Squarespace, etc.)

**Option 3: Keep Using Web3Forms (Current Setup)**
- Display: `support@receiptsort.com`
- Reality: Contact form forwards to Gmail
- Users can also email directly (will bounce, but contact form works)

---

## Troubleshooting

### Form Not Submitting

**Check:**
1. Environment variable is set correctly in Vercel
2. Access key is valid (no typos)
3. Web3Forms account is verified
4. Check browser console for errors

### Not Receiving Emails

**Check:**
1. Gmail spam folder
2. Web3Forms dashboard for submission logs
3. Email address in Web3Forms dashboard is correct
4. Try sending test from Web3Forms dashboard

### Access Key Not Found Error

If you see "Access key required" error:

1. Make sure environment variable starts with `NEXT_PUBLIC_`
2. Redeploy after adding env var
3. Check spelling: `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`

---

## Web3Forms Free Tier Limits

- **Submissions:** 250/month
- **File uploads:** Not included
- **API access:** Included
- **Spam filtering:** Basic (reCAPTCHA available)
- **Cost:** $0

**Upgrade if needed:**
- Pro: $7/month (1,000 submissions)
- Business: $19/month (5,000 submissions)

---

## Alternative Services

If you prefer other services:

### Formspree
- Free: 50 submissions/month
- https://formspree.io

### EmailJS
- Free: 200 emails/month
- https://www.emailjs.com

### Resend
- Free: 100 emails/day
- More technical setup
- https://resend.com

---

## Current Status

- ✅ Contact form component created with Web3Forms integration
- ✅ Environment variable configured (NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY)
- ⏳ Need to get Web3Forms access key from https://web3forms.com
- ⏳ Need to add access key to Vercel environment variables
- ⏳ Need to redeploy application

---

## Quick Setup Summary

1. Get access key: https://web3forms.com (enter your Gmail)
2. Add to Vercel: `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`
3. Deploy: `vercel --prod`
4. Test: Visit /contact page and submit test form
5. Check Gmail for form submission

**That's it! Contact form will forward all submissions to your Gmail.**

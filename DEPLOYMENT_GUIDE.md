# ReceiptSort Deployment Guide

## Subdomain Setup: receiptsort.seenano.nl

This guide walks you through deploying ReceiptSort to Vercel and configuring the subdomain.

---

## Step 1: Prepare Next.js App for Production

### 1.1 Verify Environment Variables

Ensure your `.env.local` has all required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# App URL (will update after deployment)
NEXT_PUBLIC_APP_URL=https://receiptsort.seenano.nl
```

### 1.2 Update Production URL References

Check these files for hardcoded URLs:
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/stripe.ts`
- Any redirect URLs

---

## Step 2: Deploy to Vercel

### 2.1 Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2.2 Login to Vercel

```bash
vercel login
```

### 2.3 Deploy from Command Line

```bash
cd D:/receiptsort
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No (first time)
- **Project name?** → receiptsort
- **Directory?** → ./ (current directory)
- **Override settings?** → No

### 2.4 Add Environment Variables to Vercel

**Option A: Via CLI**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_APP_URL
```

**Option B: Via Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add all variables from your `.env.local`

### 2.5 Deploy to Production

```bash
vercel --prod
```

**Save the deployment URL** (e.g., `receiptsort-xyz.vercel.app`)

---

## Step 3: Configure DNS at Domain Registrar

### 3.1 Find Your Domain Registrar

Your domain `seenano.nl` is registered with a provider (e.g., GoDaddy, Namecheap, etc.)

**To find your registrar:**
```bash
whois seenano.nl
```

### 3.2 Add DNS Record

Log into your domain registrar's control panel and add:

**DNS Record:**
```
Type:  CNAME
Name:  receiptsort
Value: cname.vercel-dns.com
TTL:   3600 (or default)
```

**Example for different providers:**

**GoDaddy:**
1. DNS Management
2. Add → CNAME
3. Name: `receiptsort`
4. Value: `cname.vercel-dns.com`
5. Save

**Namecheap:**
1. Advanced DNS
2. Add New Record → CNAME
3. Host: `receiptsort`
4. Value: `cname.vercel-dns.com`
5. Save

**Cloudflare:**
1. DNS → Add record
2. Type: CNAME
3. Name: `receiptsort`
4. Target: `cname.vercel-dns.com`
5. Proxy status: DNS only (gray cloud)
6. Save

---

## Step 4: Add Custom Domain in Vercel

### 4.1 Via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your `receiptsort` project
3. Go to **Settings** → **Domains**
4. Add domain: `receiptsort.seenano.nl`
5. Click **Add**

### 4.2 Via Vercel CLI

```bash
vercel domains add receiptsort.seenano.nl
```

### 4.3 Verify Domain Configuration

Vercel will automatically:
- Detect your DNS configuration
- Issue SSL certificate (via Let's Encrypt)
- Configure HTTPS redirect

**This usually takes 1-5 minutes.**

---

## Step 5: Update Stripe Webhook URL

### 5.1 Update Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Find your webhook
3. Update URL to: `https://receiptsort.seenano.nl/api/stripe/webhook`
4. Save changes

### 5.2 Update Environment Variable

If you have the webhook secret hardcoded, update it:

```bash
vercel env add STRIPE_WEBHOOK_SECRET production
```

---

## Step 6: Configure Supabase Redirect URLs

### 6.1 Update Allowed Redirect URLs

1. Go to Supabase Dashboard
2. Project Settings → Authentication → URL Configuration
3. Add to **Redirect URLs**:
   - `https://receiptsort.seenano.nl/auth/callback`
   - `https://receiptsort.seenano.nl/dashboard`
4. Update **Site URL**: `https://receiptsort.seenano.nl`
5. Save

---

## Step 7: Verify Deployment

### 7.1 Check Domain Access

Visit: https://receiptsort.seenano.nl

### 7.2 Verify SSL Certificate

- Should automatically redirect HTTP → HTTPS
- Green padlock in browser
- Valid SSL certificate

### 7.3 Test Key Features

- [ ] Landing page loads
- [ ] User signup/login works
- [ ] Receipt upload functions
- [ ] Payment flow works
- [ ] Email notifications send
- [ ] All translations work

### 7.4 Check Vercel Logs

```bash
vercel logs
```

Or view in dashboard: Project → Deployments → View Function Logs

---

## Step 8: Set Up Continuous Deployment

### 8.1 Connect GitHub Repository

1. Vercel Dashboard → Your Project → Settings → Git
2. Connect to GitHub
3. Select repository: `xiaojunyang0805/receiptsort`
4. Choose branch: `main`
5. Save

**Now every push to `main` will auto-deploy!**

### 8.2 Configure Build Settings (if needed)

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

---

## Troubleshooting

### Domain Not Resolving

**Check DNS propagation:**
```bash
nslookup receiptsort.seenano.nl
dig receiptsort.seenano.nl
```

**Or use online tool:**
https://www.whatsmydns.net/#CNAME/receiptsort.seenano.nl

**Wait time:** DNS changes can take 1-48 hours to propagate globally

### SSL Certificate Issues

- Wait 5-10 minutes after DNS propagation
- Vercel auto-issues certificates via Let's Encrypt
- Check Vercel Dashboard → Domains for status

### Build Errors

```bash
# Check build locally first
npm run build

# View Vercel logs
vercel logs --follow
```

### Environment Variables Not Working

- Ensure variables are set for "Production" environment
- Redeploy after adding variables:
  ```bash
  vercel --prod
  ```

---

## Production Checklist

Before announcing launch:

- [ ] Domain resolves correctly
- [ ] SSL certificate is active
- [ ] All environment variables set
- [ ] Stripe webhooks configured
- [ ] Supabase redirects updated
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test receipt upload
- [ ] Test payment flow
- [ ] Test export functionality
- [ ] Check mobile responsiveness
- [ ] Verify all languages work
- [ ] Test error handling
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure error tracking (Sentry, optional)

---

## Monitoring & Maintenance

### Vercel Analytics

Enable in: Project Settings → Analytics

### Error Tracking

Consider adding Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Performance Monitoring

- Vercel Dashboard → Analytics
- Check Core Web Vitals
- Monitor function execution times

---

## Quick Reference Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List domains
vercel domains ls

# Add environment variable
vercel env add VARIABLE_NAME

# Pull environment variables locally
vercel env pull .env.local
```

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Custom Domains**: https://vercel.com/docs/concepts/projects/domains
- **Environment Variables**: https://vercel.com/docs/environment-variables

---

## Next Steps After Deployment

1. Update `receiptsort-project` hub repository with live demo link
2. Add QR code to landing page
3. Set up monitoring and alerts
4. Create backup strategy
5. Plan marketing launch

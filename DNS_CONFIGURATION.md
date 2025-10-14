# DNS Configuration for receiptsort.seenano.nl

## Current Status ✅

- Vercel Project: **receiptsort**
- Live URL: https://receiptsort.vercel.app
- Target Domain: **receiptsort.seenano.nl**
- Domain added to Vercel project ✓

## Next Step: Configure DNS

You need to add a DNS record at your domain registrar (where you manage seenano.nl).

---

## DNS Configuration Required

### Add This DNS Record:

```
Type:  CNAME
Name:  receiptsort
Value: cname.vercel-dns.com
TTL:   3600 (or Auto/Default)
```

**Explanation:**
- `receiptsort` becomes the subdomain
- Points to Vercel's DNS system
- Vercel will handle the rest automatically

---

## Step-by-Step Instructions

### Find Your Domain Registrar

Your domain `seenano.nl` is registered with one of these providers. Check your email for domain renewal notices or login credentials.

Common registrars for .nl domains:
- **Vimexx**
- **TransIP**
- **Byte**
- **Hostnet**
- **Yourhosting**
- **Versio**
- **Antagonist**

### Access DNS Management

1. Log into your domain registrar's website
2. Find DNS Management (might be called):
   - DNS Settings
   - DNS Records
   - Name Server Configuration
   - Advanced DNS
   - DNS Zone Editor

### Add the CNAME Record

**Example for TransIP:**
1. Go to "My TransIP" → Domains
2. Click on `seenano.nl`
3. Go to DNS tab
4. Click "Add DNS entry"
5. Fill in:
   - Type: `CNAME`
   - Name: `receiptsort`
   - Value: `cname.vercel-dns.com`
   - TTL: `3600`
6. Click Save

**Example for Vimexx:**
1. Go to Control Panel → Domains
2. Select `seenano.nl`
3. Click DNS Management
4. Add New Record:
   - Record Type: `CNAME`
   - Hostname: `receiptsort`
   - Points to: `cname.vercel-dns.com`
   - TTL: `3600`
7. Save Changes

**General Format (works for most registrars):**
```
Host/Name:    receiptsort
Record Type:  CNAME
Target/Value: cname.vercel-dns.com
TTL:          3600 (or default)
```

---

## Verification

### Check DNS Propagation (After Adding Record)

Wait 1-5 minutes, then check:

**Option 1: Online Tool**
Visit: https://www.whatsmydns.net/#CNAME/receiptsort.seenano.nl

Should show: `cname.vercel-dns.com`

**Option 2: Command Line**
```bash
# Windows (PowerShell or CMD)
nslookup receiptsort.seenano.nl

# Should return something like:
# receiptsort.seenano.nl  canonical name = cname.vercel-dns.com
```

**Option 3: Browser**
After DNS propagates (1-48 hours, usually 5-30 minutes), visit:
https://receiptsort.seenano.nl

Should show your ReceiptSort app with valid HTTPS!

---

## Add Domain in Vercel Dashboard (Alternative Method)

If you prefer using the Vercel dashboard:

1. Go to https://vercel.com/dashboard
2. Select project: **receiptsort**
3. Go to **Settings** → **Domains**
4. Add domain: `receiptsort.seenano.nl`
5. Click **Add**
6. Vercel will show DNS instructions
7. Configure DNS as shown above
8. Wait for verification (automatic)

---

## What Happens Next (Automatic)

Once DNS is configured and propagates:

1. ✅ Vercel detects your DNS configuration
2. ✅ Vercel issues SSL certificate (Let's Encrypt)
3. ✅ HTTPS is automatically enabled
4. ✅ HTTP → HTTPS redirect is configured
5. ✅ Your site is live at https://receiptsort.seenano.nl

**Timeline:**
- DNS propagation: 5 minutes - 48 hours (usually 5-30 minutes)
- SSL certificate: Automatic (1-5 minutes after DNS)
- Total time: Usually 10-35 minutes

---

## Troubleshooting

### DNS Not Propagating

**Check if you saved the DNS record:**
- Log back into your registrar
- Verify the CNAME record is there
- Make sure there are no typos

**Wait longer:**
- DNS can take up to 48 hours globally
- Check https://www.whatsmydns.net regularly
- Be patient!

### SSL Certificate Not Issued

**After DNS propagates:**
- Wait 5-10 minutes
- Vercel auto-issues certificates
- Check Vercel Dashboard → Domains for status

### Wrong Registrar?

**Find your registrar:**
```bash
# Windows PowerShell
nslookup -type=SOA seenano.nl

# Or check WHOIS
# Visit: https://www.whois.com/whois/seenano.nl
```

---

## Current Deployment URLs

While DNS is propagating, your app is already live at:

- ✅ https://receiptsort.vercel.app
- ✅ https://receiptsort-xiaojunyang0805s-projects.vercel.app
- ✅ https://receiptsort-git-main-xiaojunyang0805s-projects.vercel.app

You can test and share these URLs while waiting for DNS!

---

## After DNS is Live

### Update External Services

Once https://receiptsort.seenano.nl is working:

**1. Stripe Webhooks**
- Dashboard: https://dashboard.stripe.com/webhooks
- Update URL to: `https://receiptsort.seenano.nl/api/stripe/webhook`

**2. Supabase Auth**
- Dashboard → Authentication → URL Configuration
- Site URL: `https://receiptsort.seenano.nl`
- Add redirect: `https://receiptsort.seenano.nl/auth/callback`

**3. Update Environment Variable**
```bash
vercel env rm NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_APP_URL production
# Enter value: https://receiptsort.seenano.nl

# Redeploy
vercel --prod
```

---

## Summary

**You need to do:**
1. ☑️ Log into your domain registrar (where seenano.nl is managed)
2. ☑️ Add CNAME record: `receiptsort` → `cname.vercel-dns.com`
3. ☑️ Save changes
4. ☑️ Wait 5-30 minutes for DNS to propagate
5. ☑️ Verify at https://receiptsort.seenano.nl
6. ☑️ Update Stripe and Supabase URLs

**That's it!** Vercel handles everything else automatically.

---

## Need Help?

- **Can't find DNS settings?** Email your domain registrar's support
- **DNS not working?** Use https://www.whatsmydns.net to check
- **Other issues?** Check Vercel Dashboard → Project → Domains for status

---

**Your project is ready to go live as soon as DNS is configured! 🚀**

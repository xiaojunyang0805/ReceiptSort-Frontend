# Squarespace DNS Setup Guide

## Add CNAME Record for receiptsort.seenano.nl

### Step 1: Check if seenano.nl is Managed by Squarespace

First, determine if your domain is managed by Squarespace or an external registrar:

**In your Squarespace dashboard (screenshot you showed):**
1. Click **"MANAGE DOMAIN"** button
2. Look for "DNS Settings" or "Advanced Settings"

**If you see "DNS Settings"** → Your domain is managed by Squarespace (follow Section A)
**If you see "Transfer to Squarespace" or external registrar name** → Domain is managed elsewhere (follow Section B)

---

## Section A: Domain Managed by Squarespace

### Step-by-Step Instructions:

1. **Access DNS Settings**
   - From your Squarespace dashboard: `Settings` → `Domains`
   - Click on `seenano.nl`
   - Click **`DNS Settings`**

2. **Add CNAME Record**
   - Click **`Add Record`**
   - Select record type: **`CNAME`**

3. **Fill in the Details**
   ```
   Host/Name:    receiptsort
   Points to:    cname.vercel-dns.com
   TTL:          Auto (or 3600)
   ```

4. **Save**
   - Click **`Save`** or **`Add Record`**
   - Changes take 24-48 hours (usually 5-30 minutes)

### Visual Guide:

```
┌─────────────────────────────────┐
│  Add DNS Record                 │
├─────────────────────────────────┤
│  Type:     [CNAME ▼]           │
│  Host:     [receiptsort]        │
│  Points to: [cname.vercel-dns.com]│
│  TTL:      [Auto ▼]            │
│                                 │
│           [Cancel] [Save]       │
└─────────────────────────────────┘
```

---

## Section B: Domain Managed by External Registrar

If your domain is registered elsewhere (common for .nl domains), you need to find your registrar.

### Find Your Domain Registrar:

**Option 1: Check WHOIS (Recommended for .nl domains)**

Visit: https://www.sidn.nl/en/whois

Enter: `seenano.nl`

Look for: **Registrar** field

**Option 2: Check Your Email**
- Search for "domain renewal" or "seenano.nl"
- Find registration confirmation emails
- Registrar name will be in the sender

**Common Dutch Registrars for .nl:**
- TransIP (transip.nl)
- Vimexx (vimexx.nl)
- Byte (byte.nl)
- Hostnet (hostnet.nl)
- Yourhosting (yourhosting.nl)
- Versio (versio.nl)

### Once You Find Your Registrar:

1. Log into their website
2. Find DNS Management (varies by provider)
3. Add CNAME record:
   ```
   Type:  CNAME
   Name:  receiptsort
   Value: cname.vercel-dns.com
   TTL:   3600
   ```

---

## Quick Decision Tree

```
Is seenano.nl managed by Squarespace?
│
├─ YES → Follow Section A (Squarespace DNS)
│   └─ Squarespace → Domains → seenano.nl → DNS Settings
│
└─ NO → Follow Section B (External Registrar)
    └─ Find registrar → Log in → DNS Management
```

---

## After Adding the CNAME Record

### Verify DNS Configuration

Wait 5-10 minutes, then check:

**Online Tool:**
https://www.whatsmydns.net/#CNAME/receiptsort.seenano.nl

Should show: `cname.vercel-dns.com`

**Command Line (Windows):**
```bash
nslookup receiptsort.seenano.nl
```

### When It's Working:

1. ✅ Visit: https://receiptsort.seenano.nl
2. ✅ Should load your ReceiptSort app
3. ✅ HTTPS with valid SSL certificate
4. ✅ Green padlock in browser

---

## Troubleshooting

### Can't Find DNS Settings in Squarespace?

Your domain might be:
- Connected but not transferred to Squarespace
- Managed by an external registrar
- Using Squarespace nameservers but DNS managed elsewhere

**Solution:** Click "MANAGE DOMAIN" and look for provider information

### CNAME Record Not Accepted?

Some providers don't accept `@` or empty host names for CNAME. Use `receiptsort` as the host name.

### Still Not Working After 24 Hours?

1. Double-check the CNAME record is saved
2. Verify no typos in `cname.vercel-dns.com`
3. Check if there's a conflicting A record
4. Contact your domain registrar support

---

## Official Documentation Links

- **Squarespace DNS Guide**: https://support.squarespace.com/hc/en-us/articles/205812348
- **Adding CNAME Records**: https://support.squarespace.com/hc/en-us/articles/360002101888
- **SIDN (Dutch .nl registry)**: https://www.sidn.nl/en/whois
- **Vercel Custom Domains**: https://vercel.com/docs/concepts/projects/domains

---

## Need Help?

1. **Can't access Squarespace?** Reset password or contact support
2. **Domain registered elsewhere?** Check WHOIS: https://www.sidn.nl/en/whois
3. **DNS not propagating?** Wait 24 hours, then contact registrar

---

**You're almost there! Once the CNAME is added, your site will be live at receiptsort.seenano.nl within 5-30 minutes! 🚀**

# Email Forwarding Setup Guide for seenano.nl

**Date:** October 13, 2025  
**Domain:** seenano.nl  
**Goal:** Set up free email forwarding from support@seenano.nl to xiaojunyang0805@gmail.com

---

## Overview

Successfully configured free email forwarding using ImprovMX to receive emails at a professional domain email address (support@seenano.nl) and forward them to a personal Gmail account.

---

## Domain Information

- **Domain:** seenano.nl
- **Registrar:** Key-Systems GmbH (St. Ingbert, Germany)
- **Domain Management:** Squarespace (formerly Google Domains)
- **Nameservers:** Google Domains nameservers (ns-cloud-d1/d2/d3/d4.googledomains.com)
- **Registration Date:** March 24, 2023

---

## Solution: ImprovMX Email Forwarding

### Why ImprovMX?

- **Free plan** with up to 25 email aliases
- Easy setup with DNS records
- Reliable email forwarding
- No hosting required

### Service URL

- Dashboard: https://app.improvmx.com
- Account email: xiaojunyang0805@gmail.com

---

## Setup Steps

### Step 1: Sign Up for ImprovMX

1. Go to https://improvmx.com
2. Sign up with email: xiaojunyang0805@gmail.com
3. Verify email account

### Step 2: Add Domain to ImprovMX

1. In ImprovMX dashboard, add domain: **seenano.nl**
2. Create email alias: **support@seenano.nl** → **xiaojunyang0805@gmail.com**

### Step 3: Configure DNS Records in Squarespace

Access DNS settings at: https://account.squarespace.com/domains

#### Remove Old MX Records

Delete all existing Google Workspace MX records:
- aspmx.l.google.com
- alt1.aspmx.l.google.com
- alt2.aspmx.l.google.com
- alt3.aspmx.l.google.com
- alt4.aspmx.l.google.com

#### Add ImprovMX MX Records

**MX Record 1:**
```
Type: MX
Host: @
Priority: 10
Data: mx1.improvmx.com
TTL: 3600 (1 hour)
```

**MX Record 2:**
```
Type: MX
Host: @
Priority: 20
Data: mx2.improvmx.com
TTL: 3600 (1 hour)
```

#### Add SPF Record

**TXT Record:**
```
Type: TXT
Host: @
Data: v=spf1 include:spf.improvmx.com ~all
TTL: 3600 (1 hour)
```

### Step 4: Verify DNS Propagation

1. Wait 15-60 minutes for DNS propagation
2. Check at: https://dnschecker.org (search for seenano.nl MX records)
3. Verify in ImprovMX dashboard - should show "Email forwarding active" (green)

### Step 5: Test Email Forwarding

Send test email from a properly authenticated email service to: support@seenano.nl

---

## Current DNS Configuration

### MX Records
```
Priority 10: mx1.improvmx.com
Priority 20: mx2.improvmx.com
```

### SPF Record
```
v=spf1 include:spf.improvmx.com ~all
```

### Other Records
- A records: Point to Squarespace servers (198.185.159.144, 198.185.159.145, 198.49.23.144, 198.49.23.145)
- CNAME records: 
  - www → ext-sq.squarespace.com
  - autoconfig.admin → seenano.nl
  - receiptsort → cname.vercel-dns.com

---

## What Works ✅

1. **Receiving emails** at support@seenano.nl
2. **Email forwarding** to xiaojunyang0805@gmail.com
3. **Multiple email aliases** (up to 25 in free plan)
4. **Emails from properly authenticated senders:**
   - Universities (e.g., x.yang@saxion.nl) ✅
   - Corporate emails with proper DKIM/SPF
   - Gmail, Outlook, Yahoo, and other major providers

---

## What Doesn't Work ❌

1. **Sending emails FROM support@seenano.nl**
   - Free plan only supports receiving/forwarding
   - Would need ImprovMX Premium ($9/month) for SMTP sending

2. **Poorly authenticated email services:**
   - QQ Mail (601404242@qq.com) - lacks proper DKIM/SPF
   - Gets rejected by ImprovMX spam filter (spam score 5.7/5)

3. **Self-forwarding loops:**
   - Cannot send from xiaojunyang0805@gmail.com to support@seenano.nl
   - Gmail blocks mail loops

---

## Testing Results

### Successful Tests ✅
- **From:** x.yang@saxion.nl
- **To:** support@seenano.nl
- **Result:** Successfully delivered to xiaojunyang0805@gmail.com
- **Reason:** Proper DKIM/SPF authentication

### Failed Tests ❌

**Test 1: Self-forwarding**
- **From:** xiaojunyang0805@gmail.com
- **To:** support@seenano.nl
- **Result:** Not delivered (mail loop)

**Test 2: QQ Mail**
- **From:** 601404242@qq.com
- **To:** support@seenano.nl
- **Result:** Rejected as spam (DKIM/SPF issues)
- **Spam Score:** 5.7/5
- **Issues:** DKIM_SIGNED, DKIM_VALID, DMARC_PASS failures

---

## Replying to Emails

When you receive emails at support@seenano.nl and reply from Gmail:
- Replies will come FROM: xiaojunyang0805@gmail.com
- NOT from: support@seenano.nl

**To send from support@seenano.nl:**
- Upgrade to ImprovMX Premium ($9/month)
- OR use Google Workspace (€5-6/month per user)

---

## Troubleshooting

### Email not arriving?

1. **Check spam folder** in Gmail
2. **Check "All Mail"** in Gmail
3. **Search Gmail for:**
   - `from:improvmx.com`
   - `from:support@seenano.nl`

### DNS not propagating?

1. Check DNS propagation: https://dnschecker.org
2. Wait 15-60 minutes (sometimes up to 24-48 hours)
3. Verify in ImprovMX dashboard

### Still being marked as spam?

- ImprovMX free plan has strict spam filtering
- Cannot be adjusted in free plan
- Sender needs proper DKIM/SPF authentication
- Test with Gmail, Outlook, or other major providers

---

## ImprovMX Dashboard Access

**Main sections:**
- **Aliases:** Manage email forwards (support@seenano.nl → xiaojunyang0805@gmail.com)
- **DNS Settings:** View required DNS records and verification status
- **SMTP Credentials:** Premium feature (not available in free plan)
- **Logs:** View all incoming/outgoing emails and delivery status
- **Custom settings:** Notification email, MX verification, whitelabel (Enterprise)

**Check logs to monitor:**
- Successful deliveries (green "DELIVERED")
- Refused emails (red "REFUSED")
- Spam scores and rejection reasons

---

## Future Upgrades

### ImprovMX Premium ($9/month)
**Benefits:**
- SMTP access to send emails FROM support@seenano.nl
- Priority support
- Advanced spam filtering controls
- 100 email aliases (vs 25 in free)

### Google Workspace (€5-6/month per user)
**Benefits:**
- Professional email with full sending/receiving
- Gmail interface
- Google Drive, Calendar, Meet integration
- 30GB-2TB storage
- Custom email addresses

---

## Additional Email Aliases

You can create more aliases in ImprovMX (up to 25 free):
- info@seenano.nl
- contact@seenano.nl
- sales@seenano.nl
- hello@seenano.nl

All can forward to xiaojunyang0805@gmail.com or different addresses.

---

## Important Links

- **ImprovMX Dashboard:** https://app.improvmx.com
- **Squarespace Domains:** https://account.squarespace.com/domains
- **DNS Checker:** https://dnschecker.org
- **ImprovMX Inspector:** https://inspector.improvmx.com/seenano.nl
- **ImprovMX Guides:** https://improvmx.com/guides

---

## Key Takeaways

✅ **Setup is complete and working**  
✅ **Professional email address for free**  
✅ **Receives emails from properly authenticated senders**  
✅ **No hosting or paid services required**  
✅ **Can add up to 25 email aliases**

⚠️ **Limitations:**  
- Cannot send FROM support@seenano.nl (receive only)
- Some email services may be blocked by spam filter
- Replies come from personal Gmail address

---

## Contact Information

**Your Professional Email:**  
support@seenano.nl → forwards to → xiaojunyang0805@gmail.com

**Signature Example:**
```
Best Regards,

Xiaojun Yang
Researcher Applied Nanotechnology

Saxion University of Applied Sciences
Faculty of Life Sciences, Engineering and Design (LED)
M.H. Tromplaan 28 | PO Box 70,000, 7500 KB Enschede

Email: support@seenano.nl
Website: www.seenano.nl
```

---

## Notes

- DNS changes were made on October 13, 2025
- Total setup time: ~1 hour (including DNS propagation)
- Cost: **FREE** with ImprovMX free plan
- Successfully tested with Saxion University email (x.yang@saxion.nl)

---

**End of Guide**

*Last updated: October 13, 2025*

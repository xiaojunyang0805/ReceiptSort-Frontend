# Web Activity Monitoring Guide

**Last Updated:** 2025-10-28
**Application:** ReceiptSort (https://receiptsort.seenano.nl)

---

## Overview

This document outlines the systematic monitoring approach for ReceiptSort using existing tools:
- **Vercel Analytics** - Application performance and user metrics
- **Stripe Dashboard** - Payment and revenue tracking
- **Squarespace Analytics** - Main domain traffic (seenano.nl)

---

## 1. Vercel Analytics & Monitoring

### Access
- Dashboard: https://vercel.com/xiaojunyang0805s-projects/receiptsort
- Navigate to: Project → Analytics tab

### Key Metrics to Monitor

#### **A. Performance Metrics (Real User Monitoring)**
- **Core Web Vitals:**
  - LCP (Largest Contentful Paint): Should be < 2.5s
  - FID (First Input Delay): Should be < 100ms
  - CLS (Cumulative Layout Shift): Should be < 0.1
- **Performance Score:** Target 90+

**How to Check:**
1. Go to Vercel Dashboard → receiptsort → Analytics
2. View "Web Vitals" tab
3. Check scores by page and device type
4. Monitor trends over time

**Action Items:**
- Green scores (Good): Monitor regularly
- Yellow scores (Needs Improvement): Investigate within 1 week
- Red scores (Poor): Immediate optimization required

---

#### **B. Traffic Metrics**
- **Page Views:** Total visits to all pages
- **Unique Visitors:** Individual users visiting the site
- **Top Pages:** Most visited pages on your site
- **Geographic Distribution:** Where users are coming from

**How to Check:**
1. Vercel Dashboard → Analytics → "Audience" tab
2. View data by:
   - Time period (24h, 7d, 30d)
   - Geographic location
   - Device type (mobile, desktop, tablet)

**Key Questions to Answer:**
- Which landing pages are most effective?
- Which countries have the most traffic?
- What's the mobile vs desktop ratio?

---

#### **C. Deployment Health**
- **Build Status:** Success/failure of deployments
- **Build Duration:** Time to deploy
- **Function Execution:** API route performance
- **Edge Network Performance:** Response times by region

**How to Check:**
1. Vercel Dashboard → Deployments
2. Check latest deployment status
3. Review build logs for any warnings/errors

**Monitoring Schedule:**
- After every deployment: Check build success
- Daily: Review function execution times
- Weekly: Analyze edge network performance

---

### Vercel Logs & Error Tracking

**Function Logs:**
1. Vercel Dashboard → Logs
2. Filter by:
   - Deployment
   - Function (API routes)
   - Status (errors, warnings)
   - Time range

**What to Monitor:**
- API errors (500, 400 status codes)
- Slow API responses (> 3s)
- Failed database queries
- OpenAI API timeouts

**Alert Strategy:**
- Check logs daily for errors
- Investigate any 500 errors immediately
- Monitor API response times weekly

---

## 2. Stripe Dashboard Monitoring

### Access
- Dashboard: https://dashboard.stripe.com
- Switch between Test/Live mode as needed

### Key Metrics to Monitor

#### **A. Revenue Metrics**
**Location:** Stripe Dashboard → Home

- **Gross Volume:** Total payment amount processed
- **Successful Charges:** Number of completed payments
- **Net Revenue:** Actual revenue after Stripe fees
- **Average Transaction Value:** Revenue per customer

**How to Check:**
1. Login to Stripe Dashboard
2. View overview metrics on home page
3. Filter by date range (Today, Week, Month, Year)

**Key Questions:**
- What's the average credit package purchased?
- Are customers buying more over time?
- What's the revenue trend (growing/stable/declining)?

---

#### **B. Customer Metrics**
**Location:** Stripe Dashboard → Customers

- **Total Customers:** Number of users who made purchases
- **New Customers:** First-time buyers
- **Returning Customers:** Repeat purchasers
- **Customer Lifetime Value:** Average spend per customer

**How to Track:**
1. Customers tab → View customer list
2. Sort by "Created date" to see new customers
3. Check individual customer payment history

**Success Indicators:**
- Growing new customer count
- Increasing repeat purchase rate (> 20% is good)
- Rising average customer lifetime value

---

#### **C. Payment Success Rate**
**Location:** Stripe Dashboard → Payments

- **Successful Payments:** Completed transactions
- **Failed Payments:** Declined or errored payments
- **Incomplete Payments:** Abandoned checkout sessions

**How to Monitor:**
1. Payments tab → Filter by status
2. Check "Failed" payments for patterns
3. Review "Incomplete" to see cart abandonment rate

**Action Items:**
- Failed payment rate > 5%: Investigate payment flow
- High incomplete rate: Check checkout UX
- Specific card errors: Add better error messages

---

#### **C. Subscription Metrics** (if applicable)
**Location:** Stripe Dashboard → Subscriptions

- **Active Subscriptions:** Current paying subscribers
- **Churn Rate:** Cancellation percentage
- **MRR (Monthly Recurring Revenue):** Predictable income

**Key Questions:**
- How many users prefer subscription vs one-time credits?
- What's the cancellation rate?
- Which subscription tier is most popular?

---

#### **D. Webhook Monitoring**
**Location:** Stripe Dashboard → Developers → Webhooks

- **Webhook Events:** All events sent to your app
- **Success Rate:** Percentage of successful deliveries
- **Failed Events:** Events that need retry

**How to Check:**
1. Developers → Webhooks
2. Click on your webhook endpoint
3. View "Recent events" and "Logs"

**Critical to Monitor:**
- `checkout.session.completed` - Credit purchases
- `invoice.payment_succeeded` - Subscription payments
- `customer.subscription.deleted` - Cancellations

**Alert Threshold:**
- Webhook failure rate > 1%: Investigate immediately
- Response time > 5s: Optimize webhook handler

---

## 3. Squarespace Analytics (seenano.nl)

### Access
- Login to Squarespace: https://account.squarespace.com
- Navigate to: Analytics → Traffic

### Key Metrics to Monitor

#### **A. Referral Traffic to ReceiptSort**
**Why:** Track how many visitors from seenano.nl click through to receiptsort.seenano.nl

**How to Check:**
1. Squarespace Analytics → Traffic → Sources
2. Look for referrals to receiptsort.seenano.nl
3. Check "Outbound Links" clicks

**What to Track:**
- Click-through rate from main site to ReceiptSort
- Which pages on seenano.nl drive most traffic
- Conversion from visitor → click → signup

---

#### **B. Main Site Performance**
**Location:** Squarespace Analytics → Overview

- **Unique Visitors:** Individual users to seenano.nl
- **Page Views:** Total page loads
- **Traffic Sources:** How people find your site
  - Direct: Typed URL or bookmark
  - Search: Google, Bing, etc.
  - Social: Facebook, Twitter, LinkedIn
  - Referral: Other websites

**How to Use:**
- Monitor if seenano.nl drives awareness
- See if blog posts/content attract visitors
- Track if visitors explore ReceiptSort from main site

---

#### **C. Search Keywords**
**Location:** Squarespace Analytics → Search Keywords

- **Top Keywords:** What people search to find you
- **Search Engines:** Google, Bing, etc.

**Action Items:**
- Identify high-performing keywords
- Create content around popular searches
- Optimize SEO for receipt-related keywords

---

## 4. Integrated Monitoring Workflow

### Daily Monitoring (5 minutes)
**Time:** Every morning

1. **Vercel Dashboard** (2 min)
   - Check latest deployment status: ✅ or ❌
   - Review function logs for errors
   - Note: Any 500 errors or failures?

2. **Stripe Dashboard** (2 min)
   - Check today's revenue (Live mode)
   - Count: How many purchases today?
   - Review: Any failed payments?

3. **Quick Health Check** (1 min)
   - Visit https://receiptsort.seenano.nl
   - Test: Can you sign up/login?
   - Test: Is the app loading fast?

---

### Weekly Review (20 minutes)
**Time:** Every Monday morning

1. **Vercel Analytics Deep Dive** (8 min)
   - Review 7-day Web Vitals trend
   - Check top performing pages
   - Analyze geographic distribution
   - Monitor: Any performance degradation?

2. **Stripe Revenue Analysis** (7 min)
   - Calculate: Week-over-week growth
   - Review: Average transaction value
   - Check: Customer retention rate
   - Identify: Most popular credit package

3. **Squarespace Traffic** (5 min)
   - Check: Referrals to ReceiptSort subdomain
   - Review: Blog/content performance
   - Track: Search keyword rankings

**Document Insights:**
- Keep a simple spreadsheet or note
- Track: Weekly revenue, new customers, top traffic sources
- Identify: Trends and patterns

---

### Monthly Report (60 minutes)
**Time:** First Monday of each month

#### **Growth Metrics**
- Total Revenue (MoM growth %)
- New Customers (MoM growth %)
- Average Transaction Value
- Customer Retention Rate

#### **Product Metrics**
- Total Receipts Processed
- Average Receipts per User
- Export Downloads
- Feature Usage (Excel vs CSV, AI Templates)

#### **Performance Metrics**
- Average Web Vitals scores
- API response times
- Error rate (% of requests)
- Uptime percentage

#### **Traffic Metrics**
- Total Visitors (Vercel Analytics)
- Traffic Sources breakdown
- Top landing pages
- Conversion rate (visitor → signup → purchase)

**Create Monthly Summary:**
```
Month: October 2025
Revenue: $X,XXX (+X% MoM)
New Customers: XXX (+X% MoM)
Receipts Processed: X,XXX
Top Traffic Source: [Organic/Referral/Direct]
Key Insight: [One sentence observation]
Action Items: [1-3 things to improve next month]
```

---

## 5. Key Performance Indicators (KPIs)

### Business KPIs
| Metric | Target | How to Track |
|--------|--------|--------------|
| Monthly Revenue | Growing 10% MoM | Stripe Dashboard → Home |
| Customer Acquisition | +50 new customers/month | Stripe → Customers (filter by date) |
| Average Transaction | $15+ | Stripe → Payments (calculate average) |
| Customer Retention | 20%+ returning | Stripe → Customers (repeat purchases) |

### Product KPIs
| Metric | Target | How to Track |
|--------|--------|--------------|
| Receipts Processed | Growing weekly | Supabase Dashboard → receipts table count |
| Export Success Rate | 95%+ | Vercel Logs → API /export/* success rate |
| Average Processing Time | < 5 seconds | Monitor in application logs |
| User Satisfaction | High engagement | Track: Credits used vs purchased |

### Technical KPIs
| Metric | Target | How to Track |
|--------|--------|--------------|
| Core Web Vitals (LCP) | < 2.5s | Vercel Analytics → Web Vitals |
| API Response Time | < 3s | Vercel → Functions performance |
| Error Rate | < 1% | Vercel Logs → Error count / total requests |
| Uptime | 99.9% | Vercel → Deployments status history |

### Traffic KPIs
| Metric | Target | How to Track |
|--------|--------|--------------|
| Unique Visitors | Growing 20% MoM | Vercel Analytics → Audience |
| Conversion Rate | 5%+ (visitor → signup) | Calculate: Signups / Visitors |
| Mobile Traffic | 40%+ | Vercel Analytics → Device breakdown |
| Referral Traffic | Growing | Squarespace → Outbound links |

---

## 6. Alert & Action Triggers

### Immediate Action Required (Fix within 24h)

| Alert | Threshold | Where to Check | Action |
|-------|-----------|----------------|--------|
| Site Down | Uptime < 99% | Visit receiptsort.seenano.nl | Check Vercel deployment status |
| API Errors | Error rate > 5% | Vercel → Logs | Review error logs, fix bugs |
| Payment Failures | Failure rate > 10% | Stripe → Payments | Check Stripe webhook, test checkout flow |
| Web Vitals Drop | LCP > 4s | Vercel Analytics | Investigate performance regression |

### Weekly Review Items (Fix within 7 days)

| Issue | Threshold | Where to Check | Action |
|-------|-----------|----------------|--------|
| Slow API | Response time > 5s | Vercel → Functions | Optimize database queries |
| High Bounce Rate | > 70% on landing | Vercel Analytics | Improve landing page UX |
| Low Conversion | < 2% signup rate | Calculate manually | A/B test CTAs, improve copy |
| Webhook Failures | > 1% failure rate | Stripe → Webhooks | Debug webhook handler |

### Monthly Optimization (Address in next sprint)

| Opportunity | Indicator | Where to Check | Action |
|-------------|-----------|----------------|--------|
| Geographic Expansion | High traffic from new region | Vercel Analytics → Geography | Add language support |
| Feature Adoption | Low usage of AI templates | Track in application | Improve feature visibility |
| Pricing Optimization | High cart abandonment | Stripe → Incomplete payments | Test different pricing |
| SEO Improvement | Low organic traffic | Squarespace → Search Keywords | Create content, optimize SEO |

---

## 7. Monitoring Tools Summary

### Vercel (Application Performance)
- **URL:** https://vercel.com/xiaojunyang0805s-projects/receiptsort
- **Check:** Daily (deployments), Weekly (analytics)
- **Focus:** Performance, errors, traffic, deployments

### Stripe (Revenue & Payments)
- **URL:** https://dashboard.stripe.com
- **Check:** Daily (revenue), Weekly (trends), Monthly (growth)
- **Focus:** Revenue, customers, payment success rate, webhooks

### Squarespace (Main Site Traffic)
- **URL:** https://account.squarespace.com (seenano.nl analytics)
- **Check:** Weekly (referrals), Monthly (overall traffic)
- **Focus:** Referral traffic to ReceiptSort, SEO performance

### Supabase (Database & Users)
- **URL:** https://supabase.com/dashboard
- **Check:** Weekly (database health), Monthly (user growth)
- **Focus:** User count, receipts processed, storage usage, API usage

---

## 8. Monitoring Checklist Templates

### Daily Checklist (5 min)
```
Date: ________

□ Vercel: Latest deployment successful?
□ Vercel: Any critical errors in logs?
□ Stripe: Today's revenue: $____
□ Stripe: Number of purchases: ____
□ Stripe: Any payment failures? ____
□ Quick test: App loading and functional?

Notes: _________________________________
```

### Weekly Checklist (20 min)
```
Week of: ________

Vercel Analytics:
□ Web Vitals: LCP __s, FID __ms, CLS __
□ Top 3 pages: 1)____ 2)____ 3)____
□ Traffic growth: ___% vs last week
□ Geographic distribution reviewed

Stripe Dashboard:
□ Weekly revenue: $____ (___% vs last week)
□ New customers: ____
□ Payment success rate: ___%
□ Webhook status: OK / Issues: ____

Squarespace:
□ Referrals to ReceiptSort: ____
□ Top traffic sources: ____

Action Items:
1. ________________________________
2. ________________________________
```

### Monthly Checklist (60 min)
```
Month: ________

Business Metrics:
□ Total Revenue: $____ (MoM growth: ___%)
□ New Customers: ____ (MoM growth: ___%)
□ Avg Transaction: $____
□ Retention Rate: ___%

Product Metrics:
□ Receipts Processed: ____
□ Export Downloads: ____
□ Active Users: ____

Technical Health:
□ Avg Web Vitals: LCP __s, FID __ms, CLS __
□ Error Rate: ___%
□ Uptime: ___%
□ API Response Time: __s

Traffic Sources:
□ Organic: ___%
□ Direct: ___%
□ Referral: ___%
□ Social: ___%

Top Insights:
1. ________________________________
2. ________________________________
3. ________________________________

Next Month Goals:
1. ________________________________
2. ________________________________
3. ________________________________
```

---

## 9. Quick Reference Links

### Production URLs
- **Main App:** https://receiptsort.vercel.app
- **Custom Domain:** https://receiptsort.seenano.nl
- **Main Site:** https://seenano.nl

### Admin Dashboards
- **Vercel:** https://vercel.com/xiaojunyang0805s-projects/receiptsort
- **Stripe (Live):** https://dashboard.stripe.com
- **Supabase:** https://supabase.com/dashboard/project/_
- **Squarespace:** https://account.squarespace.com

### Documentation
- **Vercel Analytics Docs:** https://vercel.com/docs/analytics
- **Stripe Dashboard Guide:** https://stripe.com/docs/dashboard
- **Squarespace Analytics:** https://support.squarespace.com/hc/en-us/articles/205812378

---

## 10. Next Steps: Advanced Monitoring (Future)

Once the business grows, consider adding:

### **Google Analytics 4**
- More detailed user behavior tracking
- Conversion funnel analysis
- Audience segmentation
- Free tier available

### **Sentry (Error Monitoring)**
- Automatic error reporting
- Stack traces and context
- Performance monitoring
- Free tier: 5,000 errors/month

### **PostHog (Product Analytics)**
- Feature flag management
- A/B testing
- Session recordings
- User journey analysis

### **UptimeRobot (Uptime Monitoring)**
- Automated uptime checks every 5 minutes
- Email/SMS alerts when site is down
- Free tier: 50 monitors

---

**Remember:** Start simple with existing tools (Vercel + Stripe + Squarespace), then expand as needed. Focus on actionable insights, not vanity metrics.

**Key Principle:** Monitor → Analyze → Act → Improve → Repeat 🔄

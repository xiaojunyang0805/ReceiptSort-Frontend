# Cron Job Setup - Export Cleanup

This document explains the automated cleanup system for old export files.

## Overview

The system automatically deletes export files and database records older than 30 days to prevent storage bloat.

## Components

### 1. Cron API Endpoint
**File:** `src/app/api/cron/cleanup-exports/route.ts`
- Handles the cleanup logic
- Secured with `CRON_SECRET` environment variable
- Deletes files from Supabase Storage
- Deletes database records from `exports` table

### 2. Vercel Cron Configuration
**File:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-exports",
      "schedule": "0 2 * * *"
    }
  ]
}
```
- Runs daily at 2:00 AM UTC
- Automatically triggered by Vercel

### 3. Manual Cleanup Script
**File:** `scripts/cleanup-old-exports.mjs`
- For manual testing or local cleanup
- Run: `node scripts/cleanup-old-exports.mjs`

## Setup Instructions

### ✅ Already Completed:
1. ✓ CRON_SECRET generated and added to `.env.local`
2. ✓ CRON_SECRET added to Vercel environment variables (production)
3. ✓ Cron job configured in `vercel.json`

### Next: Deploy to Vercel
```bash
npm run build    # Verify build succeeds
vercel --prod    # Deploy to production
```

## How It Works

1. **Vercel** calls `/api/cron/cleanup-exports` daily at 2 AM UTC
2. The endpoint verifies the `CRON_SECRET` header
3. Queries database for exports older than 30 days
4. For each old export:
   - Deletes the file from Supabase Storage
   - Deletes the database record
5. Returns a summary of deletions

## Testing

### Test the cron endpoint manually:
```bash
# Get your CRON_SECRET from .env.local
curl -X GET https://receiptsort.seenano.nl/api/cron/cleanup-exports \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
```

### Check Vercel cron logs:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Deployments" → "Functions" → "Cron Jobs"
4. View execution logs

## Monitoring

The cron job logs all actions:
- Number of exports found
- Files deleted
- Records deleted
- Any errors encountered

Check logs in Vercel Dashboard under Function Logs.

## Configuration

### Change cleanup schedule:
Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-exports",
      "schedule": "0 3 * * *"  // 3 AM UTC
    }
  ]
}
```

### Change retention period:
Edit `src/app/api/cron/cleanup-exports/route.ts`:
```typescript
const RETENTION_DAYS = 30  // Change this value
```

## Security

- The endpoint is protected by `CRON_SECRET`
- Only requests from Vercel's cron service with correct secret can execute
- Uses Supabase service role key for database/storage access

## Troubleshooting

### Cron not running?
1. Check Vercel Dashboard → Cron Jobs
2. Verify `vercel.json` is committed
3. Ensure CRON_SECRET is set in Vercel environment variables

### Files not being deleted?
1. Check Function Logs in Vercel
2. Test manually using curl command above
3. Verify Supabase Storage permissions

### Need to run cleanup immediately?
Use the manual script:
```bash
node scripts/cleanup-old-exports.mjs
```

## Important Notes

- The cron job runs in UTC time
- 2:00 AM UTC = 10:00 PM EST (previous day) / 7:00 PM PST (previous day)
- Deleted files cannot be recovered
- Users see expiration warnings in Export History dialog before deletion

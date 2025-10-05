# Vercel CLI Setup Guide

## Step 1: Authenticate Vercel CLI

Run this command to authenticate:
```bash
vercel login
```

This will:
1. Open your browser
2. Ask you to confirm authentication
3. Save the token locally

## Step 2: Link Project

After authentication, link the project:
```bash
cd D:\receiptsort
vercel link
```

Follow the prompts:
- Select your Vercel account
- Choose existing project: **receiptsort**
- Link to existing project

## Step 3: Common Vercel CLI Commands

### Check deployments
```bash
vercel ls
```

### Deploy manually
```bash
vercel --prod
```

### Check deployment status
```bash
vercel inspect <deployment-url>
```

### Cancel a deployment
```bash
vercel remove <deployment-id> --yes
```

### Redeploy latest commit
```bash
vercel --prod --force
```

### View logs
```bash
vercel logs <deployment-url>
```

## Step 4: Useful for Debugging

### List all deployments
```bash
vercel ls --all
```

### Check environment variables
```bash
vercel env ls
```

### Pull environment variables locally
```bash
vercel env pull
```

---

## Next Steps After Setup:

Once authenticated and linked, you can:
1. Deploy directly from CLI: `vercel --prod`
2. Check deployment status without opening browser
3. Cancel stuck deployments: `vercel remove <deployment-id>`
4. View real-time logs

This will be very useful for debugging deployment issues!

# Developer Tools

Utilities and resources for local development.

## 📁 Structure

### `/env/`
Environment configuration templates and examples
- .env.local.template - Template for local development
- .env.production - Production reference (DO NOT commit real values)
- .env.vercel.production - Vercel env reference

**Setup:**
```bash
cp tools/env/.env.local.template .env.local
# Fill in your actual values
```

### `/temp/`
Temporary test scripts and one-off utilities
- Gitignored folder for quick experiments
- Safe place for debugging scripts
- Cleaned up regularly

## ⚠️ Important

- Never commit real secrets to `/env/` files
- Use `.env.local` for actual development (gitignored)
- `/temp/` is gitignored - safe for experiments

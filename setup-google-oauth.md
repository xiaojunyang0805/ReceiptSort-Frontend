# Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure the OAuth consent screen if needed
6. Select **Web application** as application type
7. Add authorized redirect URIs:
   ```
   https://xalcrmpqhtakgkqiyere.supabase.co/auth/v1/callback
   ```
8. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere)
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list
4. Toggle it **ON**
5. Paste your **Google Client ID**
6. Paste your **Google Client Secret**
7. Click **Save**

## Step 3: Verify Configuration

After enabling, your Google OAuth should work at:
- https://receiptsort.vercel.app/login
- https://receiptsort.vercel.app/signup

## Troubleshooting

### If you see "provider is not enabled":
- Make sure Google is toggled ON in Supabase
- Wait 1-2 minutes after enabling for changes to propagate
- Clear browser cache and try again

### If you see "Database error for user":
This is a separate issue with the profile creation trigger. Run:
```bash
npm run validate:schema
```

To check if the trigger exists and is working correctly.

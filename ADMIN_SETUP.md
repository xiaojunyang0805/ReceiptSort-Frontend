# Admin Panel Setup Guide

This guide explains how to set up admin access for the ReceiptSort admin panel.

## Overview

The admin panel uses a role-based access control system with an `is_admin` column in the `profiles` table. Only users with `is_admin = true` can access the admin panel and admin API endpoints.

## Security Features

✅ **Database-level admin flag** - Stored securely in profiles table
✅ **API route protection** - All admin endpoints verify admin status
✅ **Client-side protection** - Admin page redirects non-admins
✅ **Conditional UI** - Admin link only shown to admins
✅ **JWT token verification** - All requests authenticated

## Setup Steps

### 1. Add `is_admin` Column to Database

You need to add the `is_admin` column to your Supabase `profiles` table.

**Option A: Using Supabase SQL Editor (Recommended)**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this SQL:

```sql
-- Add is_admin column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
```

**Option B: Using the provided SQL file**

Run the SQL commands in `scripts/add-admin-column.sql`

### 2. Set Admin Users

After adding the column, set specific users as admins:

```sql
-- Set xiaojunyang0805@gmail.com as admin
UPDATE profiles
SET is_admin = TRUE
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'xiaojunyang0805@gmail.com'
);
```

**Or use the TypeScript script:**

```bash
npm run setup:admin
```

Add this script to your `package.json`:

```json
{
  "scripts": {
    "setup:admin": "tsx scripts/setup-admin.ts"
  }
}
```

### 3. Verify Admin Access

Check that the admin user was set correctly:

```sql
SELECT
  u.email,
  p.is_admin,
  p.credits
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = TRUE;
```

### 4. Deploy Changes

Once the database is updated, deploy your application:

```bash
npm run build
git add -A
git commit -m "Add admin access control"
git push
```

## How It Works

### Admin Check Flow

```
User visits /admin
  ↓
Check if user is logged in
  ↓ (not logged in)
Redirect to /login
  ↓ (logged in)
Check if user.is_admin = true
  ↓ (not admin)
Redirect to /dashboard with error
  ↓ (is admin)
Show admin panel
```

### API Protection

All admin API routes (`/api/admin/*`) verify:

1. **Authentication**: Valid JWT token in Authorization header
2. **Admin Status**: User has `is_admin = true` in database

If either check fails, returns `403 Forbidden`.

### Client Protection

- Admin page checks access on mount
- Non-admins are redirected to dashboard
- Admin link hidden in sidebar for non-admins

## Adding More Admins

To add another admin user:

1. Find their user ID:
```sql
SELECT id, email FROM auth.users WHERE email = 'newadmin@example.com';
```

2. Set admin flag:
```sql
UPDATE profiles SET is_admin = TRUE WHERE id = '<user-id>';
```

Or use the admin panel itself (if you're already an admin) - coming soon!

## Removing Admin Access

To revoke admin access:

```sql
UPDATE profiles
SET is_admin = FALSE
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);
```

## Troubleshooting

### "Admin access required" error

**Cause**: User doesn't have `is_admin = true` in database

**Solution**: Run the SQL update command to set the user as admin

### Admin link not showing in sidebar

**Cause**: `is_admin` check hasn't completed yet or column doesn't exist

**Solution**:
1. Ensure `is_admin` column exists in profiles table
2. Refresh the page
3. Check browser console for errors

### API returns 403 Forbidden

**Cause**: JWT token not included or user not admin

**Solution**:
1. Ensure you're logged in
2. Check that your user has `is_admin = true` in database
3. Clear browser cache and cookies, then login again

## Security Best Practices

✅ **Limit admin users** - Only give admin access to trusted users
✅ **Monitor admin actions** - Log all admin API calls (implement audit log)
✅ **Use strong passwords** - Admin accounts should have strong passwords
✅ **Regular audits** - Periodically review who has admin access
✅ **Separate admin accounts** - Consider separate accounts for admin tasks

## Files Changed

- `src/lib/admin.ts` - Admin utility functions
- `src/app/api/admin/users/route.ts` - User search API with auth
- `src/app/api/admin/credits/route.ts` - Credit adjustment API with auth
- `src/app/[locale]/(dashboard)/admin/page.tsx` - Admin panel page
- `src/components/dashboard/Sidebar.tsx` - Conditional admin link
- `scripts/add-admin-column.sql` - Database migration SQL
- `scripts/setup-admin.ts` - Admin setup script

## Next Steps

After setup is complete:

1. Login as the admin user (xiaojunyang0805@gmail.com)
2. Navigate to /admin
3. Search for users by email
4. Adjust user credits as needed

## Support

For issues or questions, check:
- Application logs in Vercel
- Supabase logs in Dashboard
- Browser console for client-side errors

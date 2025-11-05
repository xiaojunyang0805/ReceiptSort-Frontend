# Supabase Database Update Instructions

## CRITICAL: Update Free Starter Credits from 10 to 20

**Time Required:** 5 minutes
**Risk Level:** LOW (only affects new signups)

---

## Step-by-Step Instructions

### 1. Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your **ReceiptSort** project
3. Click **SQL Editor** in the left sidebar

### 2. Find the Current Trigger Function

Run this query to see the current `handle_new_user()` function:

```sql
SELECT
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc
WHERE proname = 'handle_new_user';
```

This will show you the current function code.

### 3. Update the Function

Copy and paste this SQL to update the default credits to 20:

```sql
-- Update handle_new_user() function to give 20 free credits instead of 10
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    20,  -- Changed from 10 to 20
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
```

Click **RUN** to execute.

### 4. Verify the Update

Run this test query to ensure the function was updated:

```sql
SELECT prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';
```

**Expected output:** You should see `20` in the credits value (not `10`).

### 5. (Optional) Update Table Default Value

For extra safety, also update the default value on the `profiles` table:

```sql
ALTER TABLE public.profiles
ALTER COLUMN credits SET DEFAULT 20;
```

---

## Testing the Changes

### Test with a New Account

1. Create a NEW user account (sign up with a different email)
2. After signup, check the dashboard
3. **Expected:** Should show **20 credits** (not 10)

### SQL Query to Check All New Users

```sql
SELECT
    id,
    email,
    credits,
    created_at
FROM public.profiles
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

All users created after the update should have 20 credits.

---

## Alternative: If Function Structure is Different

If your `handle_new_user()` function looks different, just find the line that sets `credits` and change:

**From:**
```sql
credits = 10
```

**To:**
```sql
credits = 20
```

The exact syntax may vary depending on how your function was originally written.

---

## Troubleshooting

### Issue: Function doesn't exist

If you get an error that the function doesn't exist, you may need to create it from scratch:

```sql
-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (NEW.id, NEW.email, 20);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Issue: Permission denied

Make sure you're logged in as the **admin/owner** of the Supabase project. Only project admins can modify database functions.

### Issue: Trigger not firing

Check if the trigger exists:

```sql
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

If it doesn't exist, recreate it using the SQL above.

---

## Verification Checklist

After making the changes:

- [ ] SQL query runs without errors
- [ ] Function source shows `20` (not `10`)
- [ ] Test signup shows 20 credits in dashboard
- [ ] Existing users still have their credit balances (unchanged)

---

## Existing Users

**Important:** This change ONLY affects NEW signups. Existing users keep their current credit balance.

If you want to give existing users bonus credits:

```sql
-- Give all existing users +10 bonus credits
UPDATE public.profiles
SET credits = credits + 10
WHERE credits < 100;  -- Only users with less than 100 credits

-- Record the bonus in credit_transactions table
INSERT INTO public.credit_transactions (user_id, amount, type, description)
SELECT
    id,
    10,
    'bonus',
    'Pricing update bonus - thank you for being an early user!'
FROM public.profiles
WHERE credits < 100;
```

---

## Rollback

If you need to revert back to 10 credits:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (NEW.id, NEW.email, 10);  -- Back to 10
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

**Last Updated:** November 4, 2025
**Status:** Ready to execute
**Estimated Time:** 5 minutes

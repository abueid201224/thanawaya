# Supabase Database Configuration

This directory contains SQL scripts for setting up the Thanaweya Amma Math Copilot database on Supabase.

## Quick Start

### 1. Create a new Supabase project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Enter project name: `thanaweya-math-copilot`
4. Select your organization
5. Choose database password
6. Select region (recommend: `eu-central-1` or `us-east-1`)
7. Click "Create Project"

### 2. Get your connection details

After project creation:
1. Go to Project Settings → API
2. Copy these values:
   - **Project URL**: `https://YOUR-PROJECT-REF.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep this secret!)

### 3. Set up environment variables

In your `.env.production` file:
```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**NEVER** expose the service_role key in client-side code!

## Database Setup

### Option A: Using Supabase SQL Editor

1. Go to your Supabase project → SQL Editor
2. Click "New Query"
3. Copy and paste the contents of these files in order:
   - `001_create_student_profiles_table.sql`
   - `002_enable_rls.sql`
4. Click "Run" for each query

### Option B: Using psql CLI

```bash
# Install psql if not already installed
# Connect to your Supabase database
psql -h YOUR-PROJECT-REF.supabase.co -p 5432 -U postgres -d postgres

# Run the SQL scripts
\i database/supabase/001_create_student_profiles_table.sql
\i database/supabase/002_enable_rls.sql
```

### Option C: Using Supabase Migration Tool

```bash
# Install supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref YOUR-PROJECT-REF

# Apply migrations
supabase db push
```

## RLS Configuration

Row Level Security (RLS) is enabled on the `student_profiles` table with the following policies:

### Access Rules

| Action | User | Admin |
|--------|------|-------|
| SELECT | Own profile only | All profiles |
| INSERT | Own profile only | Any profile |
| UPDATE | Own profile only | Any profile |
| DELETE | Own profile only | Any profile |

### How Admin Status Works

A user is considered an admin if:
1. Their `auth.users.raw_user_meta_data->>'role'` equals `'admin'`, OR
2. Their `student_profiles.role` equals `'admin'`

### Creating an Admin User

To create an admin user, you have two options:

**Option 1: Using Supabase Auth (Recommended)**
```sql
-- First, sign up the user normally
-- Then update their metadata:
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

**Option 2: Using student_profiles table**
```sql
INSERT INTO student_profiles (id, email, full_name, role)
VALUES ('user-uuid-here', 'admin@example.com', 'Admin Name', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

## Testing RLS

### Test as Regular User
```sql
-- This should only return the current user's profile
SELECT * FROM student_profiles;

-- This should fail (trying to access another user's profile)
SELECT * FROM student_profiles WHERE id = 'other-user-uuid';
```

### Test as Admin
```sql
-- As admin, this should return all profiles
SELECT * FROM student_profiles;

-- Admin can update any profile
UPDATE student_profiles SET full_name = 'New Name' WHERE id = 'any-user-uuid';
```

## Security Best Practices

1. **Never expose service_role key** in client-side code
2. **Use RLS** on all tables that store user data
3. **Validate all inputs** on the client and server
4. **Use prepared statements** to prevent SQL injection
5. **Monitor database activity** in Supabase dashboard
6. **Set up database backups** in Supabase settings

## Troubleshooting

### "Permission denied for table student_profiles"
- Make sure RLS is enabled: `ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;`
- Check your policies are correct
- Verify the user is authenticated

### "No rows returned"
- Check if the user has a profile in the table
- Verify the user's ID matches the profile ID
- Test with admin privileges to see if data exists

### "New profiles not appearing"
- Check INSERT policies
- Verify the user ID is being set correctly
- Ensure the profile was created successfully

## Additional Tables (Optional)

For a complete application, you might want to add:

```sql
-- Study progress table
CREATE TABLE study_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  subject_name_ar TEXT NOT NULL,
  completed_chapters INTEGER DEFAULT 0,
  total_chapters INTEGER DEFAULT 0,
  mastery_percentage INTEGER DEFAULT 0,
  last_studied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam results table
CREATE TABLE exam_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Support

For issues with Supabase configuration:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community Discord](https://discord.supabase.com/)
- [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)

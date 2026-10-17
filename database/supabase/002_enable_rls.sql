-- Supabase Row Level Security (RLS) Configuration
-- Version: 1.0.0
-- Description: Enables RLS and creates policies for student_profiles table

-- Enable Row Level Security on student_profiles table
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SELECT Policies
-- ============================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON student_profiles
FOR SELECT
USING (
  auth.uid() = id
);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON student_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM student_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy: Allow public read access for guest mode (if needed)
-- Uncomment if you want to allow unauthenticated read access
-- CREATE POLICY "Public can view profiles"
-- ON student_profiles
-- FOR SELECT
-- USING (true);

-- ============================================
-- INSERT Policies
-- ============================================

-- Policy: Users can create their own profile
CREATE POLICY "Users can create their own profile"
ON student_profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id
);

-- Policy: Admins can create any profile
CREATE POLICY "Admins can create any profile"
ON student_profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM student_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- ============================================
-- UPDATE Policies
-- ============================================

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON student_profiles
FOR UPDATE
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Policy: Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON student_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM student_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM student_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- ============================================
-- DELETE Policies
-- ============================================

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
ON student_profiles
FOR DELETE
USING (
  auth.uid() = id
);

-- Policy: Admins can delete any profile
CREATE POLICY "Admins can delete any profile"
ON student_profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM student_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- ============================================
-- Utility: Function to check if user is admin
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM student_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Test RLS Configuration
-- ============================================

-- To test RLS, run these queries as different users:

-- As a regular user (should only see their own profile):
-- SELECT * FROM student_profiles;

-- As an admin (should see all profiles):
-- SET role 'admin';
-- SELECT * FROM student_profiles;

-- Note: In Supabase, admin status is determined by:
-- 1. The auth.users.raw_user_meta_data->>'role' field
-- 2. Or the student_profiles.role field for existing users

-- ==========================================================
-- FacultyOS - Database Migration 003: Fix Missing Table Privileges & Restricted Student RLS
-- ==========================================================
-- This is an ADDITIVE, non-destructive migration.
-- It does NOT drop or recreate existing tables or data.
-- Addresses:
--   1. Missing table SELECT/INSERT/UPDATE privileges on public tables for the 'authenticated' role.
--   2. Strict least-privilege: anon role is granted NO access to sensitive tables (faculty_profiles, students).
--   3. Missing SELECT policy on 'students' restricting access to authorized mentors, assigned class teachers, and coordinators.
--   4. Assumes 'auth_user_id' column on 'faculty_profiles' matching auth.uid().

-- Step 1: Ensure Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Step 2: Grant Table Privileges to 'authenticated' role only
-- Core Academic Reference Tables (SELECT for all authenticated faculty)
GRANT SELECT ON departments TO authenticated;
GRANT SELECT ON academic_classes TO authenticated;
GRANT SELECT ON class_sections TO authenticated;
GRANT SELECT ON college_class_groups TO authenticated;
GRANT SELECT ON subjects TO authenticated;

-- Timetable (SELECT for viewing schedules, INSERT/UPDATE for timetable management)
GRANT SELECT, INSERT, UPDATE, DELETE ON timetable_entries TO authenticated;

-- Faculty Profiles (SELECT for faculty directory/lookups, UPDATE for self-profile edit)
GRANT SELECT, UPDATE ON faculty_profiles TO authenticated;

-- Students (SELECT only for authenticated users; row access governed strictly by RLS below)
GRANT SELECT ON students TO authenticated;

-- Sequence Privileges (for UUID or auto-incrementing IDs if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 3: Explicitly revoke sensitive table access from 'anon' (Least-Privilege Defense in Depth)
REVOKE ALL ON faculty_profiles FROM anon;
REVOKE ALL ON students FROM anon;
REVOKE ALL ON timetable_entries FROM anon;

-- Step 4: Add Restricted RLS Policy for 'students'
-- Ensure RLS is active on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authorized faculty student view policy" ON students;
DROP POLICY IF EXISTS "Restricted student view for authorized faculty" ON students;

CREATE POLICY "Restricted student view for authorized faculty"
ON students
FOR SELECT
TO authenticated
USING (
  -- Condition 1: Current faculty is the assigned mentor
  mentor_id IN (
    SELECT id FROM faculty_profiles WHERE auth_user_id = auth.uid()
  )
  OR
  -- Condition 2: Current faculty teaches this student's class group in timetable
  class_group_id IN (
    SELECT class_group_id FROM timetable_entries
    WHERE faculty_id IN (SELECT id FROM faculty_profiles WHERE auth_user_id = auth.uid())
       OR substitute_faculty_id IN (SELECT id FROM faculty_profiles WHERE auth_user_id = auth.uid())
  )
  OR
  -- Condition 3: Faculty holds institutional supervisory role (HOD, Coordinator, Admin)
  EXISTS (
    SELECT 1 FROM faculty_profiles
    WHERE auth_user_id = auth.uid()
    AND (
      'hod' = ANY(roles)
      OR 'academic_coordinator' = ANY(roles)
      OR 'exam_coordinator' = ANY(roles)
      OR 'admin' = ANY(roles)
    )
  )
);

-- Step 5: Ensure 'faculty_profiles' allows faculty to see colleague profiles (for substitutions and co-teaching)
-- while ensuring update is restricted strictly to their own profile
DROP POLICY IF EXISTS "Faculty can update their own profile" ON faculty_profiles;
CREATE POLICY "Faculty can update their own profile"
ON faculty_profiles
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated faculty can view faculty directory" ON faculty_profiles;
CREATE POLICY "Authenticated faculty can view faculty directory"
ON faculty_profiles
FOR SELECT
TO authenticated
USING (true);

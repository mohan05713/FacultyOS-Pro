-- ==========================================================
-- FacultyOS - Database Migration 001: Core Schema
-- Tables: departments, academic_classes, class_sections,
--         students, faculty_profiles, subjects,
--         college_class_groups, timetable_entries
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    hod_faculty_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Academic Classes (Programs & Batches)
CREATE TABLE IF NOT EXISTS academic_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    degree VARCHAR(50) NOT NULL,
    batch_year VARCHAR(50) NOT NULL,
    current_semester INT NOT NULL DEFAULT 1,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Class Sections
CREATE TABLE IF NOT EXISTS class_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_class_id UUID REFERENCES academic_classes(id) ON DELETE CASCADE,
    section_name VARCHAR(10) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    student_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. College Class Groups (e.g. CSE-3A, IT-2B)
CREATE TABLE IF NOT EXISTS college_class_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    academic_class_id UUID REFERENCES academic_classes(id) ON DELETE CASCADE,
    class_section_id UUID REFERENCES class_sections(id) ON DELETE SET NULL,
    semester INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Faculty Profiles
CREATE TABLE IF NOT EXISTS faculty_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    faculty_id VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(100) NOT NULL,
    qualification VARCHAR(150),
    specialization VARCHAR(255),
    office_room VARCHAR(50),
    office_hours VARCHAR(100),
    roles TEXT[] DEFAULT ARRAY['faculty'],
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    register_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    class_group_id UUID REFERENCES college_class_groups(id) ON DELETE CASCADE,
    semester INT NOT NULL,
    parent_name VARCHAR(255),
    parent_phone VARCHAR(50),
    mentor_id UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'detained', 'on_leave')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    semester INT NOT NULL,
    credits INT NOT NULL DEFAULT 3,
    type VARCHAR(50) DEFAULT 'Theory' CHECK (type IN ('Theory', 'Practical', 'Tutorial', 'Project')),
    contact_hours_per_week INT NOT NULL DEFAULT 4,
    total_planned_hours INT NOT NULL DEFAULT 45,
    completed_hours INT DEFAULT 0,
    assigned_faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
    syllabus_url TEXT,
    course_objectives TEXT[] DEFAULT ARRAY[]::TEXT[],
    course_outcomes TEXT[] DEFAULT ARRAY[]::TEXT[],
    prerequisites TEXT[] DEFAULT ARRAY[]::TEXT[],
    reference_books TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Timetable Entries
CREATE TABLE IF NOT EXISTS timetable_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 10),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_group_id UUID REFERENCES college_class_groups(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    is_lab BOOLEAN DEFAULT FALSE,
    lab_name VARCHAR(100),
    is_substitution BOOLEAN DEFAULT FALSE,
    substitute_faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
    original_faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_faculty_period UNIQUE (day_of_week, period_number, faculty_id),
    CONSTRAINT unique_room_period UNIQUE (day_of_week, period_number, room_number)
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_timetable_faculty ON timetable_entries(faculty_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable_entries(class_group_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_group_id);
CREATE INDEX IF NOT EXISTS idx_subjects_faculty ON subjects(assigned_faculty_id);

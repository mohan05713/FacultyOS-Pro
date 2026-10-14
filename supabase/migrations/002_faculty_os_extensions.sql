-- ==========================================================
-- FacultyOS - Database Migration 002: Advanced Modules & RLS
-- ==========================================================

-- 9. Course Units & Syllabus
CREATE TABLE IF NOT EXISTS course_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    unit_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    planned_hours INT NOT NULL DEFAULT 9,
    completed_hours INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    topics JSONB DEFAULT '[]'::JSONB,
    course_outcomes_mapped TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_subject_unit UNIQUE (subject_id, unit_number)
);

-- 10. Lesson Plans
CREATE TABLE IF NOT EXISTS lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_group_id UUID REFERENCES college_class_groups(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES course_units(id) ON DELETE SET NULL,
    unit_number INT NOT NULL,
    topic VARCHAR(255) NOT NULL,
    learning_objectives TEXT[] DEFAULT ARRAY[]::TEXT[],
    expected_outcomes TEXT[] DEFAULT ARRAY[]::TEXT[],
    prerequisite_knowledge TEXT[] DEFAULT ARRAY[]::TEXT[],
    teaching_methodology VARCHAR(100) DEFAULT 'Lecture',
    teaching_type VARCHAR(50) DEFAULT 'Lecture',
    teaching_aids TEXT[] DEFAULT ARRAY[]::TEXT[],
    duration_minutes INT DEFAULT 50,
    planned_date DATE NOT NULL,
    actual_date DATE,
    status VARCHAR(50) DEFAULT 'Planned',
    homework_or_follow_up TEXT,
    reflection_notes TEXT,
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    is_ai_assisted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Teaching Logs
CREATE TABLE IF NOT EXISTS teaching_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_group_id UUID REFERENCES college_class_groups(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    period_number INT NOT NULL,
    topic_covered TEXT NOT NULL,
    methodology_used VARCHAR(100),
    hours_spent NUMERIC(3,1) DEFAULT 1.0,
    student_engagement_rating INT CHECK (student_engagement_rating BETWEEN 1 AND 5),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Attendance Sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    period_number INT NOT NULL,
    timetable_entry_id UUID REFERENCES timetable_entries(id) ON DELETE SET NULL,
    class_group_id UUID REFERENCES college_class_groups(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    room_number VARCHAR(50),
    total_students INT DEFAULT 0,
    present_count INT DEFAULT 0,
    absent_count INT DEFAULT 0,
    late_count INT DEFAULT 0,
    leave_count INT DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    audit_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_class_period_date UNIQUE (date, period_number, class_group_id)
);

-- 13. Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Authorized Leave')),
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_session_student UNIQUE (session_id, student_id)
);

-- 14. Assignments & Submissions
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_group_id UUID REFERENCES college_class_groups(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    max_marks INT NOT NULL DEFAULT 20,
    rubric JSONB DEFAULT '[]'::JSONB,
    due_date TIMESTAMPTZ NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    allow_resubmission BOOLEAN DEFAULT FALSE,
    submission_count INT DEFAULT 0,
    graded_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    is_late BOOLEAN DEFAULT FALSE,
    file_url TEXT,
    file_name VARCHAR(255),
    marks_awarded NUMERIC(5,2),
    feedback TEXT,
    status VARCHAR(50) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Graded', 'Resubmission Required')),
    graded_at TIMESTAMPTZ,
    CONSTRAINT unique_assignment_student UNIQUE (assignment_id, student_id)
);

-- 15. Assessments & Marks
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_group_id UUID REFERENCES college_class_groups(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    max_marks INT NOT NULL DEFAULT 50,
    weightage_percent INT DEFAULT 20,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_absent BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_assessment_student UNIQUE (assessment_id, student_id)
);

-- 16. Question Bank
CREATE TABLE IF NOT EXISTS question_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    unit_number INT NOT NULL,
    topic VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    options JSONB,
    correct_answer TEXT,
    difficulty VARCHAR(20) DEFAULT 'Medium',
    marks INT DEFAULT 2,
    bloom_level VARCHAR(50) DEFAULT 'Understand',
    course_outcome VARCHAR(20) DEFAULT 'CO1',
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Exam Duties
CREATE TABLE IF NOT EXISTS exam_duties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    exam_name VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    session VARCHAR(50) NOT NULL,
    hall_number VARCHAR(50) NOT NULL,
    role VARCHAR(100) NOT NULL,
    reporting_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'Assigned',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Faculty Tasks
CREATE TABLE IF NOT EXISTS faculty_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    due_date DATE NOT NULL,
    start_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    related_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    related_class_group_id UUID REFERENCES college_class_groups(id) ON DELETE SET NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Leave Requests & Substitutions
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    leave_type VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending HOD Approval',
    approver_remarks TEXT,
    approved_by_id UUID REFERENCES faculty_profiles(id) ON DELETE SET NULL,
    substitutions JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Announcements & Circulars
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Academic',
    target_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    target_roles TEXT[] DEFAULT ARRAY['faculty'],
    author_faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    published_date DATE DEFAULT CURRENT_DATE,
    is_pinned BOOLEAN DEFAULT FALSE,
    read_by_faculty_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Meetings & Action Items
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    agenda TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(100) NOT NULL,
    convenor_faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    attendee_faculty_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    minutes_of_meeting TEXT,
    status VARCHAR(50) DEFAULT 'Scheduled',
    action_items JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Research Projects & Publications
CREATE TABLE IF NOT EXISTS faculty_research_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    abstract TEXT,
    funding_agency VARCHAR(100),
    grant_amount NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Ongoing',
    start_date DATE,
    end_date DATE,
    co_investigators TEXT[] DEFAULT ARRAY[]::TEXT[],
    deliverables TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    journal_or_conference_name VARCHAR(255) NOT NULL,
    publication_type VARCHAR(100) NOT NULL,
    indexing VARCHAR(100),
    doi_or_url TEXT,
    volume_issue_pages VARCHAR(100),
    publication_year INT NOT NULL,
    authors TEXT[] DEFAULT ARRAY[]::TEXT[],
    impact_factor NUMERIC(4,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Student Projects & Hackathons
CREATE TABLE IF NOT EXISTS student_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    project_type VARCHAR(100) NOT NULL,
    guide_faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    class_group_id UUID REFERENCES college_class_groups(id) ON DELETE CASCADE,
    batch_students JSONB DEFAULT '[]'::JSONB,
    academic_year VARCHAR(20) NOT NULL,
    milestones JSONB DEFAULT '[]'::JSONB,
    status VARCHAR(100) DEFAULT 'In Progress',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Mentoring Sessions
CREATE TABLE IF NOT EXISTS mentoring_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    concern_type VARCHAR(100) NOT NULL,
    discussion_notes TEXT NOT NULL,
    remedial_action_plan TEXT,
    follow_up_date DATE,
    parent_contacted BOOLEAN DEFAULT FALSE,
    parent_contact_remarks TEXT,
    outcome_status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Lab Equipment Maintenance
CREATE TABLE IF NOT EXISTS lab_maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    room_or_lab VARCHAR(100) NOT NULL,
    equipment_name VARCHAR(150) NOT NULL,
    issue_description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'Reported',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Notifications
CREATE TABLE IF NOT EXISTS faculty_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function to resolve the current authenticated user's faculty_profile id
CREATE OR REPLACE FUNCTION get_current_faculty_id()
RETURNS UUID AS $$
    SELECT id FROM faculty_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_class_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

ALTER TABLE course_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_notifications ENABLE ROW LEVEL SECURITY;

-- 1. Read-only Core Institutional Catalog (Authenticated Faculty)
CREATE POLICY "Auth read departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read academic_classes" ON academic_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read class_sections" ON class_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read class_groups" ON college_class_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read subjects" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read students" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read announcements" ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read meetings" ON meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read course_units" ON course_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read question_bank" ON question_bank FOR SELECT TO authenticated USING (true);

-- 2. Faculty Profile Isolation
CREATE POLICY "Auth read faculty_profiles" ON faculty_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Faculty update own profile" ON faculty_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 3. Timetable Policies
CREATE POLICY "Auth read timetable" ON timetable_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Faculty manage own timetable" ON timetable_entries FOR ALL TO authenticated
    USING (faculty_id = get_current_faculty_id() OR substitute_faculty_id = get_current_faculty_id());

-- 4. Faculty Data Isolation Policies
CREATE POLICY "Faculty view own tasks" ON faculty_tasks FOR ALL TO authenticated
    USING (faculty_id = get_current_faculty_id());

CREATE POLICY "Faculty view own lesson plans" ON lesson_plans FOR ALL TO authenticated
    USING (faculty_id = get_current_faculty_id());

CREATE POLICY "Faculty view own teaching logs" ON teaching_logs FOR ALL TO authenticated
    USING (faculty_id = get_current_faculty_id());

CREATE POLICY "Faculty view own attendance sessions" ON attendance_sessions FOR ALL TO authenticated
    USING (faculty_id = get_current_faculty_id());

CREATE POLICY "Faculty view own attendance records" ON attendance_records FOR ALL TO authenticated
    USING (session_id IN (SELECT id FROM attendance_sessions WHERE faculty_id = get_current_faculty_id()));

CREATE POLICY "Faculty view own assignments" ON assignments FOR ALL TO authenticated
    USING (faculty_id = get_current_faculty_id());

CREATE POLICY "Faculty view assignment submissions" ON assignment_submissions FOR ALL TO authenticated
    USING (assignment_id IN (SELECT id FROM assignments WHERE faculty_id = get_current_faculty_id()));

CREATE POLICY "Faculty view own exam duties" ON exam_duties FOR ALL TO authenticated
    USING (faculty_id = get_current_faculty_id());

CREATE POLICY "Faculty view own leave requests" ON leave_requests FOR ALL TO authenticated
    USING (faculty_id = get_current_faculty_id());

CREATE POLICY "Faculty view own mentoring" ON mentoring_sessions FOR ALL TO authenticated
    USING (mentor_faculty_id = get_current_faculty_id());

CREATE POLICY "Faculty view own notifications" ON faculty_notifications FOR ALL TO authenticated
    USING (faculty_id = get_current_faculty_id());

CREATE POLICY "Faculty view own research projects" ON faculty_research_projects FOR ALL TO authenticated
    USING (faculty_id = get_current_faculty_id());

CREATE POLICY "Faculty view own publications" ON publications FOR ALL TO authenticated
    USING (faculty_id = get_current_faculty_id());

CREATE POLICY "Faculty view own student projects" ON student_projects FOR ALL TO authenticated
    USING (guide_faculty_id = get_current_faculty_id());

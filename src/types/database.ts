// FacultyOS Comprehensive Type Definitions

export type Role = 'faculty' | 'hod' | 'academic_coordinator' | 'exam_coordinator' | 'mentor' | 'admin';

export interface Department {
  id: string;
  name: string;
  code: string;
  hod_faculty_id?: string;
  created_at: string;
}

export interface AcademicClass {
  id: string;
  name: string; // e.g. "B.Tech Computer Science & Engineering"
  degree: string; // "B.Tech", "M.Tech", "B.Sc", "MCA"
  batch_year: string; // e.g. "2023-2027"
  current_semester: number;
  department_id: string;
  created_at: string;
}

export interface ClassSection {
  id: string;
  academic_class_id: string;
  section_name: string; // "A", "B", "C"
  room_number: string;
  student_count: number;
  created_at: string;
}

export interface CollegeClassGroup {
  id: string;
  name: string; // e.g. "CSE-3A", "IT-2B"
  academic_class_id?: string;
  class_section_id?: string;
  semester: number;
  academic_year: string;
  department_id: string;
  created_at: string;
}

export interface FacultyProfile {
  id: string;
  auth_user_id?: string;
  faculty_id: string; // e.g. "FAC-CSE-012"
  full_name: string;
  email: string;
  phone?: string;
  department_id: string;
  designation: string; // "Professor", "Associate Professor", "Assistant Professor", "HOD"
  qualification: string; // "Ph.D in AI/ML", "M.Tech in CS"
  specialization: string;
  office_room: string;
  office_hours: string;
  roles: Role[];
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface Student {
  id: string;
  roll_number: string;
  register_number: string;
  full_name: string;
  email: string;
  phone?: string;
  department_id: string;
  class_group_id: string;
  semester: number;
  parent_name?: string;
  parent_phone?: string;
  mentor_id?: string;
  status: 'active' | 'detained' | 'on_leave';
  created_at: string;
}

export interface Subject {
  id: string;
  code: string; // e.g. "CS8301" - mapped to DB subject_code
  name: string; // e.g. "Data Structures and Algorithms" - mapped to DB subject_name
  department_id: string;
  is_active?: boolean;
  semester?: number;
  credits?: number;
  type?: 'Theory' | 'Practical' | 'Tutorial' | 'Project';
  contact_hours_per_week?: number;
  total_planned_hours?: number;
  completed_hours?: number;
  assigned_faculty_id?: string;
  syllabus_url?: string;
  course_objectives?: string[];
  course_outcomes?: string[];
  prerequisites?: string[];
  reference_books?: string[];
  created_at?: string;
}

export interface TimetableEntry {
  id: string;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period_number: number;
  start_time: string; // "09:00" - mapped to DB starts_at
  end_time: string; // "09:50" - mapped to DB ends_at
  class_group_id: string; // mapped to DB college_class_group_id
  subject_id: string;
  faculty_id: string; // mapped to DB faculty_profile_id
  room_number: string; // mapped to DB room
  is_lab?: boolean;
  lab_name?: string;
  is_substitution?: boolean;
  substitute_faculty_id?: string;
  original_faculty_id?: string;
  academic_year?: string;
  semester?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CourseUnit {
  id: string;
  subject_id: string;
  unit_number: number;
  title: string;
  description: string;
  planned_hours: number;
  completed_hours: number;
  is_completed: boolean;
  topics: {
    id: string;
    title: string;
    completed: boolean;
    completed_date?: string;
  }[];
  course_outcomes_mapped: string[]; // ["CO1", "CO2"]
  created_at: string;
}

export interface LessonPlan {
  id: string;
  subject_id: string;
  class_group_id: string;
  unit_id?: string;
  unit_number: number;
  topic: string;
  learning_objectives: string[];
  expected_outcomes: string[];
  prerequisite_knowledge: string[];
  teaching_methodology: string; // "Lecture", "Interactive Discussion", "Hands-on Lab", "Flipped Classroom"
  teaching_type: 'Lecture' | 'Demonstration' | 'Discussion' | 'Practical' | 'Activity';
  teaching_aids: string[]; // ["LCD Projector", "Blackboard", "Online Simulation", "Code IDE"]
  duration_minutes: number;
  planned_date: string;
  actual_date?: string;
  status: 'Draft' | 'Planned' | 'Completed' | 'Rescheduled' | 'Cancelled';
  homework_or_follow_up?: string;
  reflection_notes?: string;
  faculty_id: string;
  is_ai_assisted?: boolean;
  created_at: string;
}

export interface TeachingLog {
  id: string;
  faculty_id: string;
  subject_id: string;
  class_group_id: string;
  date: string;
  period_number: number;
  topic_covered: string;
  methodology_used: string;
  hours_spent: number;
  student_engagement_rating: 1 | 2 | 3 | 4 | 5;
  remarks: string;
  created_at: string;
}

export interface AttendanceSession {
  id: string;
  date: string;
  period_number: number;
  timetable_entry_id?: string;
  class_group_id: string;
  subject_id: string;
  faculty_id: string;
  room_number: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  leave_count: number;
  is_locked: boolean;
  audit_reason?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: 'Present' | 'Absent' | 'Late' | 'Authorized Leave';
  remarks?: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  subject_id: string;
  class_group_id: string;
  faculty_id: string;
  title: string;
  instructions: string;
  max_marks: number;
  rubric: { criterion: string; marks: number }[];
  due_date: string;
  is_published: boolean;
  allow_resubmission: boolean;
  submission_count: number;
  graded_count: number;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_date: string;
  is_late: boolean;
  file_url?: string;
  file_name?: string;
  marks_awarded?: number;
  feedback?: string;
  status: 'Submitted' | 'Graded' | 'Resubmission Required';
  graded_at?: string;
}

export interface Assessment {
  id: string;
  subject_id: string;
  class_group_id: string;
  faculty_id: string;
  name: string; // "Internal Assessment 1", "Model Exam", "Practical Test"
  type: 'Internal Test' | 'Quiz' | 'Practical' | 'Project' | 'Assignment';
  max_marks: number;
  weightage_percent: number;
  date: string;
  created_at: string;
}

export interface AssessmentMark {
  id: string;
  assessment_id: string;
  student_id: string;
  marks_obtained: number;
  is_absent: boolean;
  remarks?: string;
  updated_at: string;
}

export interface QuestionBankItem {
  id: string;
  subject_id: string;
  unit_number: number;
  topic: string;
  question: string;
  question_type: 'MCQ' | 'Short Answer' | 'Descriptive' | 'Problem Solving';
  options?: string[];
  correct_answer?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  bloom_level: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  course_outcome: string; // "CO1", "CO2"
  faculty_id: string;
  created_at: string;
}

export interface ExamDuty {
  id: string;
  faculty_id: string;
  exam_name: string;
  exam_date: string;
  session: 'Forenoon (09:30-12:30)' | 'Afternoon (01:30-04:30)';
  hall_number: string;
  role: 'Chief Superintendent' | 'Hall Invigilator' | 'Squad Member' | 'Reliever';
  reporting_time: string;
  status: 'Assigned' | 'Acknowledged' | 'Completed' | 'Exchanged';
  created_at: string;
}

export interface FacultyTask {
  id: string;
  faculty_id: string;
  title: string;
  description: string;
  category: 'Teaching' | 'Grading' | 'Mentoring' | 'Administration' | 'Research' | 'Accreditation';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  due_date: string;
  start_date?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Deferred';
  related_subject_id?: string;
  related_class_group_id?: string;
  is_recurring: boolean;
  completion_notes?: string;
  completed_at?: string;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  faculty_id: string;
  leave_type: 'Casual Leave (CL)' | 'Medical Leave (ML)' | 'On Duty (OD)' | 'Earned Leave (EL)' | 'Compensatory Off';
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'Pending HOD Approval' | 'Approved' | 'Rejected';
  approver_remarks?: string;
  approved_by_id?: string;
  substitutions: {
    period_number: number;
    date: string;
    class_group_id: string;
    subject_id: string;
    substitute_faculty_id: string;
    status: 'Proposed' | 'Accepted' | 'Declined';
  }[];
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'Academic' | 'Examination' | 'Department' | 'General' | 'Urgent';
  target_department_id?: string; // empty means all college
  target_roles: Role[];
  author_faculty_id: string;
  author_name: string;
  published_date: string;
  is_pinned: boolean;
  read_by_faculty_ids: string[];
  created_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  agenda: string;
  department_id: string;
  meeting_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  convenor_faculty_id: string;
  attendee_faculty_ids: string[];
  minutes_of_meeting?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  action_items: {
    id: string;
    description: string;
    responsible_faculty_id: string;
    due_date: string;
    status: 'Pending' | 'In Progress' | 'Completed';
  }[];
  created_at: string;
}

export interface ResearchProject {
  id: string;
  faculty_id: string;
  title: string;
  abstract: string;
  funding_agency: string; // "DST-SERB", "AICTE-RPS", "Industry Sponsored", "Internal Seed Grant"
  grant_amount: number; // in INR / Currency
  status: 'Proposed' | 'Ongoing' | 'Completed';
  start_date: string;
  end_date: string;
  co_investigators: string[];
  deliverables: string[];
  created_at: string;
}

export interface Publication {
  id: string;
  faculty_id: string;
  title: string;
  journal_or_conference_name: string;
  publication_type: 'SCI / Scopus Journal' | 'UGC CARE' | 'IEEE / ACM Conference' | 'Book Chapter' | 'Patent';
  indexing: 'Scopus' | 'SCI' | 'Web of Science' | 'Peer Reviewed';
  doi_or_url?: string;
  volume_issue_pages?: string;
  publication_year: number;
  authors: string[];
  impact_factor?: number;
  created_at: string;
}

export interface FacultyDevelopmentRecord {
  id: string;
  faculty_id: string;
  title: string;
  type: 'FDP' | 'Workshop' | 'NPTEL / Coursera Certification' | 'Conference Presentation' | 'Industrial Training';
  organizer: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  certificate_url?: string;
  status: 'Completed' | 'Ongoing';
  created_at: string;
}

export interface StudentProject {
  id: string;
  title: string;
  domain: string; // "AI/ML", "IoT & Embedded", "Cloud Computing", "Cybersecurity", "VLSI"
  project_type: 'Capstone / Final Year' | 'Mini Project' | 'Industry Internship' | 'Hackathon';
  guide_faculty_id: string;
  class_group_id: string;
  batch_students: {
    roll_number: string;
    name: string;
  }[];
  academic_year: string;
  milestones: {
    title: string;
    due_date: string;
    completed: boolean;
    marks_awarded?: number;
    guide_remarks?: string;
  }[];
  status: 'In Progress' | 'Demonstration Completed' | 'Final Viva Voce Completed';
  created_at: string;
}

export interface MentoringSession {
  id: string;
  mentor_faculty_id: string;
  student_id: string;
  session_date: string;
  concern_type: 'Academic Weakness' | 'Attendance Shortage' | 'Career & Placement' | 'Personal / Psychological' | 'Disciplinary';
  discussion_notes: string;
  remedial_action_plan: string;
  follow_up_date?: string;
  parent_contacted: boolean;
  parent_contact_remarks?: string;
  outcome_status: 'Open' | 'Progressing' | 'Resolved';
  created_at: string;
}

export interface LabMaintenanceRequest {
  id: string;
  faculty_id: string;
  room_or_lab: string;
  equipment_name: string;
  issue_description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Reported' | 'In Progress' | 'Resolved';
  resolution_notes?: string;
  created_at: string;
}

export interface FacultyNotification {
  id: string;
  faculty_id: string;
  title: string;
  message: string;
  category: 'Timetable' | 'Attendance' | 'Exam' | 'Leave' | 'Meeting' | 'System';
  is_read: boolean;
  action_link?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  created_at: string;
}

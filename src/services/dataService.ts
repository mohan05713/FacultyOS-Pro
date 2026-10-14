import {
  Department,
  AcademicClass,
  ClassSection,
  CollegeClassGroup,
  FacultyProfile,
  Student,
  Subject,
  TimetableEntry,
  CourseUnit,
  LessonPlan,
  TeachingLog,
  AttendanceSession,
  AttendanceRecord,
  Assignment,
  AssignmentSubmission,
  Assessment,
  AssessmentMark,
  QuestionBankItem,
  ExamDuty,
  FacultyTask,
  LeaveRequest,
  Announcement,
  Meeting,
  ResearchProject,
  Publication,
  FacultyDevelopmentRecord,
  StudentProject,
  MentoringSession,
  LabMaintenanceRequest,
  FacultyNotification,
  AuditLog,
} from '../types/database';

import {
  INITIAL_DEPARTMENTS,
  INITIAL_FACULTY,
  INITIAL_ACADEMIC_CLASSES,
  INITIAL_CLASS_SECTIONS,
  INITIAL_CLASS_GROUPS,
  INITIAL_SUBJECTS,
  INITIAL_STUDENTS,
  INITIAL_TIMETABLE,
  INITIAL_COURSE_UNITS,
  INITIAL_LESSON_PLANS,
  INITIAL_ATTENDANCE_SESSIONS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_ASSIGNMENTS,
  INITIAL_ASSIGNMENT_SUBMISSIONS,
  INITIAL_ASSESSMENTS,
  INITIAL_ASSESSMENT_MARKS,
  INITIAL_QUESTION_BANK,
  INITIAL_EXAM_DUTIES,
  INITIAL_FACULTY_TASKS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_MEETINGS,
  INITIAL_RESEARCH_PROJECTS,
  INITIAL_PUBLICATIONS,
  INITIAL_FACULTY_DEVELOPMENT,
  INITIAL_STUDENT_PROJECTS,
  INITIAL_MENTORING_SESSIONS,
  INITIAL_LAB_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './initialData';

import { getSupabaseClient } from '../lib/supabaseClient';

const STORAGE_KEY_PREFIX = 'facultyos_db_';

function loadFromStorage<T>(table: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${table}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(`Failed to load ${table} from storage:`, e);
  }
  return fallback;
}

function saveToStorage<T>(table: string, data: T): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${table}`, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${table} to storage:`, e);
  }
}

function mapDbSubjectToSubject(row: any): Subject {
  return {
    id: row.id,
    code: row.subject_code || row.code || '',
    name: row.subject_name || row.name || '',
    department_id: row.department_id || '',
    is_active: row.is_active ?? true,
    created_at: row.created_at || new Date().toISOString(),
    semester: row.semester ?? 1,
    credits: row.credits ?? 3,
    type: row.type || 'Theory',
    contact_hours_per_week: row.contact_hours_per_week ?? 4,
    total_planned_hours: row.total_planned_hours ?? 45,
    completed_hours: row.completed_hours ?? 0,
    assigned_faculty_id: row.assigned_faculty_id || row.faculty_profile_id || '',
    course_objectives: row.course_objectives || [],
    course_outcomes: row.course_outcomes || [],
    prerequisites: row.prerequisites || [],
    reference_books: row.reference_books || [],
  };
}

function mapSubjectToDbPayload(subject: Subject): any {
  return {
    id: subject.id,
    subject_code: subject.code,
    subject_name: subject.name,
    department_id: subject.department_id,
    is_active: subject.is_active ?? true,
  };
}

function mapDbTimetableToTimetableEntry(row: any): TimetableEntry {
  return {
    id: row.id,
    subject_id: row.subject_id || '',
    faculty_id: row.faculty_profile_id || row.faculty_id || '',
    day_of_week: row.day_of_week || 'Monday',
    period_number: Number(row.period_number || 1),
    start_time: row.starts_at || row.start_time || '09:00',
    end_time: row.ends_at || row.end_time || '09:50',
    room_number: row.room || row.room_number || '',
    academic_year: row.academic_year || '2026-2027',
    is_active: row.is_active ?? true,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    class_group_id: row.college_class_group_id || row.class_group_id || '',
    is_lab: row.is_lab ?? false,
    semester: row.semester ?? 1,
  };
}

function mapTimetableEntryToDbPayload(entry: TimetableEntry): any {
  return {
    id: entry.id,
    subject_id: entry.subject_id,
    faculty_profile_id: entry.faculty_id,
    day_of_week: entry.day_of_week,
    period_number: entry.period_number,
    starts_at: entry.start_time,
    ends_at: entry.end_time,
    room: entry.room_number,
    academic_year: entry.academic_year || '2026-2027',
    is_active: entry.is_active ?? true,
    college_class_group_id: entry.class_group_id,
    updated_at: new Date().toISOString(),
  };
}

function mapDbClassGroupToClassGroup(row: any): CollegeClassGroup {
  return {
    id: row.id,
    name: row.name || '',
    academic_class_id: row.academic_class_id || '',
    class_section_id: row.class_section_id || '',
    semester: Number(row.semester || 1),
    academic_year: row.academic_year || '2026-2027',
    department_id: row.department_id || '',
    created_at: row.created_at || new Date().toISOString(),
  };
}

function mapClassGroupToDbPayload(group: CollegeClassGroup): any {
  return {
    id: group.id,
    name: group.name,
    semester: Number(group.semester || 1),
    academic_year: group.academic_year || '2026-2027',
    department_id: group.department_id,
  };
}


export type DataMode = 'live_supabase' | 'demo_local';

export interface QueryTestReport {
  table: string;
  accessible: boolean;
  rowCount?: number;
  error?: string;
}

class DataService {
  private currentFacultyId: string = 'fac-mohan';
  private databaseErrors: Record<string, string> = {};

  // Configurable period timings
  public periodTimings = [
    { period: 1, start: '09:00', end: '09:50', label: 'Period 1' },
    { period: 2, start: '09:50', end: '10:40', label: 'Period 2' },
    { period: 0, start: '10:40', end: '11:00', label: 'Morning Tea Break', isBreak: true },
    { period: 3, start: '11:00', end: '11:50', label: 'Period 3' },
    { period: 4, start: '11:50', end: '12:40', label: 'Period 4' },
    { period: 0, start: '12:40', end: '13:40', label: 'Lunch Break', isLunch: true },
    { period: 5, start: '13:40', end: '14:30', label: 'Period 5' },
    { period: 6, start: '14:30', end: '15:20', label: 'Period 6' },
    { period: 7, start: '15:20', end: '16:10', label: 'Period 7' },
  ];

  // Data Mode: live_supabase vs demo_local
  getDataMode(): DataMode {
    const stored = localStorage.getItem('facultyos_data_mode');
    return (stored as DataMode) || 'live_supabase';
  }

  setDataMode(mode: DataMode): void {
    localStorage.setItem('facultyos_data_mode', mode);
  }

  isLiveMode(): boolean {
    return this.getDataMode() === 'live_supabase';
  }

  getDatabaseErrors(): Record<string, string> {
    return { ...this.databaseErrors };
  }

  clearDatabaseErrors(): void {
    this.databaseErrors = {};
  }

  // Current logged in faculty accessor
  getCurrentFacultyId(): string {
    return localStorage.getItem('facultyos_current_faculty_id') || this.currentFacultyId;
  }

  setCurrentFacultyId(id: string): void {
    this.currentFacultyId = id;
    localStorage.setItem('facultyos_current_faculty_id', id);
  }

  // Test authenticated SELECT queries across all core tables
  async testAuthenticatedQueries(): Promise<QueryTestReport[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return [{ table: 'client', accessible: false, error: 'Supabase client not initialized' }];
    }

    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;

    const tables = [
      'departments',
      'subjects',
      'college_class_groups',
      'timetable_entries',
      'faculty_profiles',
      'students',
    ];

    const reports: QueryTestReport[] = [];

    for (const table of tables) {
      if (table === 'students') {
        // Enforce strict restriction: kept inaccessible until schema-aligned RLS is designed
        reports.push({
          table: 'students',
          accessible: false,
          error: 'Access restricted by policy (pending schema-aligned RLS design)',
        });
        continue;
      }

      try {
        let query = supabase.from(table).select('*', { count: 'exact' });
        if (table === 'faculty_profiles' && authUser) {
          query = query.eq('auth_user_id', authUser.id);
        }
        const { data, error, count } = await query.limit(5);

        if (error) {
          const errMsg = `${error.code ? `[${error.code}] ` : ''}${error.message}`;
          this.databaseErrors[table] = errMsg;
          reports.push({ table, accessible: false, error: errMsg });
        } else {
          delete this.databaseErrors[table];
          reports.push({ table, accessible: true, rowCount: count ?? data?.length ?? 0 });
        }
      } catch (err: any) {
        reports.push({ table, accessible: false, error: err.message || 'Unknown network error' });
      }
    }

    return reports;
  }

  // --- Departments ---
  async getDepartments(): Promise<Department[]> {
    if (this.isLiveMode()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('departments').select('*');
        if (error) {
          this.databaseErrors['departments'] = `${error.code ? `[${error.code}] ` : ''}${error.message}`;
          console.error('Supabase query error for departments:', error);
          return [];
        }
        delete this.databaseErrors['departments'];
        return data || [];
      }
    }
    return loadFromStorage('departments', INITIAL_DEPARTMENTS);
  }

  // --- Faculty Profiles ---
  async getFacultyProfiles(): Promise<FacultyProfile[]> {
    if (this.isLiveMode()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('faculty_profiles').select('*');
        if (error) {
          this.databaseErrors['faculty_profiles'] = `${error.code ? `[${error.code}] ` : ''}${error.message}`;
          console.error('Supabase query error for faculty_profiles:', error);
          return [];
        }
        delete this.databaseErrors['faculty_profiles'];
        return data || [];
      }
    }
    return loadFromStorage('faculty_profiles', INITIAL_FACULTY);
  }

  // --- Current Faculty Profile Lookup (strictly by auth_user_id, NO email auto-link) ---
  async getCurrentFacultyProfile(): Promise<FacultyProfile | null> {
    if (this.isLiveMode()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: authData, error: authErr } = await supabase.auth.getUser();
          if (authErr) {
            this.databaseErrors['auth'] = authErr.message;
            return null;
          }
          const user = authData?.user;
          if (user) {
            // Strictly query faculty_profiles by auth_user_id matching auth.uid()
            const { data: profileByUid, error: uidErr } = await supabase
              .from('faculty_profiles')
              .select('*')
              .eq('auth_user_id', user.id)
              .maybeSingle();

            if (uidErr) {
              this.databaseErrors['faculty_profiles'] = `${uidErr.code ? `[${uidErr.code}] ` : ''}${uidErr.message}`;
              console.error('Error fetching faculty_profile for auth_user_id:', uidErr);
              return null;
            }

            if (profileByUid) {
              delete this.databaseErrors['faculty_profiles'];
              return profileByUid;
            }

            // If no profile found for this auth_user_id, do NOT auto-link by email
            this.databaseErrors['faculty_profiles'] = `No profile in 'faculty_profiles' has auth_user_id = '${user.id}' (${user.email}).`;
            return null;
          }
        } catch (e: any) {
          this.databaseErrors['faculty_profiles'] = e.message || 'Auth lookup error';
          return null;
        }
      }
    }

    // Demo Mode fallback only
    const profiles = await this.getFacultyProfiles();
    const currentId = this.getCurrentFacultyId();
    return profiles.find((f) => f.id === currentId) || profiles[0] || null;
  }

  async signInWithSupabase(email: string, password: string): Promise<{ user?: any; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: 'Supabase client is not configured with Anon Key.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    this.setDataMode('live_supabase');
    return { user: data.user };
  }

  async signOutSupabase(): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  async getSupabaseUser(): Promise<any | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user || null;
  }

  async updateFacultyProfile(profile: FacultyProfile): Promise<FacultyProfile> {
    if (this.isLiveMode()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('faculty_profiles').upsert(profile);
        if (error) {
          this.databaseErrors['faculty_profiles'] = error.message;
          throw error;
        }
      }
    }
    const profiles = await this.getFacultyProfiles();
    const idx = profiles.findIndex((f) => f.id === profile.id);
    if (idx >= 0) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }
    saveToStorage('faculty_profiles', profiles);
    this.logAudit('UPDATE_PROFILE', 'FacultyProfile', profile.id, `Updated profile for ${profile.full_name}`);
    return profile;
  }

  // --- Academic Classes & Groups ---
  async getClassGroups(): Promise<CollegeClassGroup[]> {
    if (this.isLiveMode()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('college_class_groups').select('*');
        if (error) {
          this.databaseErrors['college_class_groups'] = `${error.code ? `[${error.code}] ` : ''}${error.message}`;
          console.error('Supabase query error for college_class_groups:', error);
          return [];
        }
        delete this.databaseErrors['college_class_groups'];
        return (data || []).map(mapDbClassGroupToClassGroup);
      }
    }
    return loadFromStorage('college_class_groups', INITIAL_CLASS_GROUPS);
  }

  async saveClassGroup(classGroup: CollegeClassGroup): Promise<CollegeClassGroup> {
    if (this.isLiveMode()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const payload = mapClassGroupToDbPayload(classGroup);
        const { error } = await supabase.from('college_class_groups').upsert(payload);
        if (error) {
          this.databaseErrors['college_class_groups'] = error.message;
          throw error;
        }
        delete this.databaseErrors['college_class_groups'];
      }
    } else {
      const groups = await this.getClassGroups();
      const idx = groups.findIndex((g) => g.id === classGroup.id);
      if (idx >= 0) {
        groups[idx] = classGroup;
      } else {
        groups.push(classGroup);
      }
      saveToStorage('college_class_groups', groups);
    }
    return classGroup;
  }

  async deleteClassGroup(id: string): Promise<void> {
    if (this.isLiveMode()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('college_class_groups').delete().eq('id', id);
        if (error) {
          this.databaseErrors['college_class_groups'] = error.message;
          throw error;
        }
        delete this.databaseErrors['college_class_groups'];
      }
    } else {
      const groups = (await this.getClassGroups()).filter((g) => g.id !== id);
      saveToStorage('college_class_groups', groups);
    }
  }

  // --- Students (Strictly restricted to authorized users via RLS) ---
  async getStudents(classGroupId?: string): Promise<Student[]> {
    if (this.isLiveMode()) {
      // Kept inaccessible until a correct RLS policy is designed from the actual schema
      this.databaseErrors['students'] = 'Access restricted by policy (pending schema-aligned RLS design)';
      return [];
    }
    const all = loadFromStorage('students', INITIAL_STUDENTS);
    return classGroupId ? all.filter((s) => s.class_group_id === classGroupId) : all;
  }

  // --- Subjects ---
  async getSubjects(departmentId?: string | number): Promise<Subject[]> {
    if (this.isLiveMode()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        let query = supabase.from('subjects').select('*');
        
        const deptIdStr = departmentId !== undefined && departmentId !== null ? String(departmentId) : '';
        // Only apply SQL equality if departmentId is numeric or explicit dept prefix
        const isNumeric = deptIdStr.length > 0 && /^\d+$/.test(deptIdStr);
        const isDeptPrefix = deptIdStr.startsWith('dept-');

        if (isNumeric) {
          query = query.eq('department_id', Number(deptIdStr));
        } else if (isDeptPrefix) {
          query = query.eq('department_id', deptIdStr);
        }

        const { data, error } = await query;
        if (error) {
          const errMsg = `${error.code ? `[${error.code}] ` : ''}${error.message}`;
          this.databaseErrors['subjects'] = errMsg;
          console.error('Supabase query error for subjects:', error);
          return [];
        }
        delete this.databaseErrors['subjects'];
        let results = (data || []).map(mapDbSubjectToSubject);
        if (deptIdStr && deptIdStr !== 'all' && !isNumeric && !isDeptPrefix) {
          // If a non-numeric string (e.g. UUID) was passed, filter in-memory safely without breaking DB
          results = results.filter((s) => String(s.department_id) === deptIdStr);
        }
        return results;
      }
    }
    const all = loadFromStorage('subjects', INITIAL_SUBJECTS);
    const deptIdStr = departmentId !== undefined && departmentId !== null ? String(departmentId) : '';
    return deptIdStr && deptIdStr !== 'all' ? all.filter((s) => String(s.department_id) === deptIdStr) : all;
  }

  async saveSubject(subject: Subject): Promise<Subject> {
    if (this.isLiveMode()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const payload = mapSubjectToDbPayload(subject);
        const { error } = await supabase.from('subjects').upsert(payload);
        if (error) {
          this.databaseErrors['subjects'] = error.message;
          throw error;
        }
        delete this.databaseErrors['subjects'];
      }
    } else {
      const subjects = await this.getSubjects();
      const idx = subjects.findIndex((s) => s.id === subject.id);
      if (idx >= 0) {
        subjects[idx] = subject;
      } else {
        subjects.push(subject);
      }
      saveToStorage('subjects', subjects);
    }
    return subject;
  }

  async deleteSubject(id: string): Promise<void> {
    if (this.isLiveMode()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) {
          this.databaseErrors['subjects'] = error.message;
          throw error;
        }
        delete this.databaseErrors['subjects'];
      }
    } else {
      const subs = (await this.getSubjects()).filter((s) => s.id !== id);
      saveToStorage('subjects', subs);
    }
  }

  // --- Timetable ---
  async getTimetable(day?: string, facultyProfileId?: string): Promise<TimetableEntry[]> {
    if (this.isLiveMode()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        let query = supabase.from('timetable_entries').select('*');
        if (day) query = query.eq('day_of_week', day);
        if (facultyProfileId) query = query.eq('faculty_profile_id', facultyProfileId);

        const { data, error } = await query;
        if (error) {
          const errMsg = `${error.code ? `[${error.code}] ` : ''}${error.message}`;
          this.databaseErrors['timetable_entries'] = errMsg;
          console.error('Supabase query error for timetable_entries:', error);
          return [];
        }
        delete this.databaseErrors['timetable_entries'];
        return (data || []).map(mapDbTimetableToTimetableEntry).sort((a, b) => a.period_number - b.period_number);
      }
    }
    let entries = loadFromStorage('timetable_entries', INITIAL_TIMETABLE);
    if (day) entries = entries.filter((e) => e.day_of_week === day);
    if (facultyProfileId) entries = entries.filter((e) => e.faculty_id === facultyProfileId || e.substitute_faculty_id === facultyProfileId);
    return entries.sort((a, b) => a.period_number - b.period_number);
  }

  async saveTimetableEntry(entry: TimetableEntry): Promise<{ entry?: TimetableEntry; error?: string }> {
    // Conflict detection
    const all = await this.getTimetable(entry.day_of_week);
    const facultyConflict = all.find(
      (e) => e.id !== entry.id && e.period_number === entry.period_number && e.faculty_id === entry.faculty_id
    );
    if (facultyConflict) {
      return { error: `Faculty conflict! Period ${entry.period_number} on ${entry.day_of_week} is already assigned.` };
    }

    const roomConflict = all.find(
      (e) => e.id !== entry.id && e.period_number === entry.period_number && e.room_number.toLowerCase() === entry.room_number.toLowerCase()
    );
    if (roomConflict) {
      return { error: `Room conflict! Room ${entry.room_number} is already booked in Period ${entry.period_number}.` };
    }

    const groupConflict = all.find(
      (e) => e.id !== entry.id && e.period_number === entry.period_number && e.class_group_id === entry.class_group_id
    );
    if (groupConflict) {
      return { error: `Class group conflict! Group is already attending another session in Period ${entry.period_number}.` };
    }

    const supabase = getSupabaseClient();
    if (this.isLiveMode() && supabase) {
      const payload = mapTimetableEntryToDbPayload(entry);
      const { error } = await supabase.from('timetable_entries').upsert(payload);
      if (error) {
        this.databaseErrors['timetable_entries'] = error.message;
        return { error: `Supabase database error: ${error.message}` };
      }

      // Verification in Supabase
      const { data: verifyData, error: verifyError } = await supabase
        .from('timetable_entries')
        .select('*')
        .eq('id', entry.id)
        .maybeSingle();

      if (verifyError || !verifyData) {
        return { error: `Failed to verify saved record in Supabase: ${verifyError?.message || 'Record not found after upsert'}` };
      }
      delete this.databaseErrors['timetable_entries'];
    } else {
      const full = loadFromStorage('timetable_entries', INITIAL_TIMETABLE);
      const idx = full.findIndex((e) => e.id === entry.id);
      if (idx >= 0) {
        full[idx] = entry;
      } else {
        full.push(entry);
      }
      saveToStorage('timetable_entries', full);
    }
    this.logAudit('TIMETABLE_CHANGE', 'TimetableEntry', entry.id, `Created/Updated timetable for period ${entry.period_number}`);
    return { entry };
  }

  async deleteTimetableEntry(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('timetable_entries').delete().eq('id', id);
    }
    const full = loadFromStorage('timetable_entries', INITIAL_TIMETABLE).filter((e) => e.id !== id);
    saveToStorage('timetable_entries', full);
    this.logAudit('TIMETABLE_DELETE', 'TimetableEntry', id, 'Deleted timetable entry');
  }

  // --- Course Units & Syllabus ---
  async getCourseUnits(subjectId?: string): Promise<CourseUnit[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('course_units').select('*');
      if (subjectId) query = query.eq('subject_id', subjectId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('course_units', INITIAL_COURSE_UNITS);
    return subjectId ? all.filter((u) => u.subject_id === subjectId) : all;
  }

  async toggleTopicCompletion(unitId: string, topicId: string, completed: boolean): Promise<CourseUnit | null> {
    const units = await this.getCourseUnits();
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return null;

    const topic = unit.topics.find((t) => t.id === topicId);
    if (topic) {
      topic.completed = completed;
      topic.completed_date = completed ? new Date().toISOString().split('T')[0] : undefined;
    }

    // calculate completion
    const completedCount = unit.topics.filter((t) => t.completed).length;
    unit.is_completed = completedCount === unit.topics.length;
    unit.completed_hours = Math.round((completedCount / (unit.topics.length || 1)) * unit.planned_hours);

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('course_units').upsert(unit);
    }
    saveToStorage('course_units', units);
    this.logAudit('TOPIC_UPDATE', 'CourseUnit', unitId, `Topic ${topic?.title} marked ${completed ? 'Completed' : 'Pending'}`);
    return unit;
  }

  // --- Lesson Plans ---
  async getLessonPlans(facultyId?: string): Promise<LessonPlan[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('lesson_plans').select('*');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('lesson_plans', INITIAL_LESSON_PLANS);
    return facultyId ? all.filter((lp) => lp.faculty_id === facultyId) : all;
  }

  async saveLessonPlan(plan: LessonPlan): Promise<LessonPlan> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('lesson_plans').upsert(plan);
    }
    const all = loadFromStorage('lesson_plans', INITIAL_LESSON_PLANS);
    const idx = all.findIndex((lp) => lp.id === plan.id);
    if (idx >= 0) {
      all[idx] = plan;
    } else {
      all.push(plan);
    }
    saveToStorage('lesson_plans', all);
    this.logAudit('SAVE_LESSON_PLAN', 'LessonPlan', plan.id, `Saved lesson plan for ${plan.topic}`);
    return plan;
  }

  // --- Teaching Logs ---
  async getTeachingLogs(facultyId?: string): Promise<TeachingLog[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('teaching_logs').select('*');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('teaching_logs', [] as TeachingLog[]);
    return facultyId ? all.filter((l) => l.faculty_id === facultyId) : all;
  }

  async addTeachingLog(log: TeachingLog): Promise<TeachingLog> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('teaching_logs').insert(log);
    }
    const all = loadFromStorage('teaching_logs', [] as TeachingLog[]);
    all.unshift(log);
    saveToStorage('teaching_logs', all);

    // Also update completed hours for subject
    const subjects = await this.getSubjects();
    const sub = subjects.find((s) => s.id === log.subject_id);
    if (sub) {
      sub.completed_hours = (sub.completed_hours || 0) + (log.hours_spent || 1);
      await this.saveSubject(sub);
    }

    this.logAudit('LOG_TEACHING', 'TeachingLog', log.id, `Recorded teaching log: ${log.topic_covered}`);
    return log;
  }

  // --- Attendance ---
  async getAttendanceSessions(facultyId?: string): Promise<AttendanceSession[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('attendance_sessions').select('*');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('attendance_sessions', INITIAL_ATTENDANCE_SESSIONS);
    return facultyId ? all.filter((s) => s.faculty_id === facultyId) : all;
  }

  async getAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('attendance_records').select('*').eq('session_id', sessionId);
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('attendance_records', INITIAL_ATTENDANCE_RECORDS);
    return all.filter((r) => r.session_id === sessionId);
  }

  async saveAttendanceSession(session: AttendanceSession, records: AttendanceRecord[]): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('attendance_sessions').upsert(session);
      await supabase.from('attendance_records').upsert(records);
    }

    const sessions = loadFromStorage('attendance_sessions', INITIAL_ATTENDANCE_SESSIONS);
    const sIdx = sessions.findIndex((s) => s.id === session.id);
    if (sIdx >= 0) sessions[sIdx] = session;
    else sessions.unshift(session);
    saveToStorage('attendance_sessions', sessions);

    const allRecords = loadFromStorage('attendance_records', INITIAL_ATTENDANCE_RECORDS).filter(
      (r) => r.session_id !== session.id
    );
    allRecords.push(...records);
    saveToStorage('attendance_records', allRecords);

    this.logAudit(
      'SAVE_ATTENDANCE',
      'AttendanceSession',
      session.id,
      `Saved attendance: ${session.present_count} present, ${session.absent_count} absent`
    );
  }

  // --- Assignments & Grading ---
  async getAssignments(facultyId?: string): Promise<Assignment[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('assignments').select('*');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('assignments', INITIAL_ASSIGNMENTS);
    return facultyId ? all.filter((a) => a.faculty_id === facultyId) : all;
  }

  async saveAssignment(assignment: Assignment): Promise<Assignment> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('assignments').upsert(assignment);
    }
    const all = loadFromStorage('assignments', INITIAL_ASSIGNMENTS);
    const idx = all.findIndex((a) => a.id === assignment.id);
    if (idx >= 0) all[idx] = assignment;
    else all.unshift(assignment);
    saveToStorage('assignments', all);
    this.logAudit('SAVE_ASSIGNMENT', 'Assignment', assignment.id, `Created/Updated assignment: ${assignment.title}`);
    return assignment;
  }

  async getAssignmentSubmissions(assignmentId?: string): Promise<AssignmentSubmission[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('assignment_submissions').select('*');
      if (assignmentId) query = query.eq('assignment_id', assignmentId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('assignment_submissions', INITIAL_ASSIGNMENT_SUBMISSIONS);
    return assignmentId ? all.filter((s) => s.assignment_id === assignmentId) : all;
  }

  async gradeSubmission(
    submissionId: string,
    marks: number,
    feedback: string,
    status: 'Graded' | 'Resubmission Required' = 'Graded'
  ): Promise<AssignmentSubmission | null> {
    const all = loadFromStorage('assignment_submissions', INITIAL_ASSIGNMENT_SUBMISSIONS);
    const sub = all.find((s) => s.id === submissionId);
    if (!sub) return null;

    sub.marks_awarded = marks;
    sub.feedback = feedback;
    sub.status = status;
    sub.graded_at = new Date().toISOString();

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('assignment_submissions').upsert(sub);
    }
    saveToStorage('assignment_submissions', all);

    // Update assignment graded count
    const assignments = await this.getAssignments();
    const assignment = assignments.find((a) => a.id === sub.assignment_id);
    if (assignment) {
      const assignmentSubs = all.filter((s) => s.assignment_id === assignment.id);
      assignment.graded_count = assignmentSubs.filter((s) => s.status === 'Graded').length;
      await this.saveAssignment(assignment);
    }

    this.logAudit('GRADE_SUBMISSION', 'AssignmentSubmission', submissionId, `Graded submission with ${marks} marks`);
    return sub;
  }

  // --- Assessments & Marks ---
  async getAssessments(facultyId?: string): Promise<Assessment[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('assessments').select('*');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('assessments', INITIAL_ASSESSMENTS);
    return facultyId ? all.filter((a) => a.faculty_id === facultyId) : all;
  }

  async getAssessmentMarks(assessmentId: string): Promise<AssessmentMark[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('assessment_marks').select('*').eq('assessment_id', assessmentId);
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('assessment_marks', INITIAL_ASSESSMENT_MARKS);
    return all.filter((m) => m.assessment_id === assessmentId);
  }

  async saveAssessmentMarks(assessmentId: string, marks: AssessmentMark[]): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('assessment_marks').upsert(marks);
    }
    const all = loadFromStorage('assessment_marks', INITIAL_ASSESSMENT_MARKS).filter(
      (m) => m.assessment_id !== assessmentId
    );
    all.push(...marks);
    saveToStorage('assessment_marks', all);
    this.logAudit('UPDATE_MARKS', 'Assessment', assessmentId, `Updated marks for ${marks.length} students`);
  }

  // --- Question Bank ---
  async getQuestionBank(subjectId?: string): Promise<QuestionBankItem[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('question_bank').select('*');
      if (subjectId) query = query.eq('subject_id', subjectId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('question_bank', INITIAL_QUESTION_BANK);
    return subjectId ? all.filter((q) => q.subject_id === subjectId) : all;
  }

  async addQuestionBankItem(item: QuestionBankItem): Promise<QuestionBankItem> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('question_bank').insert(item);
    }
    const all = loadFromStorage('question_bank', INITIAL_QUESTION_BANK);
    all.unshift(item);
    saveToStorage('question_bank', all);
    this.logAudit('ADD_QUESTION', 'QuestionBankItem', item.id, `Added question for Unit ${item.unit_number}`);
    return item;
  }

  // --- Exam Duties ---
  async getExamDuties(facultyId?: string): Promise<ExamDuty[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('exam_duties').select('*');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('exam_duties', INITIAL_EXAM_DUTIES);
    return facultyId ? all.filter((d) => d.faculty_id === facultyId) : all;
  }

  async updateExamDutyStatus(id: string, status: ExamDuty['status']): Promise<void> {
    const all = loadFromStorage('exam_duties', INITIAL_EXAM_DUTIES);
    const duty = all.find((d) => d.id === id);
    if (duty) {
      duty.status = status;
      saveToStorage('exam_duties', all);
      this.logAudit('DUTY_STATUS', 'ExamDuty', id, `Exam duty status updated to ${status}`);
    }
  }

  // --- Faculty Tasks ---
  async getFacultyTasks(facultyId?: string): Promise<FacultyTask[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('faculty_tasks').select('*');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('faculty_tasks', INITIAL_FACULTY_TASKS);
    return facultyId ? all.filter((t) => t.faculty_id === facultyId) : all;
  }

  async saveFacultyTask(task: FacultyTask): Promise<FacultyTask> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('faculty_tasks').upsert(task);
    }
    const all = loadFromStorage('faculty_tasks', INITIAL_FACULTY_TASKS);
    const idx = all.findIndex((t) => t.id === task.id);
    if (idx >= 0) all[idx] = task;
    else all.unshift(task);
    saveToStorage('faculty_tasks', all);
    return task;
  }

  async toggleTaskStatus(taskId: string): Promise<FacultyTask | null> {
    const all = loadFromStorage('faculty_tasks', INITIAL_FACULTY_TASKS);
    const task = all.find((t) => t.id === taskId);
    if (!task) return null;

    task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
    task.completed_at = task.status === 'Completed' ? new Date().toISOString() : undefined;

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('faculty_tasks').upsert(task);
    }
    saveToStorage('faculty_tasks', all);
    this.logAudit('TASK_TOGGLE', 'FacultyTask', taskId, `Task marked ${task.status}`);
    return task;
  }

  // --- Leave Requests & Substitutions ---
  async getLeaveRequests(facultyId?: string): Promise<LeaveRequest[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('leave_requests').select('*');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('leave_requests', INITIAL_LEAVE_REQUESTS);
    return facultyId ? all.filter((l) => l.faculty_id === facultyId) : all;
  }

  async applyLeave(leave: LeaveRequest): Promise<LeaveRequest> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('leave_requests').insert(leave);
    }
    const all = loadFromStorage('leave_requests', INITIAL_LEAVE_REQUESTS);
    all.unshift(leave);
    saveToStorage('leave_requests', all);
    this.logAudit('APPLY_LEAVE', 'LeaveRequest', leave.id, `Applied for ${leave.leave_type} (${leave.total_days} days)`);
    return leave;
  }

  // --- Announcements ---
  async getAnnouncements(): Promise<Announcement[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('announcements').select('*');
      if (!error && data && data.length > 0) return data;
    }
    return loadFromStorage('announcements', INITIAL_ANNOUNCEMENTS);
  }

  async markAnnouncementAsRead(id: string, facultyId: string): Promise<void> {
    const all = loadFromStorage('announcements', INITIAL_ANNOUNCEMENTS);
    const ann = all.find((a) => a.id === id);
    if (ann && !ann.read_by_faculty_ids.includes(facultyId)) {
      ann.read_by_faculty_ids.push(facultyId);
      saveToStorage('announcements', all);
    }
  }

  // --- Meetings ---
  async getMeetings(): Promise<Meeting[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('meetings').select('*');
      if (!error && data && data.length > 0) return data;
    }
    return loadFromStorage('meetings', INITIAL_MEETINGS);
  }

  // --- Research, Publications & Grants ---
  async getResearchProjects(facultyId?: string): Promise<ResearchProject[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('faculty_research_projects').select('*');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('faculty_research_projects', INITIAL_RESEARCH_PROJECTS);
    return facultyId ? all.filter((r) => r.faculty_id === facultyId) : all;
  }

  async getPublications(facultyId?: string): Promise<Publication[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('publications').select('*');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('publications', INITIAL_PUBLICATIONS);
    return facultyId ? all.filter((p) => p.faculty_id === facultyId) : all;
  }

  async getFacultyDevelopment(facultyId?: string): Promise<FacultyDevelopmentRecord[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('faculty_development_records').select('*');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('faculty_development_records', INITIAL_FACULTY_DEVELOPMENT);
    return facultyId ? all.filter((f) => f.faculty_id === facultyId) : all;
  }

  // --- Student Projects ---
  async getStudentProjects(facultyId?: string): Promise<StudentProject[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('student_projects').select('*');
      if (facultyId) query = query.eq('guide_faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('student_projects', INITIAL_STUDENT_PROJECTS);
    return facultyId ? all.filter((p) => p.guide_faculty_id === facultyId) : all;
  }

  // --- Mentoring ---
  async getMentoringSessions(facultyId?: string): Promise<MentoringSession[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('mentoring_sessions').select('*');
      if (facultyId) query = query.eq('mentor_faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('mentoring_sessions', INITIAL_MENTORING_SESSIONS);
    return facultyId ? all.filter((m) => m.mentor_faculty_id === facultyId) : all;
  }

  async saveMentoringSession(session: MentoringSession): Promise<MentoringSession> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('mentoring_sessions').upsert(session);
    }
    const all = loadFromStorage('mentoring_sessions', INITIAL_MENTORING_SESSIONS);
    const idx = all.findIndex((m) => m.id === session.id);
    if (idx >= 0) all[idx] = session;
    else all.unshift(session);
    saveToStorage('mentoring_sessions', all);
    this.logAudit('MENTORING_RECORD', 'MentoringSession', session.id, `Mentoring note recorded for student`);
    return session;
  }

  // --- Lab Maintenance ---
  async getLabRequests(): Promise<LabMaintenanceRequest[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('lab_maintenance_requests').select('*');
      if (!error && data && data.length > 0) return data;
    }
    return loadFromStorage('lab_maintenance_requests', INITIAL_LAB_REQUESTS);
  }

  async addLabRequest(req: LabMaintenanceRequest): Promise<LabMaintenanceRequest> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('lab_maintenance_requests').insert(req);
    }
    const all = loadFromStorage('lab_maintenance_requests', INITIAL_LAB_REQUESTS);
    all.unshift(req);
    saveToStorage('lab_maintenance_requests', all);
    this.logAudit('LAB_ISSUE', 'LabMaintenanceRequest', req.id, `Reported lab issue: ${req.equipment_name}`);
    return req;
  }

  // --- Notifications ---
  async getNotifications(facultyId?: string): Promise<FacultyNotification[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('faculty_notifications').select('*');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const all = loadFromStorage('faculty_notifications', INITIAL_NOTIFICATIONS);
    return facultyId ? all.filter((n) => n.faculty_id === facultyId) : all;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const all = loadFromStorage('faculty_notifications', INITIAL_NOTIFICATIONS);
    const notif = all.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      saveToStorage('faculty_notifications', all);
    }
  }

  // --- Audit Logs ---
  async getAuditLogs(): Promise<AuditLog[]> {
    return loadFromStorage('audit_logs', INITIAL_AUDIT_LOGS);
  }

  private logAudit(action: string, entity: string, entity_id: string, details: string): void {
    const logs = loadFromStorage('audit_logs', INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      user_id: this.getCurrentFacultyId(),
      user_name: 'Dr. Mohan Palaniappan',
      action,
      entity,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();
    saveToStorage('audit_logs', logs);
  }

  // Reset to initial seed demo data
  resetToDemoData(): void {
    localStorage.removeItem('facultyos_db_departments');
    localStorage.removeItem('facultyos_db_faculty_profiles');
    localStorage.removeItem('facultyos_db_academic_classes');
    localStorage.removeItem('facultyos_db_class_sections');
    localStorage.removeItem('facultyos_db_college_class_groups');
    localStorage.removeItem('facultyos_db_subjects');
    localStorage.removeItem('facultyos_db_students');
    localStorage.removeItem('facultyos_db_timetable_entries');
    localStorage.removeItem('facultyos_db_course_units');
    localStorage.removeItem('facultyos_db_lesson_plans');
    localStorage.removeItem('facultyos_db_teaching_logs');
    localStorage.removeItem('facultyos_db_attendance_sessions');
    localStorage.removeItem('facultyos_db_attendance_records');
    localStorage.removeItem('facultyos_db_assignments');
    localStorage.removeItem('facultyos_db_assignment_submissions');
    localStorage.removeItem('facultyos_db_assessments');
    localStorage.removeItem('facultyos_db_assessment_marks');
    localStorage.removeItem('facultyos_db_question_bank');
    localStorage.removeItem('facultyos_db_exam_duties');
    localStorage.removeItem('facultyos_db_faculty_tasks');
    localStorage.removeItem('facultyos_db_leave_requests');
    localStorage.removeItem('facultyos_db_announcements');
    localStorage.removeItem('facultyos_db_meetings');
    localStorage.removeItem('facultyos_db_faculty_research_projects');
    localStorage.removeItem('facultyos_db_publications');
    localStorage.removeItem('facultyos_db_faculty_development_records');
    localStorage.removeItem('facultyos_db_student_projects');
    localStorage.removeItem('facultyos_db_mentoring_sessions');
    localStorage.removeItem('facultyos_db_lab_maintenance_requests');
    localStorage.removeItem('facultyos_db_faculty_notifications');
    localStorage.removeItem('facultyos_db_audit_logs');
  }
}

export const dataService = new DataService();

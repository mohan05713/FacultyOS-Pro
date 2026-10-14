import React, { useState, useEffect } from 'react';
import {
  Clock,
  BookOpen,
  Calendar,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Award,
  Bell,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  CheckSquare,
  HelpCircle,
  Briefcase,
  Layers,
  MapPin,
  TrendingUp,
  Database,
} from 'lucide-react';
import {
  FacultyProfile,
  TimetableEntry,
  Subject,
  AttendanceSession,
  Assignment,
  AssignmentSubmission,
  LessonPlan,
  ExamDuty,
  FacultyTask,
  Announcement,
  Meeting,
  MentoringSession,
  CollegeClassGroup,
} from '../types/database';
import { dataService } from '../services/dataService';
import { verifySupabaseConnection, SupabaseVerificationResult } from '../lib/supabaseClient';

interface DashboardViewProps {
  currentFaculty: FacultyProfile | null;
  onNavigateTab: (tabId: string) => void;
  onOpenAiAssistant: () => void;
  onOpenSettings?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentFaculty,
  onNavigateTab,
  onOpenAiAssistant,
  onOpenSettings,
}) => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classGroups, setClassGroups] = useState<CollegeClassGroup[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [examDuties, setExamDuties] = useState<ExamDuty[]>([]);
  const [tasks, setTasks] = useState<FacultyTask[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [mentoringSessions, setMentoringSessions] = useState<MentoringSession[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseVerificationResult | null>(null);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const currentDayName = daysOfWeek[currentTime.getDay()];
  const isWeekend = currentDayName === 'Sunday';

  useEffect(() => {
    verifySupabaseConnection().then(setSupabaseStatus);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!currentFaculty) return;

    const loadData = async () => {
      const [
        ttData,
        subData,
        grpData,
        attData,
        asgData,
        submData,
        lpData,
        dutyData,
        taskData,
        ancData,
        meetData,
        mentData,
      ] = await Promise.all([
        dataService.getTimetable(isWeekend ? 'Monday' : currentDayName, currentFaculty.id),
        dataService.getSubjects(currentFaculty.department_id),
        dataService.getClassGroups(),
        dataService.getAttendanceSessions(currentFaculty.id),
        dataService.getAssignments(currentFaculty.id),
        dataService.getAssignmentSubmissions(),
        dataService.getLessonPlans(currentFaculty.id),
        dataService.getExamDuties(currentFaculty.id),
        dataService.getFacultyTasks(currentFaculty.id),
        dataService.getAnnouncements(),
        dataService.getMeetings(),
        dataService.getMentoringSessions(currentFaculty.id),
      ]);

      setTimetable(ttData);
      setSubjects(subData);
      setClassGroups(grpData);
      setAttendanceSessions(attData);
      setAssignments(asgData);
      setSubmissions(submData);
      setLessonPlans(lpData);
      setExamDuties(dutyData);
      setTasks(taskData);
      setAnnouncements(ancData);
      setMeetings(meetData);
      setMentoringSessions(mentData);
    };

    loadData();
  }, [currentFaculty, currentDayName, isWeekend]);

  // Current & Next Class calculation based on current time
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const getMinutesFromTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const currentClass = timetable.find((entry) => {
    const startMin = getMinutesFromTime(entry.start_time);
    const endMin = getMinutesFromTime(entry.end_time);
    return currentMinutes >= startMin && currentMinutes < endMin;
  });

  const nextClass = timetable.find((entry) => {
    const startMin = getMinutesFromTime(entry.start_time);
    return currentMinutes < startMin;
  });

  const remainingMinutesInCurrent = currentClass
    ? getMinutesFromTime(currentClass.end_time) - currentMinutes
    : 0;

  const minutesUntilNext = nextClass
    ? getMinutesFromTime(nextClass.start_time) - currentMinutes
    : 0;

  // Uncompleted attendance for today's classes
  const todayDateStr = currentTime.toISOString().split('T')[0];
  const uncompletedAttendance = timetable.filter((entry) => {
    const endMin = getMinutesFromTime(entry.end_time);
    const hasPassed = currentMinutes >= endMin || true; // show for testing today's schedule
    const hasSession = attendanceSessions.some(
      (s) => s.period_number === entry.period_number && s.date === todayDateStr
    );
    return !hasSession;
  });

  // Pending grading
  const pendingGradingSubmissions = submissions.filter((s) => s.status === 'Submitted');

  // Pending tasks
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');
  const urgentTasks = pendingTasks.filter((t) => t.priority === 'Urgent' || t.priority === 'High');

  // Helper lookup
  const getSubjectName = (subId: string) => {
    return subjects.find((s) => s.id === subId)?.name || 'Course Class';
  };

  const getClassGroupName = (grpId: string) => {
    return classGroups.find((g) => g.id === grpId)?.name || 'Class Group';
  };

  return (
    <div className="space-y-6">
      {/* Supabase Project Connection Status Notice */}
      {!supabaseStatus?.isConnected && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300">Target Supabase Project Linked:</span>{' '}
              <span className="font-mono text-slate-300">https://rqxaagvluakuoykuyswa.supabase.co</span>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                App is currently in offline fallback mode. Enter your public <code>anon</code> API key to initiate real database queries.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs whitespace-nowrap self-start sm:self-auto shadow-sm"
          >
            Configure Anon Key →
          </button>
        </div>
      )}

      {/* Faculty Profile Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white font-black text-2xl">
              {currentFaculty?.full_name?.charAt(0) || 'F'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {currentFaculty?.full_name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentFaculty?.faculty_id}
                </span>
                {currentFaculty?.roles?.map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {r.replace('_', ' ')}
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate-300 mt-1">
                {currentFaculty?.designation} • Dept. of Computer Science & Engineering
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Office: <span className="text-slate-300 font-medium">{currentFaculty?.office_room}</span> • Office Hours: {currentFaculty?.office_hours}
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-xl p-3 text-center min-w-[90px]">
              <span className="text-xs text-slate-400 font-medium block">Today's Classes</span>
              <span className="text-xl font-bold text-indigo-400 mt-1 block">
                {timetable.length}
              </span>
            </div>
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-xl p-3 text-center min-w-[90px]">
              <span className="text-xs text-slate-400 font-medium block">Unmarked Attd.</span>
              <span className={`text-xl font-bold mt-1 block ${uncompletedAttendance.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {uncompletedAttendance.length}
              </span>
            </div>
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-xl p-3 text-center min-w-[90px]">
              <span className="text-xs text-slate-400 font-medium block">To Grade</span>
              <span className={`text-xl font-bold mt-1 block ${pendingGradingSubmissions.length > 0 ? 'text-sky-400' : 'text-slate-400'}`}>
                {pendingGradingSubmissions.length}
              </span>
            </div>
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-xl p-3 text-center min-w-[90px]">
              <span className="text-xs text-slate-400 font-medium block">Tasks Due</span>
              <span className="text-xl font-bold text-rose-400 mt-1 block">
                {urgentTasks.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Live Status Bar: Current & Next Class Countdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Class Status */}
        <div className={`p-4 rounded-xl border transition-all ${
          currentClass
            ? 'bg-gradient-to-br from-indigo-950/60 to-slate-900 border-indigo-500/40'
            : 'bg-slate-800/40 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Current Class Status
            </span>
            {currentClass && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                {remainingMinutesInCurrent}m remaining
              </span>
            )}
          </div>

          {currentClass ? (
            <div>
              <h3 className="text-lg font-bold text-white">
                {getSubjectName(currentClass.subject_id)}
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-300 mt-2">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  {getClassGroupName(currentClass.class_group_id)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  {currentClass.room_number} {currentClass.is_lab && '(Lab Session)'}
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {currentClass.start_time} - {currentClass.end_time}
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors"
              >
                Take Live Class Attendance
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="py-2">
              <h3 className="text-sm font-semibold text-slate-200">
                No active lecture at this exact moment
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You are currently in a free period or break interval. Ideal time for research, grading, or syllabus planning.
              </p>
              <button
                onClick={() => onNavigateTab('timetable')}
                className="mt-2 text-xs text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1"
              >
                Inspect Today's Timetable & Free Intervals <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Next Scheduled Class */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Next Scheduled Session
            </span>
            {nextClass && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                In {minutesUntilNext > 60 ? `${Math.floor(minutesUntilNext / 60)}h ${minutesUntilNext % 60}m` : `${minutesUntilNext}m`}
              </span>
            )}
          </div>

          {nextClass ? (
            <div>
              <h3 className="text-lg font-bold text-white">
                {getSubjectName(nextClass.subject_id)}
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-300 mt-2">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  {getClassGroupName(nextClass.class_group_id)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {nextClass.room_number}
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  {nextClass.start_time} - {nextClass.end_time}
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('curriculum')}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-600 transition-colors"
              >
                Review Lesson Plan for this Topic
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="py-2">
              <h3 className="text-sm font-semibold text-slate-300">
                All scheduled teaching periods for today are concluded
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You have fulfilled all classroom teaching duties for {currentDayName}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Faculty Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Teaching Schedule & Urgent Academic Duties */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Timetable Stream */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Teaching Schedule for {isWeekend ? 'Monday (Upcoming Week)' : currentDayName}
                </h3>
                <p className="text-xs text-slate-400">
                  Calculated from verified master timetable records
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('timetable')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Full Timetable <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {timetable.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
                No classes scheduled for today.
              </div>
            ) : (
              <div className="space-y-2.5">
                {timetable.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/50 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-indigo-300 font-bold uppercase leading-none">Period</span>
                        <span className="text-sm font-extrabold text-white leading-none mt-0.5">{entry.period_number}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {getSubjectName(entry.subject_id)}
                          </span>
                          {entry.is_lab && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              LAB
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="font-mono">{entry.start_time} - {entry.end_time}</span>
                          <span>•</span>
                          <span>{getClassGroupName(entry.class_group_id)}</span>
                          <span>•</span>
                          <span>Room {entry.room_number}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigateTab('attendance')}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                      >
                        Attendance
                      </button>
                      <button
                        onClick={() => onNavigateTab('curriculum')}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                      >
                        Plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actionable Alerts & Tasks Due */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-rose-400" />
                  Academic Tasks & Action Items
                </h3>
                <p className="text-xs text-slate-400">
                  Prioritized duties requiring attention
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('workload')}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                Task Manager <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {pendingTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        await dataService.toggleTaskStatus(task.id);
                        if (currentFaculty) {
                          const updated = await dataService.getFacultyTasks(currentFaculty.id);
                          setTasks(updated);
                        }
                      }}
                      className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center hover:border-emerald-500 text-emerald-400 transition-colors"
                      title="Mark as completed"
                    >
                      {task.status === 'Completed' && <CheckCircle className="w-4 h-4" />}
                    </button>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                          task.priority === 'Urgent'
                            ? 'bg-rose-500/20 text-rose-300'
                            : task.priority === 'High'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {task.priority}
                        </span>
                        <span>Due: {task.due_date}</span>
                        <span>•</span>
                        <span>{task.category}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-slate-400">
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: College Announcements, Exam Invigilations, & Mentoring */}
        <div className="space-y-6">
          {/* Important College & Department Circulars */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                Department Circulars & Notices
              </h3>
              <button
                onClick={() => onNavigateTab('department')}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-200 line-clamp-1">
                      {ann.title}
                    </span>
                    {ann.is_pinned && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        PINNED
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 line-clamp-2 text-[11px]">
                    {ann.content}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                    <span>{ann.author_name}</span>
                    <span>{ann.published_date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exam Duty Invigilation Notice */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-sky-400" />
                Exam Invigilation Schedule
              </h3>
              <button
                onClick={() => onNavigateTab('examinations')}
                className="text-[11px] font-semibold text-sky-400 hover:text-sky-300"
              >
                Exams Hub
              </button>
            </div>

            {examDuties.length === 0 ? (
              <p className="text-xs text-slate-400">No upcoming exam duties assigned.</p>
            ) : (
              <div className="space-y-2.5">
                {examDuties.map((duty) => (
                  <div
                    key={duty.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{duty.exam_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300">
                        {duty.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 mt-2 text-[11px]">
                      <span>{duty.exam_date} • {duty.session}</span>
                      <span className="font-semibold text-slate-300">{duty.hall_number}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mentoring & Counseling Appointments */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Student Mentoring Mentees
              </h3>
              <button
                onClick={() => onNavigateTab('mentoring')}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Mentoring Hub
              </button>
            </div>

            {mentoringSessions.length === 0 ? (
              <p className="text-xs text-slate-400">No pending student counseling sessions.</p>
            ) : (
              <div className="space-y-2">
                {mentoringSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">
                        Concern: {session.concern_type}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        {session.outcome_status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">
                      {session.discussion_notes}
                    </p>
                    {session.follow_up_date && (
                      <span className="text-[10px] text-amber-400 block mt-2 font-medium">
                        Follow-up scheduled: {session.follow_up_date}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

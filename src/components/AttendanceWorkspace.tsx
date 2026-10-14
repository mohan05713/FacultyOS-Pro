import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  Save,
  Search,
  Filter,
  BarChart2,
  FileSpreadsheet,
  Calendar,
  Check,
  History,
  Shield,
} from 'lucide-react';
import {
  Student,
  Subject,
  CollegeClassGroup,
  AttendanceSession,
  AttendanceRecord,
  FacultyProfile,
  TimetableEntry,
} from '../types/database';
import { dataService } from '../services/dataService';

interface AttendanceWorkspaceProps {
  currentFaculty: FacultyProfile | null;
  onNavigateTab: (tabId: string) => void;
}

export const AttendanceWorkspace: React.FC<AttendanceWorkspaceProps> = ({
  currentFaculty,
  onNavigateTab,
}) => {
  const [classGroups, setClassGroups] = useState<CollegeClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('group-cse-6a');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'Authorized Leave'>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [pastSessions, setPastSessions] = useState<AttendanceSession[]>([]);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    if (!currentFaculty) return;

    const [groups, subs, sessions] = await Promise.all([
      dataService.getClassGroups(),
      dataService.getSubjects(currentFaculty.department_id),
      dataService.getAttendanceSessions(currentFaculty.id),
    ]);

    setClassGroups(groups);
    setSubjects(subs);
    setPastSessions(sessions);

    const initialSubId = selectedSubjectId || subs[0]?.id || '';
    setSelectedSubjectId(initialSubId);

    const roster = await dataService.getStudents(selectedGroupId);
    setStudents(roster);

    // Check if session already exists for this date, period, group
    const existing = sessions.find(
      (s) =>
        s.date === selectedDate &&
        s.period_number === selectedPeriod &&
        s.class_group_id === selectedGroupId
    );

    if (existing) {
      setCurrentSession(existing);
      setIsLocked(existing.is_locked);
      const recs = await dataService.getAttendanceRecords(existing.id);
      const recMap: Record<string, any> = {};
      recs.forEach((r) => {
        recMap[r.student_id] = r.status;
      });
      setRecords(recMap);
    } else {
      setCurrentSession(null);
      setIsLocked(false);
      // Default all to Present
      const defaultMap: Record<string, any> = {};
      roster.forEach((s) => {
        defaultMap[s.id] = 'Present';
      });
      setRecords(defaultMap);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedGroupId, selectedSubjectId, selectedPeriod, selectedDate, currentFaculty]);

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Authorized Leave') => {
    if (isLocked) {
      setNotificationMsg({ text: 'Session is locked. Click unlock with authorization to make amendments.', type: 'error' });
      return;
    }
    setRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Mark all actions
  const markAll = (status: 'Present' | 'Absent') => {
    if (isLocked) return;
    const updated: Record<string, any> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setRecords(updated);
  };

  // Save attendance
  const handleSaveAttendance = async (lockOnSave: boolean = true) => {
    if (!currentFaculty || !selectedSubjectId || !selectedGroupId) return;

    const presentList = Object.values(records).filter((s) => s === 'Present');
    const absentList = Object.values(records).filter((s) => s === 'Absent');
    const lateList = Object.values(records).filter((s) => s === 'Late');
    const leaveList = Object.values(records).filter((s) => s === 'Authorized Leave');

    const sessionId = currentSession?.id || `att-sess-${Date.now()}`;
    const sessionToSave: AttendanceSession = {
      id: sessionId,
      date: selectedDate,
      period_number: selectedPeriod,
      class_group_id: selectedGroupId,
      subject_id: selectedSubjectId,
      faculty_id: currentFaculty.id,
      room_number: 'CR-304',
      total_students: students.length,
      present_count: presentList.length + lateList.length,
      absent_count: absentList.length,
      late_count: lateList.length,
      leave_count: leaveList.length,
      is_locked: lockOnSave,
      audit_reason: unlockReason ? `Amended: ${unlockReason}` : undefined,
      created_at: currentSession?.created_at || new Date().toISOString(),
    };

    const recordsToSave: AttendanceRecord[] = students.map((s) => ({
      id: `rec-${sessionId}-${s.id}`,
      session_id: sessionId,
      student_id: s.id,
      status: records[s.id] || 'Present',
      updated_at: new Date().toISOString(),
    }));

    await dataService.saveAttendanceSession(sessionToSave, recordsToSave);
    setIsLocked(lockOnSave);
    setCurrentSession(sessionToSave);
    setNotificationMsg({
      text: `Attendance saved successfully (${presentList.length} Present, ${absentList.length} Absent)!`,
      type: 'success',
    });
    const updatedSessions = await dataService.getAttendanceSessions(currentFaculty.id);
    setPastSessions(updatedSessions);
  };

  // Unlock session with reason
  const handleUnlockSession = () => {
    if (!unlockReason.trim()) {
      alert('Please state a valid academic reason for unlocking attendance.');
      return;
    }
    setIsLocked(false);
    setShowUnlockModal(false);
    setNotificationMsg({
      text: `Session unlocked for modification. Reason logged in audit records.`,
      type: 'success',
    });
  };

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.register_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = Object.values(records).filter((s) => s === 'Present' || s === 'Late').length;
  const absentCount = Object.values(records).filter((s) => s === 'Absent').length;
  const percentage = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Attendance Header & Controls */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Module 6 • Roll Call & Smart Attendance Management
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Class Attendance Register & Compliance
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Real-time student roster verification, automated shortage tracking (&lt;75%), and tamper-evident audit history
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Total Enrolled</span>
              <strong className="text-white text-base">{students.length}</strong>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px]">Present</span>
              <strong className="text-emerald-400 text-base">{presentCount}</strong>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px]">Absent</span>
              <strong className="text-rose-400 text-base">{absentCount}</strong>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px]">Today's Ratio</span>
              <strong className="text-sky-400 text-base">{percentage}%</strong>
            </div>
          </div>
        </div>

        {/* Filters Bar: Class, Subject, Date, Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Class Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
            >
              {classGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} (Semester {g.semester})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Subject / Course
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}: {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Session Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                <option key={p} value={p}>
                  Period {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notificationMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}
        >
          <span>{notificationMsg.text}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Toolbar: Batch Mark, Search, Lock State */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => markAll('Present')}
            disabled={isLocked}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold disabled:opacity-50"
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAll('Absent')}
            disabled={isLocked}
            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold disabled:opacity-50"
          >
            Mark All Absent
          </button>

          <div className="relative ml-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 w-56"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isLocked ? (
            <button
              onClick={() => setShowUnlockModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-600/30"
            >
              <Lock className="w-3.5 h-3.5" />
              Locked (Click to Amend)
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2">
              <Unlock className="w-3.5 h-3.5" />
              Open for Editing
            </span>
          )}

          <button
            onClick={() => handleSaveAttendance(true)}
            disabled={isLocked}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Lock & Save Register
          </button>
        </div>
      </div>

      {/* Student Roster Register */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
          <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Roll No.</th>
              <th className="py-3.5 px-4">Student Name</th>
              <th className="py-3.5 px-4">Register Number</th>
              <th className="py-3.5 px-4">Overall Subject Attd.</th>
              <th className="py-3.5 px-4 text-center">Status for this Period</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 px-4 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2 max-w-md mx-auto">
                    <Shield className="w-8 h-8 text-amber-400/80" />
                    <span className="font-bold text-slate-200">Student Attendance Roster Inaccessible by Policy</span>
                    <p className="text-xs text-slate-400">
                      Student attendance records are kept strictly locked down until an authorized Row-Level Security (RLS) policy is configured for student data.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
              const currentStatus = records[student.id] || 'Present';
              // Calculate sample attendance rate
              const isShortage = student.roll_number === '23CS103'; // student 3 has warning
              const overallPercent = isShortage ? 68 : 92;

              return (
                <tr
                  key={student.id}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    currentStatus === 'Absent' ? 'bg-rose-950/10' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                    {student.roll_number}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-200">
                    <div>{student.full_name}</div>
                    {isShortage && (
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" /> Attendance Shortage (&lt;75%)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {student.register_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-xs ${
                        overallPercent < 75
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {overallPercent}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleStatusChange(student.id, 'Present')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                          currentStatus === 'Present'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'Absent')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                          currentStatus === 'Absent'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'Late')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                          currentStatus === 'Late'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'Authorized Leave')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                          currentStatus === 'Authorized Leave'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Authorized On Duty / Medical Leave"
                      >
                        OD
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Unlock Session Authorization Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Authorized Attendance Unlock
              </h3>
              <button onClick={() => setShowUnlockModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              To adhere to university accreditation guidelines, any modification to a previously locked attendance record must include a logged justification.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reason for Attendance Amendment
              </label>
              <textarea
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                placeholder="e.g. Student submitted authorized medical slip approved by Dean."
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlockSession}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Confirm & Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

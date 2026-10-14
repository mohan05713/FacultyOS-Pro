import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle,
  Filter,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  MapPin,
  Users,
  Coffee,
  X,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import {
  TimetableEntry,
  Subject,
  CollegeClassGroup,
  FacultyProfile,
  Department,
} from '../types/database';
import { dataService } from '../services/dataService';

interface TimetableWorkspaceProps {
  currentFaculty: FacultyProfile | null;
  facultyProfiles: FacultyProfile[];
  onNavigateTab: (tabId: string) => void;
  onOpenAiAssistant: () => void;
}

export const TimetableWorkspace: React.FC<TimetableWorkspaceProps> = ({
  currentFaculty,
  facultyProfiles,
  onNavigateTab,
  onOpenAiAssistant,
}) => {
  const [allEntries, setAllEntries] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classGroups, setClassGroups] = useState<CollegeClassGroup[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>(currentFaculty?.id || 'all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('weekly');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State for creating/editing timetable entry
  const [formEntry, setFormEntry] = useState<Partial<TimetableEntry>>({
    day_of_week: 'Monday',
    period_number: 1,
    start_time: '09:00',
    end_time: '09:50',
    class_group_id: '',
    subject_id: '',
    faculty_id: currentFaculty?.id || '',
    room_number: 'CR-304',
    is_lab: false,
    academic_year: '2026-2027',
    semester: 6,
  });

  const days: TimetableEntry['day_of_week'][] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const periodConfig = dataService.periodTimings;

  const loadData = async () => {
    const [entries, subs, groups] = await Promise.all([
      dataService.getTimetable(),
      dataService.getSubjects(),
      dataService.getClassGroups(),
    ]);
    setAllEntries(entries);
    setSubjects(subs);
    setClassGroups(groups);
    if (!formEntry.class_group_id && groups.length > 0) {
      setFormEntry((prev) => ({ ...prev, class_group_id: groups[0].id }));
    }
    if (!formEntry.subject_id && subs.length > 0) {
      setFormEntry((prev) => ({ ...prev, subject_id: subs[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFaculty]);

  // Filter entries
  const filteredEntries = allEntries.filter((entry) => {
    if (selectedFacultyFilter !== 'all' && entry.faculty_id !== selectedFacultyFilter && entry.substitute_faculty_id !== selectedFacultyFilter) {
      return false;
    }
    if (selectedGroupFilter !== 'all' && entry.class_group_id !== selectedGroupFilter) {
      return false;
    }
    return true;
  });

  // Free Class Predictor Calculations for Current Faculty
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const getMinutesFromTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const facultyDayEntries = allEntries
    .filter(
      (e) =>
        e.day_of_week === selectedDay &&
        (e.faculty_id === currentFaculty?.id || e.substitute_faculty_id === currentFaculty?.id)
    )
    .sort((a, b) => a.period_number - b.period_number);

  // Teaching periods vs free periods calculation
  const teachingPeriodNumbers = new Set(facultyDayEntries.map((e) => e.period_number));

  const freePeriodsToday = periodConfig.filter(
    (p) => !p.isBreak && !p.isLunch && !teachingPeriodNumbers.has(p.period)
  );

  const totalTeachingMinutesToday = facultyDayEntries.reduce((acc, curr) => {
    return acc + (getMinutesFromTime(curr.end_time) - getMinutesFromTime(curr.start_time));
  }, 0);

  const totalFreeMinutesToday = freePeriodsToday.reduce((acc, curr) => {
    return acc + (getMinutesFromTime(curr.end) - getMinutesFromTime(curr.start));
  }, 0);

  // Handle Save
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formEntry.subject_id || !formEntry.class_group_id || !formEntry.faculty_id) {
      setErrorMsg('Please select subject, class group, and faculty.');
      return;
    }

    const timing = periodConfig.find((p) => p.period === Number(formEntry.period_number));
    const entryToSave: TimetableEntry = {
      id: formEntry.id || `tt-${Date.now()}`,
      day_of_week: formEntry.day_of_week || 'Monday',
      period_number: Number(formEntry.period_number),
      start_time: timing ? timing.start : formEntry.start_time || '09:00',
      end_time: timing ? timing.end : formEntry.end_time || '09:50',
      class_group_id: formEntry.class_group_id,
      subject_id: formEntry.subject_id,
      faculty_id: formEntry.faculty_id,
      room_number: formEntry.room_number || 'CR-304',
      is_lab: Boolean(formEntry.is_lab),
      lab_name: formEntry.lab_name,
      academic_year: '2026-2027',
      semester: Number(formEntry.semester) || 6,
      created_at: new Date().toISOString(),
    };

    const res = await dataService.saveTimetableEntry(entryToSave);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg('Timetable session successfully scheduled and saved to database!');
      setShowAddModal(false);
      await loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled class from the master timetable?')) {
      await dataService.deleteTimetableEntry(id);
      await loadData();
    }
  };

  const getSubject = (subId: string) => subjects.find((s) => s.id === subId);
  const getGroup = (grpId: string) => classGroups.find((g) => g.id === grpId);
  const getFaculty = (facId: string) => facultyProfiles.find((f) => f.id === facId);

  return (
    <div className="space-y-6">
      {/* Top Banner & Free Class Predictor Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Smart Timetable & Free Class Predictor
                </h2>
                <p className="text-xs text-slate-300">
                  Real-time period detector, conflict resolver, and faculty time utilization engine
                </p>
              </div>
            </div>

            {/* Free Class Summary Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
                <span className="text-slate-400 font-medium">Selected Day:</span>{' '}
                <span className="text-white font-bold">{selectedDay}</span>
              </div>
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
                <span className="text-slate-400 font-medium">Teaching Load:</span>{' '}
                <span className="text-indigo-400 font-bold">{facultyDayEntries.length} periods ({totalTeachingMinutesToday} mins)</span>
              </div>
              <div className="bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-800/60 text-xs">
                <span className="text-emerald-300 font-medium">Available Free Periods:</span>{' '}
                <span className="text-emerald-400 font-bold">{freePeriodsToday.length} periods ({totalFreeMinutesToday} mins)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => {
                setFormEntry({
                  day_of_week: selectedDay as any,
                  period_number: 1,
                  start_time: '09:00',
                  end_time: '09:50',
                  class_group_id: classGroups[0]?.id || '',
                  subject_id: subjects[0]?.id || '',
                  faculty_id: currentFaculty?.id || '',
                  room_number: 'CR-304',
                  is_lab: false,
                  academic_year: '2026-2027',
                  semester: 6,
                });
                setShowAddModal(true);
              }}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Schedule Class Session
            </button>

            <button
              onClick={() => onNavigateTab('subjects')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Manage Subjects
            </button>

            <button
              onClick={() => onNavigateTab('class_groups')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              Manage Class Groups
            </button>

            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
              title="Get productivity suggestions for free periods"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              Free Hours AI
            </button>
          </div>
        </div>

        {/* Free Period Productivity Suggestion Bar */}
        {freePeriodsToday.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between text-xs text-slate-300 gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                <strong>Next Predicted Free Window:</strong> Period {freePeriodsToday[0].period} ({freePeriodsToday[0].start} - {freePeriodsToday[0].end})
              </span>
            </div>
            <div className="text-slate-400">
              Suggested tasks: <span className="text-indigo-300">Grade Assignment 2 (4 submissions pending)</span> or <span className="text-sky-300">Review Lesson Plan for Unit 3</span>
            </div>
          </div>
        )}
      </div>

      {/* Notifications / Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-rose-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and View Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* Day Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700/80">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  selectedDay === day
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700/80">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                viewMode === 'weekly' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly Grid
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                viewMode === 'daily' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Timeline
            </button>
          </div>
        </div>

        {/* Faculty and Class Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedFacultyFilter}
            onChange={(e) => setSelectedFacultyFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Faculty</option>
            {facultyProfiles.map((f) => (
              <option key={f.id} value={f.id}>
                {f.full_name}
              </option>
            ))}
          </select>

          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Class Groups</option>
            {classGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timetable Display */}
      {viewMode === 'weekly' ? (
        /* Weekly Grid View */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-28">Day / Period</th>
                {periodConfig.map((p, idx) => (
                  <th key={idx} className="py-3.5 px-3 text-center min-w-[130px]">
                    <div className="font-bold text-white">{p.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-normal">
                      {p.start} - {p.end}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {days.map((day) => {
                const daySessions = filteredEntries.filter((e) => e.day_of_week === day);

                return (
                  <tr
                    key={day}
                    className={`hover:bg-slate-800/20 transition-colors ${
                      selectedDay === day ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-200 bg-slate-900/80 whitespace-nowrap border-r border-slate-800">
                      {day}
                    </td>

                    {periodConfig.map((p, pIdx) => {
                      if (p.isBreak || p.isLunch) {
                        return (
                          <td
                            key={pIdx}
                            className="p-2 text-center bg-slate-950/40 text-[10px] font-semibold text-slate-500 border-r border-slate-800/50"
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <Coffee className="w-3.5 h-3.5 mb-0.5 opacity-60" />
                              <span>{p.isLunch ? 'Lunch Break' : 'Tea Break'}</span>
                            </div>
                          </td>
                        );
                      }

                      const matchedEntry = daySessions.find(
                        (e) => e.period_number === p.period
                      );

                      if (!matchedEntry) {
                        return (
                          <td
                            key={pIdx}
                            className="p-2 text-center text-slate-600 border-r border-slate-800/50"
                          >
                            <span className="text-[11px] italic font-mono opacity-40">Free</span>
                          </td>
                        );
                      }

                      const subject = getSubject(matchedEntry.subject_id);
                      const faculty = getFaculty(matchedEntry.faculty_id);
                      const group = getGroup(matchedEntry.class_group_id);

                      return (
                        <td key={pIdx} className="p-2 border-r border-slate-800/50">
                          <div className={`p-2.5 rounded-xl border text-left transition-all ${
                            matchedEntry.is_lab
                              ? 'bg-amber-950/40 border-amber-800/60'
                              : matchedEntry.faculty_id === currentFaculty?.id
                              ? 'bg-indigo-950/60 border-indigo-700/60 shadow-sm'
                              : 'bg-slate-800/60 border-slate-700/60'
                          }`}>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-white truncate text-xs" title={subject?.name}>
                                {subject?.code || 'Course'}
                              </span>
                              {matchedEntry.is_lab && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                  LAB
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 truncate font-medium">
                              {group?.name}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                              <span>{matchedEntry.room_number}</span>
                              <span className="truncate max-w-[70px]">{faculty?.full_name?.split(' ')?.[1] || 'Staff'}</span>
                            </div>

                            {/* Actions on hover/click */}
                            <div className="mt-2 pt-1.5 border-t border-slate-700/50 flex items-center justify-between">
                              <button
                                onClick={() => onNavigateTab('attendance')}
                                className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold"
                              >
                                Attendance
                              </button>
                              <button
                                onClick={() => handleDelete(matchedEntry.id)}
                                className="text-slate-500 hover:text-rose-400 p-0.5"
                                title="Remove class"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Daily Timeline View */
        <div className="space-y-3">
          {periodConfig.map((p, idx) => {
            if (p.isBreak || p.isLunch) {
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400"
                >
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-slate-300">{p.label}</span>
                  <span className="font-mono text-slate-500">({p.start} - {p.end})</span>
                </div>
              );
            }

            const entry = facultyDayEntries.find((e) => e.period_number === p.period);
            const isCurrentlyActive =
              currentMinutes >= getMinutesFromTime(p.start) &&
              currentMinutes < getMinutesFromTime(p.end);

            if (!entry) {
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/30 border border-dashed border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 w-24">{p.start} - {p.end}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                      FREE PERIOD
                    </span>
                    <span className="text-slate-400">
                      Period {p.period}: No lecture scheduled for you. Available for mentoring, grading, and syllabus preparation.
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setFormEntry({
                        day_of_week: selectedDay as any,
                        period_number: p.period,
                        start_time: p.start,
                        end_time: p.end,
                        class_group_id: classGroups[0]?.id || '',
                        subject_id: subjects[0]?.id || '',
                        faculty_id: currentFaculty?.id || '',
                        room_number: 'CR-304',
                      });
                      setShowAddModal(true);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    + Assign Session
                  </button>
                </div>
              );
            }

            const subject = getSubject(entry.subject_id);
            const group = getGroup(entry.class_group_id);

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isCurrentlyActive
                    ? 'bg-indigo-950/70 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-indigo-300 uppercase font-bold">P{p.period}</span>
                    <span className="text-xs font-mono font-bold text-white">{p.start}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {subject?.code} - {subject?.name}
                      </h4>
                      {entry.is_lab && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          LAB EXPERIMENTS
                        </span>
                      )}
                      {isCurrentlyActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                          LIVE NOW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>Group: <strong className="text-slate-300">{group?.name}</strong></span>
                      <span>•</span>
                      <span>Room: <strong className="text-slate-300">{entry.room_number}</strong></span>
                      <span>•</span>
                      <span>Duration: 50 mins</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateTab('attendance')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Take Attendance
                  </button>
                  <button
                    onClick={() => onNavigateTab('curriculum')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    View Plan
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Timetable Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Schedule Class Session
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Day of the Week
                  </label>
                  <select
                    value={formEntry.day_of_week}
                    onChange={(e) => setFormEntry({ ...formEntry, day_of_week: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Period Number
                  </label>
                  <select
                    value={formEntry.period_number}
                    onChange={(e) => {
                      const pNum = Number(e.target.value);
                      const t = periodConfig.find((p) => p.period === pNum);
                      setFormEntry({
                        ...formEntry,
                        period_number: pNum,
                        start_time: t?.start,
                        end_time: t?.end,
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {periodConfig
                      .filter((p) => !p.isBreak && !p.isLunch)
                      .map((p) => (
                        <option key={p.period} value={p.period}>
                          {p.label} ({p.start} - {p.end})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Subject / Course
                </label>
                <select
                  value={formEntry.subject_id}
                  onChange={(e) => setFormEntry({ ...formEntry, subject_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="">Select Course...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Class Group / Section
                  </label>
                  <select
                    value={formEntry.class_group_id}
                    onChange={(e) => setFormEntry({ ...formEntry, class_group_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  >
                    <option value="">Select Group...</option>
                    {classGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} (Sem {g.semester})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Classroom / Lab Room
                  </label>
                  <input
                    type="text"
                    value={formEntry.room_number || ''}
                    onChange={(e) => setFormEntry({ ...formEntry, room_number: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g. CR-304 or Lab-Cloud-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Faculty Assigned
                </label>
                <select
                  value={formEntry.faculty_id}
                  onChange={(e) => setFormEntry({ ...formEntry, faculty_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                >
                  {facultyProfiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.full_name} ({f.faculty_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_lab_check"
                  checked={Boolean(formEntry.is_lab)}
                  onChange={(e) => setFormEntry({ ...formEntry, is_lab: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_lab_check" className="text-slate-300 font-medium">
                  This is a Laboratory Practical Session (Continuous lab block)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Save Timetable Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

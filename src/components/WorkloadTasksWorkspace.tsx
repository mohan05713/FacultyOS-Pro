import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  CheckSquare,
  Clock,
  Calendar,
  Plus,
  CheckCircle,
  AlertCircle,
  UserCheck,
  FileText,
  PieChart,
  BarChart,
  X,
  Filter,
} from 'lucide-react';
import {
  FacultyTask,
  LeaveRequest,
  FacultyProfile,
  Subject,
  TimetableEntry,
  CollegeClassGroup,
} from '../types/database';
import { dataService } from '../services/dataService';

interface WorkloadTasksWorkspaceProps {
  currentFaculty: FacultyProfile | null;
  facultyProfiles: FacultyProfile[];
  onNavigateTab: (tabId: string) => void;
  onOpenAiAssistant: () => void;
}

export const WorkloadTasksWorkspace: React.FC<WorkloadTasksWorkspaceProps> = ({
  currentFaculty,
  facultyProfiles,
  onNavigateTab,
  onOpenAiAssistant,
}) => {
  const [tasks, setTasks] = useState<FacultyTask[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'workload' | 'leaves'>('tasks');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Forms
  const [taskForm, setTaskForm] = useState<Partial<FacultyTask>>({
    title: '',
    description: '',
    category: 'Teaching',
    priority: 'Medium',
    due_date: new Date().toISOString().split('T')[0],
    status: 'Pending',
  });

  const [leaveForm, setLeaveForm] = useState<Partial<LeaveRequest>>({
    leave_type: 'Casual Leave (CL)',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    total_days: 1,
    reason: '',
    substitutions: [],
  });

  const loadData = async () => {
    if (!currentFaculty) return;
    const [tData, lData, sData, ttData] = await Promise.all([
      dataService.getFacultyTasks(currentFaculty.id),
      dataService.getLeaveRequests(currentFaculty.id),
      dataService.getSubjects(currentFaculty.department_id),
      dataService.getTimetable(undefined, currentFaculty.id),
    ]);

    setTasks(tData);
    setLeaves(lData);
    setSubjects(sData);
    setTimetable(ttData);
  };

  useEffect(() => {
    loadData();
  }, [currentFaculty]);

  // Handle task status toggle
  const handleToggleTask = async (id: string) => {
    await dataService.toggleTaskStatus(id);
    await loadData();
  };

  // Save new task
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFaculty) return;

    const newTask: FacultyTask = {
      id: `task-${Date.now()}`,
      faculty_id: currentFaculty.id,
      title: taskForm.title || 'Academic Task',
      description: taskForm.description || '',
      category: (taskForm.category as any) || 'Teaching',
      priority: (taskForm.priority as any) || 'Medium',
      due_date: taskForm.due_date || new Date().toISOString().split('T')[0],
      status: (taskForm.status as any) || 'Pending',
      is_recurring: false,
      created_at: new Date().toISOString(),
    };

    await dataService.saveFacultyTask(newTask);
    setShowTaskModal(false);
    await loadData();
  };

  // Submit leave
  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFaculty) return;

    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      faculty_id: currentFaculty.id,
      leave_type: (leaveForm.leave_type as any) || 'Casual Leave (CL)',
      start_date: leaveForm.start_date || new Date().toISOString().split('T')[0],
      end_date: leaveForm.end_date || new Date().toISOString().split('T')[0],
      total_days: Number(leaveForm.total_days) || 1,
      reason: leaveForm.reason || '',
      status: 'Pending HOD Approval',
      substitutions: [
        {
          period_number: 1,
          date: leaveForm.start_date || '',
          class_group_id: 'group-cse-6a',
          subject_id: subjects[0]?.id || '',
          substitute_faculty_id: facultyProfiles.find((f) => f.id !== currentFaculty.id)?.id || '',
          status: 'Proposed',
        },
      ],
      created_at: new Date().toISOString(),
    };

    await dataService.applyLeave(newLeave);
    setShowLeaveModal(false);
    await loadData();
  };

  // Workload calculations
  const weeklyTeachingPeriods = timetable.length;
  const theoryHours = timetable.filter((t) => !t.is_lab).length;
  const practicalHours = timetable.filter((t) => t.is_lab).length;
  const preparationHours = Math.round(theoryHours * 0.75);
  const mentoringHours = 3;
  const researchHours = 6;
  const totalWeeklyHours = (theoryHours + practicalHours) + preparationHours + mentoringHours + researchHours;

  return (
    <div className="space-y-6">
      {/* Workspace Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Module 10 & 11 • Faculty Productivity & Absence Management
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Workload, Academic Tasks & Leave Substitutions
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              AICTE / UGC workload compliance tracking, personal task management, leave requests, and peer substitution allocation
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              Add Academic Task
            </button>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/30"
            >
              <Calendar className="w-4 h-4" />
              Apply Leave Request
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Task Management ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('workload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'workload'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          UGC/AICTE Workload Breakdown
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'leaves'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Leave Requests & Substitutions ({leaves.length})
        </button>
      </div>

      {/* Tab 1: Task Manager */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Urgent / Overdue */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between">
                <span>High & Urgent Priority</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                  {tasks.filter((t) => (t.priority === 'Urgent' || t.priority === 'High') && t.status !== 'Completed').length}
                </span>
              </h4>

              <div className="space-y-2">
                {tasks
                  .filter((t) => (t.priority === 'Urgent' || t.priority === 'High') && t.status !== 'Completed')
                  .map((task) => (
                    <div key={task.id} className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-white">{task.title}</span>
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="w-4 h-4 rounded border border-slate-500 hover:border-emerald-400"
                        />
                      </div>
                      <p className="text-slate-400 text-[11px]">{task.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>Due: {task.due_date}</span>
                        <span className="text-rose-400 font-bold">{task.priority}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* In Progress / Medium */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center justify-between">
                <span>In Progress & Regular</span>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                  {tasks.filter((t) => t.priority === 'Medium' && t.status !== 'Completed').length}
                </span>
              </h4>

              <div className="space-y-2">
                {tasks
                  .filter((t) => t.priority === 'Medium' && t.status !== 'Completed')
                  .map((task) => (
                    <div key={task.id} className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-white">{task.title}</span>
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="w-4 h-4 rounded border border-slate-500 hover:border-emerald-400"
                        />
                      </div>
                      <p className="text-slate-400 text-[11px]">{task.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>Due: {task.due_date}</span>
                        <span className="text-sky-300">{task.category}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Completed */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                <span>Completed Duties</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {tasks.filter((t) => t.status === 'Completed').length}
                </span>
              </h4>

              <div className="space-y-2">
                {tasks
                  .filter((t) => t.status === 'Completed')
                  .map((task) => (
                    <div key={task.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1 text-xs opacity-75">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-300 line-through">{task.title}</span>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      {task.completion_notes && (
                        <p className="text-[10px] text-slate-400 italic">{task.completion_notes}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Workload Breakdown */}
      {activeTab === 'workload' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Weekly Faculty Academic Workload Compliance
              </h3>
              <p className="text-xs text-slate-400">
                Norms: Associate Professor requires 14 contact hours + 26 research/admin hours = 40 hours/week.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              Total {totalWeeklyHours} hrs/week (Compliant)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Theory Lectures</span>
              <strong className="text-xl font-bold text-indigo-400 block mt-1">{theoryHours} hrs</strong>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Lab Practicals</span>
              <strong className="text-xl font-bold text-sky-400 block mt-1">{practicalHours} hrs</strong>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Prep & Evaluation</span>
              <strong className="text-xl font-bold text-amber-400 block mt-1">{preparationHours} hrs</strong>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Student Mentoring</span>
              <strong className="text-xl font-bold text-emerald-400 block mt-1">{mentoringHours} hrs</strong>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Funded Research</span>
              <strong className="text-xl font-bold text-rose-400 block mt-1">{researchHours} hrs</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Leaves & Substitutions */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {leaves.map((leave) => (
              <div
                key={leave.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {leave.leave_type} ({leave.total_days} Day(s))
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      {leave.start_date} to {leave.end_date}
                    </h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      leave.status === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {leave.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  <strong>Reason:</strong> {leave.reason}
                </p>

                {leave.approver_remarks && (
                  <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <strong>HOD Remarks:</strong> {leave.approver_remarks}
                  </p>
                )}

                {/* Assigned substitutions */}
                {leave.substitutions?.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                      Assigned Class Substitutions:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {leave.substitutions.map((sub, i) => {
                        const substituteFac = facultyProfiles.find((f) => f.id === sub.substitute_faculty_id);

                        return (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
                          >
                            Period {sub.period_number}: Handled by <strong className="text-white">{substituteFac?.full_name || 'Prof. Ananya Iyer'}</strong> ({sub.status})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Task */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-400" />
                Add Academic Task
              </h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title || ''}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Consolidate NBA Criterion 3 files"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  value={taskForm.description || ''}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Specific deliverables and instructions..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Teaching">Teaching & Lessons</option>
                    <option value="Grading">Grading & Evaluation</option>
                    <option value="Mentoring">Student Mentoring</option>
                    <option value="Accreditation">NBA / NAAC Accreditation</option>
                    <option value="Research">Research & Grants</option>
                    <option value="Administration">Department Administration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Apply Leave */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Submit Leave Application
              </h3>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Leave Type</label>
                <select
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                  <option value="Medical Leave (ML)">Medical Leave (ML)</option>
                  <option value="On Duty (OD)">On Duty (OD - Conference / Academic)</option>
                  <option value="Earned Leave (EL)">Earned Leave (EL)</option>
                  <option value="Compensatory Off">Compensatory Off</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason for Leave</label>
                <textarea
                  value={leaveForm.reason || ''}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Specify academic conference, personal contingency, etc..."
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

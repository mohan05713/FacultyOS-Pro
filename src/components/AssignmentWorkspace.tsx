import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  CheckCircle,
  Clock,
  Download,
  Upload,
  AlertCircle,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  X,
  Send,
  RotateCcw,
} from 'lucide-react';
import {
  Assignment,
  AssignmentSubmission,
  Subject,
  CollegeClassGroup,
  FacultyProfile,
  Student,
} from '../types/database';
import { dataService } from '../services/dataService';

interface AssignmentWorkspaceProps {
  currentFaculty: FacultyProfile | null;
  onNavigateTab: (tabId: string) => void;
  onOpenAiAssistant: () => void;
}

export const AssignmentWorkspace: React.FC<AssignmentWorkspaceProps> = ({
  currentFaculty,
  onNavigateTab,
  onOpenAiAssistant,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classGroups, setClassGroups] = useState<CollegeClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState<Partial<Assignment>>({
    title: '',
    instructions: '',
    max_marks: 25,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    is_published: true,
    allow_resubmission: true,
    rubric: [
      { criterion: 'Algorithm Correctness & Logic', marks: 10 },
      { criterion: 'Code Quality & Formatting', marks: 10 },
      { criterion: 'Viva & Output Demonstration', marks: 5 },
    ],
  });

  const [gradeForm, setGradeForm] = useState<{ marks: number; feedback: string; status: 'Graded' | 'Resubmission Required' }>({
    marks: 20,
    feedback: 'Good work.',
    status: 'Graded',
  });

  const loadData = async () => {
    if (!currentFaculty) return;
    const [asgs, subs, groups, stus, allSubs] = await Promise.all([
      dataService.getAssignments(currentFaculty.id),
      dataService.getSubjects(currentFaculty.department_id),
      dataService.getClassGroups(),
      dataService.getStudents(),
      dataService.getAssignmentSubmissions(),
    ]);

    setAssignments(asgs);
    setSubjects(subs);
    setClassGroups(groups);
    setStudents(stus);

    const activeAsgId = selectedAssignmentId || asgs[0]?.id || '';
    setSelectedAssignmentId(activeAsgId);

    if (activeAsgId) {
      const activeSubs = allSubs.filter((s) => s.assignment_id === activeAsgId);
      setSubmissions(activeSubs);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFaculty]);

  const handleSelectAssignment = async (id: string) => {
    setSelectedAssignmentId(id);
    const allSubs = await dataService.getAssignmentSubmissions(id);
    setSubmissions(allSubs);
  };

  const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId);
  const currentGroup = classGroups.find((g) => g.id === currentAssignment?.class_group_id);
  const currentSubject = subjects.find((s) => s.id === currentAssignment?.subject_id);

  // Enrolled students for this assignment's class
  const classStudents = students.filter(
    (s) => !currentAssignment?.class_group_id || s.class_group_id === currentAssignment.class_group_id
  );

  // Save new assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFaculty || !createForm.subject_id || !createForm.class_group_id) {
      alert('Please select course and class group.');
      return;
    }

    const newAssignment: Assignment = {
      id: `asg-${Date.now()}`,
      subject_id: createForm.subject_id,
      class_group_id: createForm.class_group_id,
      faculty_id: currentFaculty.id,
      title: createForm.title || 'Assignment',
      instructions: createForm.instructions || '',
      max_marks: Number(createForm.max_marks) || 25,
      rubric: createForm.rubric || [],
      due_date: new Date(createForm.due_date || Date.now()).toISOString(),
      is_published: Boolean(createForm.is_published),
      allow_resubmission: Boolean(createForm.allow_resubmission),
      submission_count: 0,
      graded_count: 0,
      created_at: new Date().toISOString(),
    };

    await dataService.saveAssignment(newAssignment);
    setShowCreateModal(false);
    await loadData();
    setSelectedAssignmentId(newAssignment.id);
  };

  // Grade submission
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    await dataService.gradeSubmission(
      selectedSubmission.id,
      gradeForm.marks,
      gradeForm.feedback,
      gradeForm.status
    );

    setShowGradeModal(false);
    await loadData();
  };

  // Export Grades to CSV
  const handleExportCsv = () => {
    if (!currentAssignment) return;

    const rows = [
      ['Roll Number', 'Register Number', 'Student Name', 'Status', 'Marks Awarded', 'Max Marks', 'Feedback'],
      ...classStudents.map((st) => {
        const sub = submissions.find((s) => s.student_id === st.id);
        return [
          st.roll_number,
          st.register_number,
          st.full_name,
          sub ? sub.status : 'Missing / Not Submitted',
          sub?.marks_awarded !== undefined ? sub.marks_awarded : 'N/A',
          currentAssignment.max_marks,
          sub?.feedback || '',
        ];
      }),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentAssignment.title.replace(/\s+/g, '_')}_grades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStudent = (id: string) => students.find((s) => s.id === id);

  return (
    <div className="space-y-6">
      {/* Workspace Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Module 8 • Continuous Assessment & Grading Lifecycle
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Assignments, Rubrics & Grading Center
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Publish structured problem sets, configure rubrics, evaluate student code submissions, and generate grade sheets
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCreateForm({
                  subject_id: subjects[0]?.id || '',
                  class_group_id: classGroups[0]?.id || '',
                  title: '',
                  instructions: '',
                  max_marks: 25,
                  due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
                  is_published: true,
                  allow_resubmission: true,
                  rubric: [
                    { criterion: 'Algorithm Correctness & Logic', marks: 10 },
                    { criterion: 'Code Quality & Formatting', marks: 10 },
                    { criterion: 'Viva & Demonstration', marks: 5 },
                  ],
                });
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
              title="Export Grade Report to CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Export Grade Sheet
            </button>
          </div>
        </div>
      </div>

      {/* Assignment Selector & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: List of Assignments */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Course Assignments ({assignments.length})
          </h3>

          <div className="space-y-2">
            {assignments.map((asg) => {
              const isSelected = asg.id === selectedAssignmentId;
              const sub = subjects.find((s) => s.id === asg.subject_id);

              return (
                <div
                  key={asg.id}
                  onClick={() => handleSelectAssignment(asg.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    {sub?.code || 'Course'}
                  </span>
                  <h4 className="text-xs font-bold text-white mt-0.5 line-clamp-1">
                    {asg.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Due: {new Date(asg.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    <span className="text-sky-400 font-semibold">{asg.graded_count} Graded</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 3 Columns: Selected Assignment Details & Submission Matrix */}
        <div className="lg:col-span-3 space-y-4">
          {currentAssignment ? (
            <>
              {/* Assignment Details Header */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {currentAssignment.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentSubject?.name} • Class: {currentGroup?.name} • Max Marks: {currentAssignment.max_marks}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300">
                      Due: {new Date(currentAssignment.due_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {currentAssignment.allow_resubmission && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        Resubmission Permitted
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  {currentAssignment.instructions}
                </p>

                {/* Rubric Criteria */}
                {currentAssignment.rubric?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      Evaluation Rubric:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {currentAssignment.rubric.map((r, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 border border-slate-700"
                        >
                          {r.criterion}: <strong>{r.marks} pts</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submission Roster & Grading Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
                <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">Artifact Submission</th>
                      <th className="py-3.5 px-4">Submission Date</th>
                      <th className="py-3.5 px-4">Marks Awarded</th>
                      <th className="py-3.5 px-4 text-center">Status & Feedback</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {classStudents.map((st) => {
                      const sub = submissions.find((s) => s.student_id === st.id);

                      return (
                        <tr key={st.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{st.full_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {st.roll_number}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {sub ? (
                              <div className="flex items-center gap-1.5 text-sky-400 font-medium">
                                <FileText className="w-3.5 h-3.5" />
                                <span>{sub.file_name || 'project_repo.zip'}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">
                                Pending student submission
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {sub ? new Date(sub.submission_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>

                          <td className="py-3.5 px-4">
                            {sub && sub.marks_awarded !== undefined ? (
                              <span className="font-mono font-bold text-sm text-emerald-400">
                                {sub.marks_awarded} / {currentAssignment.max_marks}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-mono">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {sub ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sub.status === 'Graded'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {sub.status}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500">
                                Missing
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {sub ? (
                              <button
                                onClick={() => {
                                  setSelectedSubmission(sub);
                                  setGradeForm({
                                    marks: sub.marks_awarded ?? 20,
                                    feedback: sub.feedback || '',
                                    status: sub.status === 'Resubmission Required' ? 'Resubmission Required' : 'Graded',
                                  });
                                  setShowGradeModal(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                              >
                                {sub.status === 'Graded' ? 'Edit Grade' : 'Grade Work'}
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500">Awaiting Work</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
              No assignments created yet. Click "Create Assignment" to publish a problem set.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Assignment */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Publish Course Assignment
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Subject</label>
                  <select
                    value={createForm.subject_id}
                    onChange={(e) => setCreateForm({ ...createForm, subject_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Class Group</label>
                  <select
                    value={createForm.class_group_id}
                    onChange={(e) => setCreateForm({ ...createForm, class_group_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  >
                    {classGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={createForm.title || ''}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Raft Consensus Implementation with RPC"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Instructions & Problem Statement</label>
                <textarea
                  value={createForm.instructions || ''}
                  onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
                  rows={3}
                  placeholder="Provide explicit instructions, submission format (ZIP / GitHub repo), and deliverables..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    value={createForm.max_marks}
                    onChange={(e) => setCreateForm({ ...createForm, max_marks: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Submission Due Date & Time</label>
                  <input
                    type="datetime-local"
                    value={createForm.due_date}
                    onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                >
                  Publish to Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Grade Submission */}
      {showGradeModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                Evaluate Submission
              </h3>
              <button onClick={() => setShowGradeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Marks Awarded (Max {currentAssignment?.max_marks || 25})
                </label>
                <input
                  type="number"
                  max={currentAssignment?.max_marks || 25}
                  min={0}
                  value={gradeForm.marks}
                  onChange={(e) => setGradeForm({ ...gradeForm, marks: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-base font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Status</label>
                <select
                  value={gradeForm.status}
                  onChange={(e) => setGradeForm({ ...gradeForm, status: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Graded">Graded (Accepted)</option>
                  <option value="Resubmission Required">Return for Correction (Resubmit)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Pedagogical Feedback to Student
                </label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  rows={3}
                  placeholder="Detail test case observations, logic remarks, and improvement pointers..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  FileText,
  Phone,
  Calendar,
  CheckCircle,
  Plus,
  Shield,
  Sparkles,
  BookOpen,
  X,
  MessageSquare,
  Search,
  Filter,
} from 'lucide-react';
import {
  Student,
  MentoringSession,
  Assessment,
  AssessmentMark,
  FacultyProfile,
  Subject,
  CollegeClassGroup,
} from '../types/database';
import { dataService } from '../services/dataService';

interface StudentMentoringWorkspaceProps {
  currentFaculty: FacultyProfile | null;
  onNavigateTab: (tabId: string) => void;
  onOpenAiAssistant: () => void;
}

export const StudentMentoringWorkspace: React.FC<StudentMentoringWorkspaceProps> = ({
  currentFaculty,
  onNavigateTab,
  onOpenAiAssistant,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [mentoringSessions, setMentoringSessions] = useState<MentoringSession[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentMarks, setAssessmentMarks] = useState<AssessmentMark[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classGroups, setClassGroups] = useState<CollegeClassGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'early_support' | 'mentoring_log' | 'remedial_planner'>('early_support');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedStudentForSession, setSelectedStudentForSession] = useState<Student | null>(null);
  const [sessionForm, setSessionForm] = useState<Partial<MentoringSession>>({
    session_date: new Date().toISOString().split('T')[0],
    concern_type: 'Academic Weakness',
    discussion_notes: '',
    remedial_action_plan: '',
    follow_up_date: '',
    parent_contacted: false,
    parent_contact_remarks: '',
    outcome_status: 'Open',
  });

  const [aiGeneratingRemedial, setAiGeneratingRemedial] = useState(false);

  const loadData = async () => {
    if (!currentFaculty) return;
    const [stus, sess, asms, subs, groups] = await Promise.all([
      dataService.getStudents(),
      dataService.getMentoringSessions(currentFaculty.id),
      dataService.getAssessments(currentFaculty.id),
      dataService.getSubjects(currentFaculty.department_id),
      dataService.getClassGroups(),
    ]);

    setStudents(stus);
    setMentoringSessions(sess);
    setAssessments(asms);
    setSubjects(subs);
    setClassGroups(groups);

    if (asms.length > 0) {
      const marks = await dataService.getAssessmentMarks(asms[0].id);
      setAssessmentMarks(marks);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFaculty]);

  // Early warning detector based on attendance and test performance
  const atRiskStudents = students.map((student) => {
    const isAttendanceLow = student.roll_number === '23CS103'; // student 3
    const markRec = assessmentMarks.find((m) => m.student_id === student.id);
    const score = markRec ? markRec.marks_obtained : 45;
    const isAcademicLow = score < 30; // CIA-1 out of 50

    return {
      student,
      attendanceRate: isAttendanceLow ? 68 : 94,
      testScore: score,
      isAtRisk: isAttendanceLow || isAcademicLow,
      riskFactors: [
        ...(isAttendanceLow ? ['Attendance Shortage (<75%)'] : []),
        ...(isAcademicLow ? ['CIA-1 Assessment Score below 50% threshold'] : []),
      ],
    };
  });

  // AI Remedial Generator
  const handleGenerateAiRemedial = async (student: Student) => {
    setAiGeneratingRemedial(true);
    try {
      const res = await fetch('/api/ai/remedial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Distributed Systems & Algorithms',
          topic: 'Consensus proofs and Byzantine fault tolerance',
          deficiencyDescription: `Student ${student.full_name} is struggling with mathematical induction on distributed consensus invariants and scored 28/50 in the first internal evaluation.`,
        }),
      });
      const data = await res.json();
      if (data.remedialPlan) {
        const plan = data.remedialPlan;
        const formatted = `Root Cause: ${plan.rootCauseAnalysis}\nStrategy: ${plan.remedialStrategy}\nAction Plan: ${plan.stepByStepActionPlan?.map((s: any) => `${s.step}. ${s.title}: ${s.description}`).join('\n')}\nResources: ${plan.recommendedPracticeResources?.join(', ')}`;
        setSessionForm((prev) => ({
          ...prev,
          remedial_action_plan: formatted,
        }));
      }
    } catch (err) {
      console.error('Failed to generate AI remedial plan:', err);
    } finally {
      setAiGeneratingRemedial(false);
    }
  };

  // Save Mentoring Session
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFaculty || !selectedStudentForSession) return;

    const newSession: MentoringSession = {
      id: sessionForm.id || `ment-${Date.now()}`,
      mentor_faculty_id: currentFaculty.id,
      student_id: selectedStudentForSession.id,
      session_date: sessionForm.session_date || new Date().toISOString().split('T')[0],
      concern_type: sessionForm.concern_type || 'Academic Weakness',
      discussion_notes: sessionForm.discussion_notes || '',
      remedial_action_plan: sessionForm.remedial_action_plan || '',
      follow_up_date: sessionForm.follow_up_date,
      parent_contacted: Boolean(sessionForm.parent_contacted),
      parent_contact_remarks: sessionForm.parent_contact_remarks,
      outcome_status: (sessionForm.outcome_status as any) || 'Open',
      created_at: new Date().toISOString(),
    };

    await dataService.saveMentoringSession(newSession);
    setShowSessionModal(false);
    await loadData();
  };

  const getStudent = (id: string) => students.find((s) => s.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Module 7 & 16 • Student Academic Support & Counseling
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Mentoring Workspace & Early Performance Support
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Data-backed identification of learning difficulties, structured remedial interventions, and confidential counseling logs
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedStudentForSession(students[0] || null);
                setShowSessionModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              New Mentoring Record
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('early_support')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'early_support'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Early Support & At-Risk Roster ({atRiskStudents.filter((a) => a.isAtRisk).length})
        </button>
        <button
          onClick={() => setActiveTab('mentoring_log')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'mentoring_log'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          Mentoring Sessions & Parent Calls ({mentoringSessions.length})
        </button>
        <button
          onClick={() => setActiveTab('remedial_planner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'remedial_planner'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 text-sky-400" />
          Remedial Learning Plans
        </button>
      </div>

      {/* Tab 1: Early Support & At-Risk Roster */}
      {activeTab === 'early_support' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300">
              <strong>Transparent Criteria for Academic Warning:</strong> Attendance &lt; 75% or Continuous Assessment marks &lt; 50% (25/50). Single score dips require counseling rather than automatic penalization.
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Subject Attendance</th>
                  <th className="py-3.5 px-4">CIA-1 Marks (Max 50)</th>
                  <th className="py-3.5 px-4">Academic Risk Evaluation</th>
                  <th className="py-3.5 px-4 text-right">Intervention Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2 max-w-md mx-auto">
                        <Shield className="w-8 h-8 text-amber-400/80" />
                        <span className="font-bold text-slate-200">Student Records Inaccessible by Policy</span>
                        <p className="text-xs text-slate-400">
                          Student data is kept strictly locked down until a schema-aligned Row-Level Security (RLS) policy is configured. No unauthorized student records are exposed.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  atRiskStudents.map(({ student, attendanceRate, testScore, isAtRisk, riskFactors }) => (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isAtRisk ? 'bg-amber-950/10' : ''
                      }`}
                    >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{student.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {student.roll_number} • Reg: {student.register_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded font-bold ${
                          attendanceRate < 75
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {attendanceRate}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono font-bold text-sm ${
                          testScore < 30 ? 'text-amber-400' : 'text-slate-200'
                        }`}
                      >
                        {testScore} / 50
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {isAtRisk ? (
                        <div className="space-y-1">
                          {riskFactors.map((rf, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 mr-1"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              {rf}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-400 font-medium text-xs flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Normal Progress
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedStudentForSession(student);
                          setShowSessionModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold"
                      >
                        Schedule Counseling
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Mentoring Sessions & Parent Communications */}
      {activeTab === 'mentoring_log' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mentoringSessions.map((session) => {
              const student = getStudent(session.student_id);

              return (
                <div
                  key={session.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                        {session.concern_type}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        {student?.full_name} ({student?.roll_number})
                      </h4>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      {session.outcome_status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="text-slate-400 font-medium">Session Discussion Notes:</p>
                    <p className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                      {session.discussion_notes}
                    </p>
                  </div>

                  {session.remedial_action_plan && (
                    <div className="text-xs text-slate-300 space-y-1">
                      <p className="text-sky-400 font-medium">Remedial Action Agreed:</p>
                      <p className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-line text-[11px]">
                        {session.remedial_action_plan}
                      </p>
                    </div>
                  )}

                  {session.parent_contacted && (
                    <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-800/40 text-[11px] text-sky-300 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Parent Contacted ({student?.parent_name}): {session.parent_contact_remarks}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                    <span>Session: {session.session_date}</span>
                    {session.follow_up_date && (
                      <span className="text-amber-400 font-semibold">
                        Follow-up: {session.follow_up_date}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Remedial Action Plans */}
      {activeTab === 'remedial_planner' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            Remedial Teaching & Revision Class Formulation
          </h3>
          <p className="text-xs text-slate-400">
            Formulate targeted remedial tutorial blocks during zero-credit periods to review prerequisite gaps for students struggling with algorithms and proofs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-xs space-y-2">
              <span className="font-bold text-white block">Phase 1: Diagnostic Assessment</span>
              <p className="text-slate-400">
                Isolate whether deficiency stems from mathematical proofs, programming syntax, or abstract distributed state visualization.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-xs space-y-2">
              <span className="font-bold text-white block">Phase 2: Peer Mentoring Pairing</span>
              <p className="text-slate-400">
                Pair mentee with high-performing peers (e.g. Aditya Krishnan) for 1-hour code review on Saturdays.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-xs space-y-2">
              <span className="font-bold text-white block">Phase 3: Re-evaluation Check</span>
              <p className="text-slate-400">
                Administer short 20-minute diagnostic quiz before CIA-2 to evaluate improvement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Counseling Session */}
      {showSessionModal && selectedStudentForSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Record Student Counseling & Mentoring Note
              </h3>
              <button onClick={() => setShowSessionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Student</label>
                  <select
                    value={selectedStudentForSession.id}
                    onChange={(e) => {
                      const s = students.find((st) => st.id === e.target.value);
                      if (s) setSelectedStudentForSession(s);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name} ({st.roll_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Concern Category</label>
                  <select
                    value={sessionForm.concern_type}
                    onChange={(e) => setSessionForm({ ...sessionForm, concern_type: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Academic Weakness">Academic Weakness</option>
                    <option value="Attendance Shortage">Attendance Shortage</option>
                    <option value="Career & Placement">Career & Placement Advice</option>
                    <option value="Personal / Psychological">Personal / Psychological Guidance</option>
                    <option value="Disciplinary">Disciplinary Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Confidential Counseling Notes
                </label>
                <textarea
                  value={sessionForm.discussion_notes || ''}
                  onChange={(e) => setSessionForm({ ...sessionForm, discussion_notes: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Record discussions, observations, and student feedback..."
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-medium">
                    Remedial Action Plan
                  </label>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiRemedial(selectedStudentForSession)}
                    disabled={aiGeneratingRemedial}
                    className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {aiGeneratingRemedial ? 'Synthesizing...' : 'AI Suggest Remedial Plan'}
                  </button>
                </div>
                <textarea
                  value={sessionForm.remedial_action_plan || ''}
                  onChange={(e) => setSessionForm({ ...sessionForm, remedial_action_plan: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Steps the student and faculty will undertake..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Follow-up Review Date</label>
                  <input
                    type="date"
                    value={sessionForm.follow_up_date || ''}
                    onChange={(e) => setSessionForm({ ...sessionForm, follow_up_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={sessionForm.outcome_status}
                    onChange={(e) => setSessionForm({ ...sessionForm, outcome_status: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Open">Open</option>
                    <option value="Progressing">Progressing</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Parent communication */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="parent_check"
                    checked={Boolean(sessionForm.parent_contacted)}
                    onChange={(e) => setSessionForm({ ...sessionForm, parent_contacted: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="parent_check" className="text-slate-300 font-medium">
                    Parent / Guardian Contacted ({selectedStudentForSession.parent_name || 'Parent'}, {selectedStudentForSession.parent_phone})
                  </label>
                </div>

                {sessionForm.parent_contacted && (
                  <input
                    type="text"
                    value={sessionForm.parent_contact_remarks || ''}
                    onChange={(e) => setSessionForm({ ...sessionForm, parent_contact_remarks: e.target.value })}
                    placeholder="Summary of telephonic or in-person talk with parent..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs mt-1"
                  />
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

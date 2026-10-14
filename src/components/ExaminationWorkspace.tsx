import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Calendar,
  FileQuestion,
  Award,
  Sparkles,
  CheckCircle,
  Plus,
  Filter,
  Download,
  BookOpen,
  X,
  Search,
  CheckSquare,
} from 'lucide-react';
import {
  ExamDuty,
  QuestionBankItem,
  Assessment,
  AssessmentMark,
  Subject,
  FacultyProfile,
  Student,
} from '../types/database';
import { dataService } from '../services/dataService';

interface ExaminationWorkspaceProps {
  currentFaculty: FacultyProfile | null;
  onNavigateTab: (tabId: string) => void;
  onOpenAiAssistant: () => void;
}

export const ExaminationWorkspace: React.FC<ExaminationWorkspaceProps> = ({
  currentFaculty,
  onNavigateTab,
  onOpenAiAssistant,
}) => {
  const [examDuties, setExamDuties] = useState<ExamDuty[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentMarks, setAssessmentMarks] = useState<AssessmentMark[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<'duties' | 'question_bank' | 'marks_moderation'>('duties');

  // Question Bank Filter
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false);
  const [isAiGeneratingQuestions, setIsAiGeneratingQuestions] = useState<boolean>(false);

  // Form states
  const [questionForm, setQuestionForm] = useState<Partial<QuestionBankItem>>({
    unit_number: 1,
    topic: '',
    question: '',
    question_type: 'Short Answer',
    difficulty: 'Medium',
    marks: 5,
    bloom_level: 'Apply',
    course_outcome: 'CO1',
  });

  const loadData = async () => {
    if (!currentFaculty) return;
    const [duties, qb, asms, subs, stus] = await Promise.all([
      dataService.getExamDuties(currentFaculty.id),
      dataService.getQuestionBank(),
      dataService.getAssessments(currentFaculty.id),
      dataService.getSubjects(currentFaculty.department_id),
      dataService.getStudents(),
    ]);

    setExamDuties(duties);
    setQuestionBank(qb);
    setAssessments(asms);
    setSubjects(subs);
    setStudents(stus);

    if (asms.length > 0) {
      const marks = await dataService.getAssessmentMarks(asms[0].id);
      setAssessmentMarks(marks);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFaculty]);

  // Handle duty acknowledge
  const handleAcknowledgeDuty = async (dutyId: string) => {
    await dataService.updateExamDutyStatus(dutyId, 'Acknowledged');
    await loadData();
  };

  // AI Generate Questions
  const handleAiGenerateQuestions = async () => {
    if (!questionForm.topic) {
      alert('Please enter a topic title for AI question generation.');
      return;
    }

    setIsAiGeneratingQuestions(true);
    try {
      const res = await fetch('/api/ai/quiz-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjects[0]?.name || 'Computer Science',
          topic: questionForm.topic,
          count: 3,
          difficulty: questionForm.difficulty || 'Medium',
        }),
      });
      const data = await res.json();
      if (data.result?.questions?.length > 0) {
        const generated = data.result.questions[0];
        setQuestionForm((prev) => ({
          ...prev,
          question: generated.question,
          question_type: generated.type || 'Short Answer',
          marks: generated.marks || 5,
          bloom_level: generated.bloomTaxonomy || 'Apply',
        }));
      }
    } catch (err) {
      console.error('Failed to generate AI questions:', err);
    } finally {
      setIsAiGeneratingQuestions(false);
    }
  };

  // Save Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFaculty || !subjects[0]) return;

    const newItem: QuestionBankItem = {
      id: `qb-${Date.now()}`,
      subject_id: questionForm.subject_id || subjects[0].id,
      unit_number: Number(questionForm.unit_number) || 1,
      topic: questionForm.topic || 'General Concept',
      question: questionForm.question || '',
      question_type: (questionForm.question_type as any) || 'Short Answer',
      difficulty: (questionForm.difficulty as any) || 'Medium',
      marks: Number(questionForm.marks) || 5,
      bloom_level: (questionForm.bloom_level as any) || 'Apply',
      course_outcome: questionForm.course_outcome || 'CO1',
      faculty_id: currentFaculty.id,
      created_at: new Date().toISOString(),
    };

    await dataService.addQuestionBankItem(newItem);
    setShowAddQuestionModal(false);
    await loadData();
  };

  // Filtered Question Bank
  const filteredQuestions = questionBank.filter((q) => {
    if (selectedUnit !== 'all' && q.unit_number !== Number(selectedUnit)) return false;
    if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Workspace Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Module 9 • Examination, Invigilation & Evaluation
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Examination Cell & Question Bank Portal
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Hall invigilation schedules, Bloom's taxonomy question banks, and internal test marks moderation
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setQuestionForm({
                  subject_id: subjects[0]?.id || '',
                  unit_number: 1,
                  topic: '',
                  question: '',
                  question_type: 'Short Answer',
                  difficulty: 'Medium',
                  marks: 5,
                  bloom_level: 'Apply',
                  course_outcome: 'CO1',
                });
                setShowAddQuestionModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              Add Question to Bank
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('duties')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'duties'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Invigilation Duties ({examDuties.length})
        </button>
        <button
          onClick={() => setActiveTab('question_bank')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'question_bank'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          Question Bank Repository ({questionBank.length})
        </button>
        <button
          onClick={() => setActiveTab('marks_moderation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'marks_moderation'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Continuous Assessment Marks ({assessmentMarks.length})
        </button>
      </div>

      {/* Tab 1: Invigilation Duties */}
      {activeTab === 'duties' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examDuties.map((duty) => (
              <div
                key={duty.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                      OFFICIAL EXAM DUTY ORDER
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{duty.exam_name}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      duty.status === 'Acknowledged'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {duty.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Designated Role:</span>
                    <strong className="text-white">{duty.role}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Exam Date & Session:</span>
                    <span>{duty.exam_date} • {duty.session}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Exam Hall Allocation:</span>
                    <strong className="text-sky-300">{duty.hall_number}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Mandatory Reporting Time:</span>
                    <strong className="text-amber-400">{duty.reporting_time} AM</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  {duty.status !== 'Acknowledged' ? (
                    <button
                      onClick={() => handleAcknowledgeDuty(duty.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    >
                      Acknowledge & Confirm Duty
                    </button>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold text-xs">
                      <CheckCircle className="w-3.5 h-3.5" /> Order Acknowledged
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Question Bank */}
      {activeTab === 'question_bank' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center gap-3">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5"
              >
                <option value="all">All Syllabus Units</option>
                {[1, 2, 3, 4, 5].map((u) => (
                  <option key={u} value={u}>Unit {u}</option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5"
              >
                <option value="all">All Difficulty Levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-medium">
              Showing {filteredQuestions.length} categorized questions
            </span>
          </div>

          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                      Unit {q.unit_number}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                      {q.bloom_level}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 text-[10px] font-semibold">
                      {q.course_outcome}
                    </span>
                    <span className="font-semibold text-slate-400">
                      Topic: {q.topic}
                    </span>
                  </div>

                  <span className="font-mono text-emerald-400 font-bold">
                    {q.marks} Marks
                  </span>
                </div>

                <p className="text-slate-100 font-medium pt-1">
                  {q.question}
                </p>

                {q.options && (
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
                    {q.options.map((opt, i) => (
                      <div key={i} className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
                        {String.fromCharCode(65 + i)}. {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Marks Moderation */}
      {activeTab === 'marks_moderation' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Roll Number</th>
                  <th className="py-3.5 px-4">Assessment</th>
                  <th className="py-3.5 px-4">Score (Max 50)</th>
                  <th className="py-3.5 px-4">Remarks / Moderation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {assessmentMarks.map((mark) => {
                  const student = students.find((s) => s.id === mark.student_id);

                  return (
                    <tr key={mark.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {student?.full_name || 'Student'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {student?.roll_number}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        Continuous Internal Assessment 1
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-indigo-400">
                        {mark.marks_obtained}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {mark.remarks || 'Moderated & Verified'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Question to Bank */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-indigo-400" />
                Add Question to Bank
              </h3>
              <button onClick={() => setShowAddQuestionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Unit Number</label>
                  <select
                    value={questionForm.unit_number}
                    onChange={(e) => setQuestionForm({ ...questionForm, unit_number: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {[1, 2, 3, 4, 5].map((u) => (
                      <option key={u} value={u}>Unit {u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bloom's Taxonomy Level</label>
                  <select
                    value={questionForm.bloom_level}
                    onChange={(e) => setQuestionForm({ ...questionForm, bloom_level: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Remember">Remember</option>
                    <option value="Understand">Understand</option>
                    <option value="Apply">Apply</option>
                    <option value="Analyze">Analyze</option>
                    <option value="Evaluate">Evaluate</option>
                    <option value="Create">Create</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Topic</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={questionForm.topic || ''}
                    onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g. Byzantine Generals Problem"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleAiGenerateQuestions}
                    disabled={isAiGeneratingQuestions}
                    className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-lg font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isAiGeneratingQuestions ? 'Generating...' : 'AI Assist'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Question Text</label>
                <textarea
                  value={questionForm.question || ''}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Enter the complete question prompt..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Difficulty</label>
                  <select
                    value={questionForm.difficulty}
                    onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Allocated Marks</label>
                  <input
                    type="number"
                    value={questionForm.marks}
                    onChange={(e) => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Layers,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Copy,
  Edit3,
  FileText,
  BarChart2,
  CheckSquare,
  Award,
  Bookmark,
  X,
  Star,
} from 'lucide-react';
import {
  Subject,
  CourseUnit,
  LessonPlan,
  TeachingLog,
  FacultyProfile,
  CollegeClassGroup,
} from '../types/database';
import { dataService } from '../services/dataService';

interface CurriculumWorkspaceProps {
  currentFaculty: FacultyProfile | null;
  onNavigateTab: (tabId: string) => void;
  onOpenAiAssistant: () => void;
}

export const CurriculumWorkspace: React.FC<CurriculumWorkspaceProps> = ({
  currentFaculty,
  onNavigateTab,
  onOpenAiAssistant,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [teachingLogs, setTeachingLogs] = useState<TeachingLog[]>([]);
  const [classGroups, setClassGroups] = useState<CollegeClassGroup[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'syllabus' | 'lessons' | 'teaching_logs'>('syllabus');

  // Modals
  const [showLessonModal, setShowLessonModal] = useState<boolean>(false);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [isGeneratingAiPlan, setIsGeneratingAiPlan] = useState<boolean>(false);

  // Form states
  const [lessonForm, setLessonForm] = useState<Partial<LessonPlan>>({
    topic: '',
    unit_number: 1,
    teaching_methodology: 'Interactive Lecture & Discussion',
    teaching_type: 'Lecture',
    duration_minutes: 50,
    planned_date: new Date().toISOString().split('T')[0],
    learning_objectives: [''],
    expected_outcomes: [''],
    prerequisite_knowledge: [''],
    teaching_aids: ['LCD Projector', 'Whiteboard'],
    homework_or_follow_up: '',
  });

  const [logForm, setLogForm] = useState<Partial<TeachingLog>>({
    date: new Date().toISOString().split('T')[0],
    period_number: 1,
    topic_covered: '',
    methodology_used: 'Interactive Board Proof',
    hours_spent: 1,
    student_engagement_rating: 4,
    remarks: '',
  });

  const loadData = async () => {
    if (!currentFaculty) return;
    const [subData, grpData, lpData, logData] = await Promise.all([
      dataService.getSubjects(currentFaculty.department_id),
      dataService.getClassGroups(),
      dataService.getLessonPlans(currentFaculty.id),
      dataService.getTeachingLogs(currentFaculty.id),
    ]);

    setSubjects(subData);
    setClassGroups(grpData);
    setLessonPlans(lpData);
    setTeachingLogs(logData);

    const activeSub = selectedSubjectId || (subData[0]?.id || '');
    setSelectedSubjectId(activeSub);

    if (activeSub) {
      const uData = await dataService.getCourseUnits(activeSub);
      setUnits(uData);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFaculty]);

  const handleSubjectChange = async (subId: string) => {
    setSelectedSubjectId(subId);
    const uData = await dataService.getCourseUnits(subId);
    setUnits(uData);
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Toggle Topic completion
  const handleToggleTopic = async (unitId: string, topicId: string, currentVal: boolean) => {
    await dataService.toggleTopicCompletion(unitId, topicId, !currentVal);
    const uData = await dataService.getCourseUnits(selectedSubjectId);
    setUnits(uData);
  };

  // Syllabus Stats
  const totalTopics = units.reduce((acc, u) => acc + (u.topics?.length || 0), 0);
  const completedTopics = units.reduce(
    (acc, u) => acc + (u.topics?.filter((t) => t.completed).length || 0),
    0
  );
  const syllabusPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const isSyllabusDelayed = (currentSubject?.completed_hours || 0) < 20 && syllabusPercent < 40;

  // AI Assistant: Draft Lesson Plan from Topic
  const handleAiDraftLesson = async () => {
    if (!lessonForm.topic) {
      alert('Please enter a lesson topic first.');
      return;
    }
    setIsGeneratingAiPlan(true);
    try {
      const res = await fetch('/api/ai/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: currentSubject?.name || 'Computer Science',
          unit: `Unit ${lessonForm.unit_number}`,
          topic: lessonForm.topic,
          duration: `${lessonForm.duration_minutes || 50} minutes`,
          targetClass: 'Undergraduate Engineering',
        }),
      });
      const data = await res.json();
      if (data.lessonPlan) {
        const lp = data.lessonPlan;
        setLessonForm((prev) => ({
          ...prev,
          learning_objectives: lp.learningObjectives || prev.learning_objectives,
          expected_outcomes: lp.expectedOutcomes || prev.expected_outcomes,
          prerequisite_knowledge: lp.prerequisiteKnowledge || prev.prerequisite_knowledge,
          teaching_methodology: lp.teachingMethodology || prev.teaching_methodology,
          teaching_aids: lp.teachingAids || prev.teaching_aids,
          homework_or_follow_up: lp.homeworkOrFollowUp || prev.homework_or_follow_up,
          reflection_notes: lp.reflectionNotes || prev.reflection_notes,
          is_ai_assisted: true,
        }));
      }
    } catch (err) {
      console.error('Failed to generate AI lesson draft:', err);
    } finally {
      setIsGeneratingAiPlan(false);
    }
  };

  // Save Lesson Plan
  const handleSaveLessonPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFaculty || !currentSubject) return;

    const newPlan: LessonPlan = {
      id: lessonForm.id || `lp-${Date.now()}`,
      subject_id: currentSubject.id,
      class_group_id: lessonForm.class_group_id || classGroups[0]?.id || 'group-cse-6a',
      unit_number: Number(lessonForm.unit_number) || 1,
      topic: lessonForm.topic || 'Untitled Topic',
      learning_objectives: (lessonForm.learning_objectives || []).filter(Boolean),
      expected_outcomes: (lessonForm.expected_outcomes || []).filter(Boolean),
      prerequisite_knowledge: (lessonForm.prerequisite_knowledge || []).filter(Boolean),
      teaching_methodology: lessonForm.teaching_methodology || 'Lecture',
      teaching_type: lessonForm.teaching_type || 'Lecture',
      teaching_aids: lessonForm.teaching_aids || ['Projector'],
      duration_minutes: Number(lessonForm.duration_minutes) || 50,
      planned_date: lessonForm.planned_date || new Date().toISOString().split('T')[0],
      status: (lessonForm.status as any) || 'Planned',
      homework_or_follow_up: lessonForm.homework_or_follow_up,
      reflection_notes: lessonForm.reflection_notes,
      faculty_id: currentFaculty.id,
      is_ai_assisted: lessonForm.is_ai_assisted,
      created_at: new Date().toISOString(),
    };

    await dataService.saveLessonPlan(newPlan);
    setShowLessonModal(false);
    await loadData();
  };

  // Save Teaching Log
  const handleSaveTeachingLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFaculty || !currentSubject) return;

    const newLog: TeachingLog = {
      id: `log-${Date.now()}`,
      faculty_id: currentFaculty.id,
      subject_id: currentSubject.id,
      class_group_id: logForm.class_group_id || classGroups[0]?.id || 'group-cse-6a',
      date: logForm.date || new Date().toISOString().split('T')[0],
      period_number: Number(logForm.period_number) || 1,
      topic_covered: logForm.topic_covered || 'Taught lecture',
      methodology_used: logForm.methodology_used || 'Lecture',
      hours_spent: Number(logForm.hours_spent) || 1,
      student_engagement_rating: (logForm.student_engagement_rating as any) || 4,
      remarks: logForm.remarks || '',
      created_at: new Date().toISOString(),
    };

    await dataService.addTeachingLog(newLog);
    setShowLogModal(false);
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Subject Header & Selector */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Module 3 & 4 • Curriculum & Teaching Logs
            </span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-xl font-extrabold text-white">
                {currentSubject?.code} - {currentSubject?.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentSubject?.type} • {currentSubject?.credits} Credits
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Contact Hours: {currentSubject?.contact_hours_per_week} hrs/week • Total Planned: {currentSubject?.total_planned_hours} hrs
            </p>
          </div>

          {/* Switch Course */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}: {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setLessonForm({
                  topic: '',
                  unit_number: 1,
                  teaching_methodology: 'Interactive Lecture & Discussion',
                  teaching_type: 'Lecture',
                  duration_minutes: 50,
                  planned_date: new Date().toISOString().split('T')[0],
                  learning_objectives: [''],
                  expected_outcomes: [''],
                  prerequisite_knowledge: [''],
                  teaching_aids: ['LCD Projector', 'Whiteboard'],
                  homework_or_follow_up: '',
                });
                setShowLessonModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              New Lesson Plan
            </button>

            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              Log Daily Class
            </button>
          </div>
        </div>

        {/* Progress & Accreditation Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Syllabus Completion</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${syllabusPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-white">{syllabusPercent}%</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Topics Covered</span>
            <span className="text-sm font-bold text-white mt-1 block">
              {completedTopics} / {totalTopics} Topics
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Teaching Hours</span>
            <span className="text-sm font-bold text-sky-400 mt-1 block">
              {currentSubject?.completed_hours} hrs logged ({currentSubject?.total_planned_hours} planned)
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Syllabus Pacing</span>
            <span className={`text-xs font-bold mt-1 inline-flex items-center gap-1 ${
              isSyllabusDelayed ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {isSyllabusDelayed ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" /> Lagging Schedule
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> On Track
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('syllabus')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeSubTab === 'syllabus'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Unit-wise Syllabus Tracker ({units.length} Units)
        </button>
        <button
          onClick={() => setActiveSubTab('lessons')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeSubTab === 'lessons'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Lesson Plans ({lessonPlans.filter((l) => l.subject_id === selectedSubjectId).length})
        </button>
        <button
          onClick={() => setActiveSubTab('teaching_logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeSubTab === 'teaching_logs'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Daily Teaching Logs ({teachingLogs.filter((t) => t.subject_id === selectedSubjectId).length})
        </button>
      </div>

      {/* Tab 1: Syllabus Units Tracker */}
      {activeSubTab === 'syllabus' && (
        <div className="space-y-4">
          {units.map((unit) => {
            const unitCompleted = unit.topics?.filter((t) => t.completed).length || 0;
            const unitTotal = unit.topics?.length || 1;
            const pct = Math.round((unitCompleted / unitTotal) * 100);

            return (
              <div
                key={unit.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-300 font-extrabold text-sm">
                      U{unit.unit_number}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Unit {unit.unit_number}: {unit.title}
                      </h3>
                      <p className="text-xs text-slate-400">{unit.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-400">
                      Hours: <strong className="text-white">{unit.completed_hours}</strong> / {unit.planned_hours} hrs
                    </span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                      pct === 100 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                    }`}>
                      {pct}% Completed
                    </span>
                  </div>
                </div>

                {/* Topics Checkable List with Audit trail */}
                <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/80 divide-y divide-slate-800/50">
                  {unit.topics?.map((topic) => (
                    <div
                      key={topic.id}
                      className="py-2.5 flex items-center justify-between text-xs gap-3 hover:bg-slate-900/40 px-2 rounded-lg transition-colors"
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={topic.completed}
                          onChange={() => handleToggleTopic(unit.id, topic.id, topic.completed)}
                          className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className={topic.completed ? 'text-slate-400 line-through' : 'text-slate-200 font-medium'}>
                          {topic.title}
                        </span>
                      </label>

                      {topic.completed && topic.completed_date && (
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          Taught on {topic.completed_date}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Course Outcome Mapping */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Mapped Course Outcomes:</span>
                  {unit.course_outcomes_mapped?.map((co) => (
                    <span
                      key={co}
                      className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 font-semibold"
                    >
                      {co}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Lesson Plans */}
      {activeSubTab === 'lessons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Scheduled Lesson Plans & Pedagogical Outlines
            </h3>
            <button
              onClick={() => {
                setLessonForm({
                  topic: '',
                  unit_number: 1,
                  teaching_methodology: 'Interactive Lecture & Discussion',
                  teaching_type: 'Lecture',
                  duration_minutes: 50,
                  planned_date: new Date().toISOString().split('T')[0],
                  learning_objectives: [''],
                  expected_outcomes: [''],
                  prerequisite_knowledge: [''],
                  teaching_aids: ['LCD Projector', 'Whiteboard'],
                  homework_or_follow_up: '',
                });
                setShowLessonModal(true);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Create New Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessonPlans
              .filter((l) => l.subject_id === selectedSubjectId)
              .map((plan) => (
                <div
                  key={plan.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                        Unit {plan.unit_number} • {plan.teaching_type}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        {plan.topic}
                      </h4>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      plan.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-indigo-500/20 text-indigo-300'
                    }`}>
                      {plan.status}
                    </span>
                  </div>

                  {plan.learning_objectives?.length > 0 && (
                    <div className="text-xs text-slate-300">
                      <strong className="text-slate-400 text-[11px] block mb-1">Learning Objectives:</strong>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                        {plan.learning_objectives.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <span>Duration: <strong>{plan.duration_minutes}m</strong></span>
                    <span>•</span>
                    <span>Date: <strong>{plan.planned_date}</strong></span>
                    {plan.is_ai_assisted && (
                      <span className="ml-auto text-sky-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Assisted
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 3: Daily Teaching Logs */}
      {activeSubTab === 'teaching_logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Official Daily Teaching Log & Classroom Reflections
            </h3>
            <button
              onClick={() => setShowLogModal(true)}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Record Today's Teaching
            </button>
          </div>

          <div className="space-y-3">
            {teachingLogs
              .filter((l) => l.subject_id === selectedSubjectId)
              .map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-400 font-bold">{log.date}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300 font-semibold">Period {log.period_number}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-sky-300">{log.hours_spent} hr(s)</span>
                    </div>
                    <p className="text-white font-medium">{log.topic_covered}</p>
                    <p className="text-slate-400 text-[11px]">Methodology: {log.methodology_used}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < log.student_engagement_rating ? 'fill-amber-400' : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal: New Lesson Plan (with AI Draft) */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Draft Academic Lesson Plan
              </h3>
              <button onClick={() => setShowLessonModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLessonPlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Unit Number</label>
                  <select
                    value={lessonForm.unit_number}
                    onChange={(e) => setLessonForm({ ...lessonForm, unit_number: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {[1, 2, 3, 4, 5].map((u) => (
                      <option key={u} value={u}>Unit {u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Teaching Type</label>
                  <select
                    value={lessonForm.teaching_type}
                    onChange={(e) => setLessonForm({ ...lessonForm, teaching_type: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Demonstration">Demonstration</option>
                    <option value="Discussion">Discussion</option>
                    <option value="Practical">Practical / Lab</option>
                    <option value="Activity">Active Problem-Solving</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Topic / Concept Title
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lessonForm.topic || ''}
                    onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g. Byzantine Generals Problem and Consensus Impossibility"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleAiDraftLesson}
                    disabled={isGeneratingAiPlan}
                    className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    {isGeneratingAiPlan ? 'Generating...' : 'AI Assist Draft'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Learning Objectives (Bloom's Taxonomy)
                </label>
                <textarea
                  value={lessonForm.learning_objectives?.join('\n') || ''}
                  onChange={(e) => setLessonForm({ ...lessonForm, learning_objectives: e.target.value.split('\n') })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="One objective per line..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Expected Learning Outcomes
                </label>
                <textarea
                  value={lessonForm.expected_outcomes?.join('\n') || ''}
                  onChange={(e) => setLessonForm({ ...lessonForm, expected_outcomes: e.target.value.split('\n') })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Measurable student outcomes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Planned Teaching Date</label>
                  <input
                    type="date"
                    value={lessonForm.planned_date}
                    onChange={(e) => setLessonForm({ ...lessonForm, planned_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Homework or Follow-up Activity
                </label>
                <input
                  type="text"
                  value={lessonForm.homework_or_follow_up || ''}
                  onChange={(e) => setLessonForm({ ...lessonForm, homework_or_follow_up: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Optional follow-up exercise"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLessonModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Save Lesson Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Teaching Log */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                Record Daily Teaching Log
              </h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeachingLog} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={logForm.date}
                    onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Period Number</label>
                  <select
                    value={logForm.period_number}
                    onChange={(e) => setLogForm({ ...logForm, period_number: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Topic Covered</label>
                <input
                  type="text"
                  value={logForm.topic_covered || ''}
                  onChange={(e) => setLogForm({ ...logForm, topic_covered: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g. Raft consensus leader election and heartbeats"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Student Engagement Rating (1-5)</label>
                <select
                  value={logForm.student_engagement_rating}
                  onChange={(e) => setLogForm({ ...logForm, student_engagement_rating: Number(e.target.value) as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value={5}>5 Stars - High Interactive Participation</option>
                  <option value={4}>4 Stars - Attentive & Responsive</option>
                  <option value={3}>3 Stars - Average Focus</option>
                  <option value={2}>2 Stars - Distracted, Concept Re-explanation needed</option>
                  <option value={1}>1 Star - Poor Engagement</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Remarks & Reflections</label>
                <textarea
                  value={logForm.remarks || ''}
                  onChange={(e) => setLogForm({ ...logForm, remarks: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Observations, queries raised by students..."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

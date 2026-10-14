import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  DollarSign,
  ExternalLink,
  Layers,
  Sparkles,
  Users,
  CheckCircle,
  FileText,
  Plus,
  Compass,
} from 'lucide-react';
import {
  ResearchProject,
  Publication,
  FacultyDevelopmentRecord,
  StudentProject,
  FacultyProfile,
} from '../types/database';
import { dataService } from '../services/dataService';

interface ResearchProjectsWorkspaceProps {
  currentFaculty: FacultyProfile | null;
  onNavigateTab: (tabId: string) => void;
  onOpenAiAssistant: () => void;
}

export const ResearchProjectsWorkspace: React.FC<ResearchProjectsWorkspaceProps> = ({
  currentFaculty,
  onNavigateTab,
  onOpenAiAssistant,
}) => {
  const [researchProjects, setResearchProjects] = useState<ResearchProject[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [fdpRecords, setFdpRecords] = useState<FacultyDevelopmentRecord[]>([]);
  const [studentProjects, setStudentProjects] = useState<StudentProject[]>([]);
  const [activeTab, setActiveTab] = useState<'grants' | 'publications' | 'student_projects' | 'appraisal'>('grants');

  const loadData = async () => {
    if (!currentFaculty) return;
    const [res, pubs, fdp, projs] = await Promise.all([
      dataService.getResearchProjects(currentFaculty.id),
      dataService.getPublications(currentFaculty.id),
      dataService.getFacultyDevelopment(currentFaculty.id),
      dataService.getStudentProjects(currentFaculty.id),
    ]);

    setResearchProjects(res);
    setPublications(pubs);
    setFdpRecords(fdp);
    setStudentProjects(projs);
  };

  useEffect(() => {
    loadData();
  }, [currentFaculty]);

  const totalGrantsAmount = researchProjects.reduce((acc, r) => acc + (r.grant_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Workspace Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Module 13, 14 & 15 • Research, Capstone Projects & Appraisal
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Scholarly Research, Patents & Project Supervision
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              External funding grants, Scopus/SCI journal papers, student capstone reviews, and annual PBAS appraisal dossier
            </p>
          </div>

          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs text-right">
            <span className="text-slate-400 block text-[10px]">Total Extramural Grants</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              ₹{(totalGrantsAmount / 100000).toFixed(2)} Lakhs
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('grants')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'grants'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Funded Research Grants ({researchProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('publications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'publications'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 text-sky-400" />
          Publications & Patents ({publications.length})
        </button>
        <button
          onClick={() => setActiveTab('student_projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'student_projects'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-purple-400" />
          Student Capstone Projects ({studentProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('appraisal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'appraisal'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          Annual Faculty Appraisal Dossier
        </button>
      </div>

      {/* Tab 1: Funded Research Grants */}
      {activeTab === 'grants' && (
        <div className="space-y-4">
          {researchProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {proj.funding_agency}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{proj.title}</h3>
                </div>
                <div className="text-right">
                  <span className="font-mono text-emerald-400 font-bold text-sm block">
                    ₹{proj.grant_amount.toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                    {proj.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                {proj.abstract}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                <div>
                  <strong>Co-Investigators:</strong> {proj.co_investigators.join(', ')}
                </div>
                <div>
                  <strong>Duration:</strong> {proj.start_date} to {proj.end_date}
                </div>
              </div>

              {proj.deliverables?.length > 0 && (
                <div className="pt-2 border-t border-slate-800 text-xs">
                  <span className="font-semibold text-slate-400 block mb-1">
                    Key Deliverables:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {proj.deliverables.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Publications & Patents */}
      {activeTab === 'publications' && (
        <div className="space-y-4">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    {pub.publication_type} • Indexed in {pub.indexing}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{pub.title}</h4>
                </div>
                {pub.impact_factor && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                    IF: {pub.impact_factor}
                  </span>
                )}
              </div>

              <p className="text-slate-300">
                <strong>Journal:</strong> {pub.journal_or_conference_name} ({pub.publication_year}) • {pub.volume_issue_pages}
              </p>

              <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800 text-[11px]">
                <span>Authors: {pub.authors.join(', ')}</span>
                {pub.doi_or_url && (
                  <a
                    href={pub.doi_or_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    View DOI <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Student Projects */}
      {activeTab === 'student_projects' && (
        <div className="space-y-4">
          {studentProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    {proj.project_type} • {proj.domain}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{proj.title}</h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  {proj.status}
                </span>
              </div>

              <div className="text-xs text-slate-300">
                <span className="text-slate-400 font-medium">Batch Students: </span>
                {proj.batch_students.map((st) => `${st.name} (${st.roll_number})`).join(', ')}
              </div>

              {/* Milestones */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <span className="font-semibold text-slate-400 block">Review Milestones:</span>
                {proj.milestones.map((m, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-white font-medium">{m.title}</span>
                      {m.guide_remarks && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{m.guide_remarks}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Due: {m.due_date}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          m.completed ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {m.completed ? `Completed (${m.marks_awarded} pts)` : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Faculty Appraisal Dossier */}
      {activeTab === 'appraisal' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Academic Performance Indicator (API) Self-Appraisal Scorecard
              </h3>
              <p className="text-xs text-slate-400">
                Category 1 (Teaching): 40 pts • Category 2 (Research & Grants): 35 pts • Category 3 (Mentoring & FDP): 25 pts
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs">
              Total Score: 92 / 100 (Exceeds Expectations)
            </span>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {fdpRecords.map((fdp) => (
              <div
                key={fdp.id}
                className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-white">{fdp.title}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Organizer: {fdp.organizer} • {fdp.duration_days} Days ({fdp.start_date} to {fdp.end_date})
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                  {fdp.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

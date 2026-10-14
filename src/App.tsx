import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Monitor,
  Users,
  CheckSquare,
  FileText,
  ShieldAlert,
  Briefcase,
  Bell,
  Award,
  BarChart2,
  Sparkles,
  Settings,
  GraduationCap,
  ChevronDown,
  AlertTriangle,
  FileCode,
  LogIn,
  RotateCcw,
} from 'lucide-react';

import { FacultyProfile } from './types/database';
import { dataService, DataMode } from './services/dataService';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TimetableWorkspace } from './components/TimetableWorkspace';
import { CurriculumWorkspace } from './components/CurriculumWorkspace';
import { ClassroomLabWorkspace } from './components/ClassroomLabWorkspace';
import { AttendanceWorkspace } from './components/AttendanceWorkspace';
import { StudentMentoringWorkspace } from './components/StudentMentoringWorkspace';
import { AssignmentWorkspace } from './components/AssignmentWorkspace';
import { ExaminationWorkspace } from './components/ExaminationWorkspace';
import { WorkloadTasksWorkspace } from './components/WorkloadTasksWorkspace';
import { DepartmentCommunicationWorkspace } from './components/DepartmentCommunicationWorkspace';
import { ResearchProjectsWorkspace } from './components/ResearchProjectsWorkspace';
import { AccreditationReportsWorkspace } from './components/AccreditationReportsWorkspace';
import { AiAssistantModal } from './components/AiAssistantModal';
import { SettingsDatabaseModal } from './components/SettingsDatabaseModal';
import { AuthSignInScreen } from './components/AuthSignInScreen';
import { SubjectManagementView } from './components/SubjectManagementView';
import { ClassGroupManagementView } from './components/ClassGroupManagementView';

export default function App() {
  const [sessionState, setSessionState] = useState<'checking' | 'unauthenticated' | 'authenticated' | 'demo'>('checking');
  const [dataMode, setDataMode] = useState<DataMode>(dataService.getDataMode());
  const [facultyProfiles, setFacultyProfiles] = useState<FacultyProfile[]>([]);
  const [currentFaculty, setCurrentFaculty] = useState<FacultyProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('workspace');
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [dbErrors, setDbErrors] = useState<Record<string, string>>({});

  const checkAuthAndLoad = async () => {
    setSessionState('checking');
    try {
      const user = await dataService.getSupabaseUser();
      const currentMode = dataService.getDataMode();
      setDataMode(currentMode);

      if (user) {
        setSessionState('authenticated');
        dataService.setDataMode('live_supabase');
        setDataMode('live_supabase');
        await loadFaculty();
      } else if (currentMode === 'demo_local') {
        setSessionState('demo');
        await loadFaculty();
      } else {
        setSessionState('unauthenticated');
      }
    } catch (e) {
      console.error('Session check error:', e);
      setSessionState('unauthenticated');
    }
  };

  const loadFaculty = async () => {
    const profiles = await dataService.getFacultyProfiles();
    setFacultyProfiles(profiles);
    const active = await dataService.getCurrentFacultyProfile();
    setCurrentFaculty(active);
    setDbErrors(dataService.getDatabaseErrors());
  };

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const handleFacultyChange = (id: string) => {
    dataService.setCurrentFacultyId(id);
    const selected = facultyProfiles.find((f) => f.id === id);
    if (selected) {
      setCurrentFaculty(selected);
    }
  };

  const handleSignOut = async () => {
    await dataService.signOutSupabase();
    dataService.setDataMode('live_supabase');
    setDataMode('live_supabase');
    setSessionState('unauthenticated');
  };

  const handleSwitchToLiveSignIn = () => {
    dataService.setDataMode('live_supabase');
    setDataMode('live_supabase');
    setSessionState('unauthenticated');
  };

  if (sessionState === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse text-white font-bold text-xl">
          <GraduationCap className="w-7 h-7" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-white">FacultyOS</h2>
          <p className="text-xs text-slate-500">Checking Supabase Auth Session & Permissions...</p>
        </div>
      </div>
    );
  }

  if (sessionState === 'unauthenticated') {
    return (
      <>
        <AuthSignInScreen
          onAuthenticated={async () => {
            setSessionState('authenticated');
            dataService.setDataMode('live_supabase');
            setDataMode('live_supabase');
            await loadFaculty();
          }}
          onContinueDemo={async () => {
            setSessionState('demo');
            dataService.setDataMode('demo_local');
            setDataMode('demo_local');
            await loadFaculty();
          }}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />
        <SettingsDatabaseModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentFaculty={currentFaculty}
          onProfileUpdated={loadFaculty}
        />
      </>
    );
  }

  const navGroups = [
    {
      label: 'Core Workspace',
      items: [
        { id: 'workspace', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'timetable', label: 'Smart Timetable', icon: Calendar },
      ],
    },
    {
      label: 'Teaching & Curriculum',
      items: [
        { id: 'subjects', label: 'Subject Management', icon: BookOpen },
        { id: 'class_groups', label: 'Class Group Management', icon: Users },
        { id: 'curriculum', label: 'Syllabus & Lesson Plans', icon: BookOpen },
        { id: 'classrooms', label: 'Classrooms & Labs', icon: Monitor },
      ],
    },
    {
      label: 'Students & Mentoring',
      items: [
        { id: 'attendance', label: 'Attendance Register', icon: Users },
        { id: 'mentoring', label: 'Student Mentoring', icon: GraduationCap },
      ],
    },
    {
      label: 'Assessment & Exams',
      items: [
        { id: 'assignments', label: 'Assignments & Grading', icon: FileText },
        { id: 'examinations', label: 'Exams & Question Bank', icon: ShieldAlert },
      ],
    },
    {
      label: 'Productivity & Research',
      items: [
        { id: 'workload', label: 'Workload & Tasks', icon: Briefcase },
        { id: 'department', label: 'Notices & Meetings', icon: Bell },
        { id: 'research', label: 'Research & Projects', icon: Award },
        { id: 'reports', label: 'Accreditation Reports', icon: BarChart2 },
      ],
    },
  ];

  const coreDbErrors = Object.entries(dbErrors).filter(([table]) => table !== 'students');
  const hasDbErrors = coreDbErrors.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Mode / Permission Alert Banner */}
      {dataMode === 'demo_local' ? (
        <div className="bg-amber-950/70 border-b border-amber-800/80 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-200">
            <span className="font-bold bg-amber-500/20 px-2 py-0.5 rounded text-[10px] text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Local Demo Mode
            </span>
            <span>Operating in local demo mode with simulated institutional records.</span>
          </div>
          <button
            onClick={handleSwitchToLiveSignIn}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In to Live Supabase</span>
          </button>
        </div>
      ) : hasDbErrors ? (
        <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-bold text-rose-300">Live Supabase Permission Alert:</span>
            <span className="text-[11px] font-mono">
              Table permission issue on {coreDbErrors.map(([t]) => t).join(', ')}.
            </span>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Open Database Hub</span>
          </button>
        </div>
      ) : null}

      {/* Top Header */}
      <Header
        currentFaculty={currentFaculty}
        facultyProfiles={facultyProfiles}
        onFacultyChange={handleFacultyChange}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        dataMode={dataMode}
        onSignOut={handleSignOut}
        onShowSignIn={handleSwitchToLiveSignIn}
      />

      {/* Main Categorized Horizontal Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 overflow-x-auto py-2 no-scrollbar">
            {navGroups.flatMap((g) => g.items).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Primary Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'workspace' && (
          <DashboardView
            currentFaculty={currentFaculty}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableWorkspace
            currentFaculty={currentFaculty}
            facultyProfiles={facultyProfiles}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectManagementView
            currentFaculty={currentFaculty}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'class_groups' && (
          <ClassGroupManagementView
            currentFaculty={currentFaculty}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'curriculum' && (
          <CurriculumWorkspace
            currentFaculty={currentFaculty}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'classrooms' && (
          <ClassroomLabWorkspace
            currentFaculty={currentFaculty}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceWorkspace
            currentFaculty={currentFaculty}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'mentoring' && (
          <StudentMentoringWorkspace
            currentFaculty={currentFaculty}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentWorkspace
            currentFaculty={currentFaculty}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'examinations' && (
          <ExaminationWorkspace
            currentFaculty={currentFaculty}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'workload' && (
          <WorkloadTasksWorkspace
            currentFaculty={currentFaculty}
            facultyProfiles={facultyProfiles}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'department' && (
          <DepartmentCommunicationWorkspace
            currentFaculty={currentFaculty}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'research' && (
          <ResearchProjectsWorkspace
            currentFaculty={currentFaculty}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'reports' && (
          <AccreditationReportsWorkspace
            currentFaculty={currentFaculty}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* AI Assistant Modal (Module 19) */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentFaculty={currentFaculty}
      />

      {/* Settings & Database Hub Modal (Module 18 & 20) */}
      <SettingsDatabaseModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentFaculty={currentFaculty}
        onProfileUpdated={loadFaculty}
      />

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">FacultyOS</span>
            <span>•</span>
            <span>Comprehensive Higher Education Faculty Management System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Mode: {dataMode === 'live_supabase' ? 'Live Supabase' : 'Local Demo'}</span>
            <span>•</span>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Database & RLS Hub
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

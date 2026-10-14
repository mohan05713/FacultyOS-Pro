import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  User,
  Shield,
  Key,
  CheckCircle,
  Copy,
  RotateCcw,
  X,
  FileCode,
  Download,
  AlertTriangle,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { FacultyProfile, AuditLog } from '../types/database';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  verifySupabaseConnection,
  SupabaseVerificationResult,
  DEFAULT_SUPABASE_URL,
} from '../lib/supabaseClient';
import { dataService } from '../services/dataService';

interface SettingsDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFaculty: FacultyProfile | null;
  onProfileUpdated: () => void;
}

export const SettingsDatabaseModal: React.FC<SettingsDatabaseModalProps> = ({
  isOpen,
  onClose,
  currentFaculty,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'supabase' | 'auth' | 'migrations' | 'audit'>('supabase');
  const [url, setUrl] = useState(DEFAULT_SUPABASE_URL);
  const [anonKey, setAnonKey] = useState('');
  const [profileForm, setProfileForm] = useState<Partial<FacultyProfile>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Live verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<SupabaseVerificationResult | null>(null);

  // Supabase Auth Form
  const [authEmail, setAuthEmail] = useState('mohanpalaniappan007@gmail.com');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [currentAuthUser, setCurrentAuthUser] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cfg = getStoredSupabaseConfig();
      setUrl(cfg.url || DEFAULT_SUPABASE_URL);
      setAnonKey(cfg.anonKey || '');
      if (currentFaculty) {
        setProfileForm({ ...currentFaculty });
      }
      dataService.getAuditLogs().then(setAuditLogs);
      runVerification();
      dataService.getSupabaseUser().then(setCurrentAuthUser);
    }
  }, [isOpen, currentFaculty]);

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await verifySupabaseConnection();
      setVerificationResult(res);
    } catch (e: any) {
      console.error('Verification error:', e);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSupabaseConfig(url, anonKey);
    setStatusMsg({
      text: 'Configuration saved! Re-testing live Supabase connection...',
      type: 'success',
    });
    await runVerification();
    const updatedUser = await dataService.getSupabaseUser();
    setCurrentAuthUser(updatedUser);
  };

  const handleSupabaseSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setStatusMsg(null);
    try {
      const res = await dataService.signInWithSupabase(authEmail, authPassword);
      if (res.error) {
        setStatusMsg({ text: `Login failed: ${res.error}`, type: 'error' });
      } else {
        setStatusMsg({
          text: `Successfully logged in via Supabase Auth as ${res.user.email}!`,
          type: 'success',
        });
        setCurrentAuthUser(res.user);
        onProfileUpdated();
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Login error', type: 'error' });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSupabaseSignOut = async () => {
    await dataService.signOutSupabase();
    setCurrentAuthUser(null);
    setStatusMsg({ text: 'Signed out from Supabase Auth.', type: 'success' });
    onProfileUpdated();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFaculty || !profileForm.full_name) return;

    const updated: FacultyProfile = {
      ...currentFaculty,
      full_name: profileForm.full_name || currentFaculty.full_name,
      phone: profileForm.phone || currentFaculty.phone,
      qualification: profileForm.qualification || currentFaculty.qualification,
      specialization: profileForm.specialization || currentFaculty.specialization,
      office_room: profileForm.office_room || currentFaculty.office_room,
      office_hours: profileForm.office_hours || currentFaculty.office_hours,
      bio: profileForm.bio || currentFaculty.bio,
    };

    await dataService.updateFacultyProfile(updated);
    setStatusMsg({ text: 'Faculty profile details saved successfully.', type: 'success' });
    onProfileUpdated();
  };

  const handleResetData = () => {
    if (window.confirm('Reset all academic data to the clean institutional demo records?')) {
      dataService.resetToDemoData();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              FacultyOS • Supabase Connection, Auth & Database Hub
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'supabase'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Supabase Connection & Tables
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'auth'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Supabase Auth & Login
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Faculty Profile
          </button>
          <button
            onClick={() => setActiveTab('migrations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'migrations'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            SQL Migrations & RLS Policies
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Audit Logs ({auditLogs.length})
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Supabase Connection & Live Verification */}
        {activeTab === 'supabase' && (
          <div className="space-y-4 text-xs">
            <form onSubmit={handleSaveSupabaseConfig} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://rqxaagvluakuoykuyswa.supabase.co"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                  <span>Supabase Anon / Public API Key</span>
                  <a
                    href="https://supabase.com/dashboard/project/rqxaagvluakuoykuyswa/settings/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                  >
                    Open Supabase API Settings <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={runVerification}
                  disabled={isVerifying}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  Test Live Connection
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  Save Configuration
                </button>
              </div>
            </form>

            {/* Live Diagnostics Card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  Live Verification Status
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                    verificationResult?.isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {verificationResult?.isConnected ? 'Connected & Verified' : 'Local Fallback Mode'}
                </span>
              </div>

              <div className="space-y-1.5 text-slate-300 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Project:</span>
                  <span className="font-mono text-white">{url}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Public Anon Key:</span>
                  <span className={verificationResult?.hasAnonKey ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                    {verificationResult?.hasAnonKey ? 'Configured' : 'Missing (Required for queries)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Supabase Auth Session:</span>
                  <span className={verificationResult?.authUser ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                    {verificationResult?.authUser ? `Signed In (${verificationResult.authUser.email})` : 'No active Supabase Auth session'}
                  </span>
                </div>
              </div>

              {/* Table by Table status */}
              {verificationResult?.queriedTables && verificationResult.queriedTables.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">
                    Table Accessibility Matrix:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {verificationResult.queriedTables.map((t) => (
                      <div
                        key={t.name}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                      >
                        <span className="font-mono text-slate-300">{t.name}</span>
                        {t.accessible ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {t.rowCount} rows
                          </span>
                        ) : (
                          <span className="text-rose-400 text-[10px] font-medium truncate max-w-[120px]" title={t.error}>
                            Error: {t.error}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action guidance if disconnected */}
              {!verificationResult?.isConnected && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 text-[11px] text-amber-200 space-y-1">
                  <strong className="block text-amber-300">Next Required Step:</strong>
                  <p>
                    1. Copy the <code>anon public</code> key from your Supabase project (<strong>Settings &gt; API &gt; Project API keys</strong>) and paste it into the field above, then click <strong>Save Configuration</strong>.
                  </p>
                  <p>
                    2. If tables are not yet created in your Supabase project, execute the migration SQL from the <strong>SQL Migrations</strong> tab in your Supabase SQL Editor.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={handleResetData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo Records
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Supabase Auth & Login */}
        {activeTab === 'auth' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <LogIn className="w-4 h-4 text-indigo-400" />
                Supabase Authentication & Profile Linking
              </h4>
              <p className="text-slate-300 text-[11px]">
                Sign in with an authenticated user from your Supabase project (<code>auth.users</code>). Once signed in, FacultyOS queries <code>faculty_profiles</code> where <code>user_id = auth.uid()</code> to retrieve the exact faculty record.
              </p>
            </div>

            {currentAuthUser ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">
                      Active Supabase Auth Session
                    </span>
                    <h5 className="font-bold text-white text-sm">{currentAuthUser.email}</h5>
                    <p className="text-slate-400 font-mono text-[11px]">
                      auth.uid(): {currentAuthUser.id}
                    </p>
                  </div>
                  <button
                    onClick={handleSupabaseSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSupabaseSignIn} className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Faculty Email</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    placeholder="faculty@university.edu"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isAuthLoading ? 'Authenticating...' : 'Sign In with Supabase Auth'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: Profile Settings */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Faculty ID (Read-only)</label>
                <input
                  type="text"
                  value={profileForm.faculty_id || ''}
                  disabled
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Phone / Contact</label>
                <input
                  type="text"
                  value={profileForm.phone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Office Room</label>
                <input
                  type="text"
                  value={profileForm.office_room || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, office_room: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Office Consultation Hours</label>
              <input
                type="text"
                value={profileForm.office_hours || ''}
                onChange={(e) => setProfileForm({ ...profileForm, office_hours: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Specialization & Research Focus</label>
              <input
                type="text"
                value={profileForm.specialization || ''}
                onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Biography</label>
              <textarea
                value={profileForm.bio || ''}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="pt-3 flex items-center justify-end border-t border-slate-800">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: SQL Migrations */}
        {activeTab === 'migrations' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-400" />
                Targeted Additive Migration: 003_fix_permissions_and_rls.sql
              </span>
              <p className="text-slate-300 text-[11px]">
                This is a non-destructive, additive script that grants table-level SELECT privileges to the <code>authenticated</code> role and configures the restricted student RLS policy. <strong>Do NOT run the full initial schema migration on an existing database.</strong>
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto whitespace-pre">
{`-- Run in Supabase SQL Editor:
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Core Academic Reference Tables
GRANT SELECT ON departments TO authenticated;
GRANT SELECT ON academic_classes TO authenticated;
GRANT SELECT ON class_sections TO authenticated;
GRANT SELECT ON college_class_groups TO authenticated;
GRANT SELECT ON subjects TO authenticated;

-- Timetable & Faculty Profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON timetable_entries TO authenticated;
GRANT SELECT, UPDATE ON faculty_profiles TO authenticated;

-- Students (SELECT for authenticated, filtered by RLS)
GRANT SELECT ON students TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Revoke sensitive tables from anon role (least privilege)
REVOKE ALL ON faculty_profiles FROM anon;
REVOKE ALL ON students FROM anon;
REVOKE ALL ON timetable_entries FROM anon;

-- Restricted student RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted student view for authorized faculty" ON students;
CREATE POLICY "Restricted student view for authorized faculty"
ON students FOR SELECT TO authenticated
USING (
  mentor_id IN (SELECT id FROM faculty_profiles WHERE auth_user_id = auth.uid())
  OR class_group_id IN (
    SELECT class_group_id FROM timetable_entries
    WHERE faculty_id IN (SELECT id FROM faculty_profiles WHERE auth_user_id = auth.uid())
       OR substitute_faculty_id IN (SELECT id FROM faculty_profiles WHERE auth_user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM faculty_profiles
    WHERE auth_user_id = auth.uid()
    AND ('hod' = ANY(roles) OR 'academic_coordinator' = ANY(roles) OR 'admin' = ANY(roles))
  )
);`}
            </div>
          </div>
        )}

        {/* Tab 5: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="space-y-3 text-xs">
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800 rounded-xl bg-slate-950/60 p-3 border border-slate-800">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400">{log.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

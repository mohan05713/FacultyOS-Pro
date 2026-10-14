import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  LogIn,
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  FileCode,
  Layers,
  Settings,
} from 'lucide-react';
import { dataService, QueryTestReport } from '../services/dataService';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  verifySupabaseConnection,
  SupabaseVerificationResult,
  DEFAULT_SUPABASE_URL,
} from '../lib/supabaseClient';

interface AuthSignInScreenProps {
  onAuthenticated: () => void;
  onContinueDemo: () => void;
  onOpenSettings: () => void;
}

export const AuthSignInScreen: React.FC<AuthSignInScreenProps> = ({
  onAuthenticated,
  onContinueDemo,
  onOpenSettings,
}) => {
  const [email, setEmail] = useState('mohanpalaniappan007@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const [supabaseConfig, setSupabaseConfig] = useState(getStoredSupabaseConfig());
  const [anonKeyInput, setAnonKeyInput] = useState(supabaseConfig.anonKey || '');
  const [showKeyEditor, setShowKeyEditor] = useState(!supabaseConfig.anonKey);
  const [isVerifying, setIsVerifying] = useState(false);
  const [queryReports, setQueryReports] = useState<QueryTestReport[]>([]);
  const [activeUser, setActiveUser] = useState<any | null>(null);
  const [copiedMigration, setCopiedMigration] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  const migration003Sql = `-- Migration 003: Fix Missing Table Privileges & Restricted Student RLS
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/rqxaagvluakuoykuyswa/sql/new

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Core Academic Reference Tables
GRANT SELECT ON departments TO authenticated;
GRANT SELECT ON academic_classes TO authenticated;
GRANT SELECT ON class_sections TO authenticated;
GRANT SELECT ON college_class_groups TO authenticated;
GRANT SELECT ON subjects TO authenticated;

-- Timetable
GRANT SELECT, INSERT, UPDATE, DELETE ON timetable_entries TO authenticated;

-- Faculty Profiles
GRANT SELECT, UPDATE ON faculty_profiles TO authenticated;

-- Students (SELECT only; row access governed strictly by RLS below)
GRANT SELECT ON students TO authenticated;

-- Sequence Privileges
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Revoke sensitive tables from anon role (least-privilege)
REVOKE ALL ON faculty_profiles FROM anon;
REVOKE ALL ON students FROM anon;
REVOKE ALL ON timetable_entries FROM anon;

-- Restricted RLS Policy on students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted student view for authorized faculty" ON students;
CREATE POLICY "Restricted student view for authorized faculty"
ON students
FOR SELECT
TO authenticated
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
    AND ('hod' = ANY(roles) OR 'academic_coordinator' = ANY(roles) OR 'exam_coordinator' = ANY(roles) OR 'admin' = ANY(roles))
  )
);

-- Colleague directory policy on faculty_profiles
DROP POLICY IF EXISTS "Faculty can update their own profile" ON faculty_profiles;
CREATE POLICY "Faculty can update their own profile"
ON faculty_profiles FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated faculty can view faculty directory" ON faculty_profiles;
CREATE POLICY "Authenticated faculty can view faculty directory"
ON faculty_profiles FOR SELECT TO authenticated USING (true);
`;

  const checkCurrentSession = async () => {
    setIsVerifying(true);
    try {
      const user = await dataService.getSupabaseUser();
      setActiveUser(user);
      if (user) {
        const reports = await dataService.testAuthenticatedQueries();
        setQueryReports(reports);
      }
    } catch (e: any) {
      console.warn('Session check:', e);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    checkCurrentSession();
  }, []);

  const handleSaveKey = () => {
    saveStoredSupabaseConfig(supabaseConfig.url, anonKeyInput);
    setSupabaseConfig(getStoredSupabaseConfig());
    setShowKeyEditor(false);
    checkCurrentSession();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const res = await dataService.signInWithSupabase(email, password);
      if (res.error) {
        setAuthError(res.error);
        setIsLoading(false);
        return;
      }

      setActiveUser(res.user);
      setAuthSuccess(`Authenticated successfully as ${res.user.email}!`);

      // Test authenticated SELECT queries across all tables
      const reports = await dataService.testAuthenticatedQueries();
      setQueryReports(reports);

      const hasCoreErrors = reports
        .filter((r) => r.table !== 'students')
        .some((r) => !r.accessible);

      if (!hasCoreErrors) {
        setTimeout(() => {
          onAuthenticated();
        }, 1200);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const hasCorePermissionErrors = queryReports
    .filter((q) => q.table !== 'students')
    .some((q) => !q.accessible);

  const handleCopyMigration = () => {
    navigator.clipboard.writeText(migration003Sql);
    setCopiedMigration(true);
    setTimeout(() => setCopiedMigration(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 font-sans">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-xl shadow-indigo-600/30 mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            FacultyOS <span className="text-indigo-400 font-medium text-lg">Institutional Portal</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Advanced Faculty Management & Teacher Productivity System • Academic Session 2026–2027
          </p>
        </div>

        {/* Live Target Connection Diagnostic Pill */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-white">Target Supabase Project</span>
            </div>
            <span className="font-mono text-[11px] text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/40">
              {DEFAULT_SUPABASE_URL.replace('https://', '')}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
            <span>
              Public Key:{' '}
              <strong className={supabaseConfig.anonKey ? 'text-emerald-400' : 'text-amber-400'}>
                {supabaseConfig.anonKey ? 'Configured' : 'Missing'}
              </strong>
            </span>
            <button
              onClick={() => setShowKeyEditor(!showKeyEditor)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {showKeyEditor ? 'Hide Key Field' : 'Edit API Key'}
            </button>
          </div>

          {showKeyEditor && (
            <div className="pt-2 space-y-2">
              <input
                type="password"
                value={anonKeyInput}
                onChange={(e) => setAnonKeyInput(e.target.value)}
                placeholder="Paste Supabase anon public API key (eyJhbG...)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
              <button
                onClick={handleSaveKey}
                className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
              >
                Save Anon Key
              </button>
            </div>
          )}
        </div>

        {/* Active Session Card or Sign-In Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                {activeUser ? 'Authenticated Session Active' : 'Faculty Sign-In (Supabase Auth)'}
              </h2>
            </div>
            <button
              onClick={checkCurrentSession}
              disabled={isVerifying}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              title="Refresh session status"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Active Session Display */}
          {activeUser ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400">
                  Signed In with Supabase Auth
                </span>
                <p className="font-bold text-white text-sm">{activeUser.email}</p>
                <p className="font-mono text-slate-400 text-[11px]">auth.uid(): {activeUser.id}</p>
              </div>

              {/* Authenticated Queries Test Matrix */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">
                    Live Authenticated SELECT Query Matrix:
                  </span>
                  <button
                    onClick={async () => {
                      setIsVerifying(true);
                      const rep = await dataService.testAuthenticatedQueries();
                      setQueryReports(rep);
                      setIsVerifying(false);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold"
                  >
                    Re-test Queries
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {queryReports.map((q) => (
                    <div
                      key={q.table}
                      className={`p-2 rounded-lg border flex flex-col justify-between ${
                        q.accessible
                          ? 'bg-slate-950/60 border-slate-800 text-slate-200'
                          : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold">{q.table}</span>
                        {q.accessible ? (
                          <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> {q.rowCount} rows
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" /> Denied
                          </span>
                        )}
                      </div>
                      {!q.accessible && (
                        <p className="text-[10px] text-rose-300 mt-1 truncate" title={q.error}>
                          {q.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Table Permission Notice or Verification Success */}
              {hasCorePermissionErrors ? (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/60 text-xs text-amber-200 space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Shield className="w-4 h-4 text-amber-400" />
                    Core Table Privileges Notice
                  </div>
                  <p className="text-[11px]">
                    One or more core academic tables reported a permission issue. Please verify table SELECT grants for the <code>authenticated</code> role.
                  </p>
                </div>
              ) : queryReports.length > 0 ? (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-xs text-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Core Academic Tables Verified
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Departments, subjects, class groups, timetable entries, and faculty profiles are accessible. Student records remain locked down by policy pending schema-aligned RLS design.
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={async () => {
                    await dataService.signOutSupabase();
                    setActiveUser(null);
                    setQueryReports([]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Sign Out
                </button>

                <button
                  onClick={onAuthenticated}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  <span>Proceed to Faculty Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Sign-In Form */
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              {authError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block font-semibold">Supabase Auth Error</strong>
                    <span className="text-[11px]">{authError}</span>
                  </div>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Registered Faculty Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@college.edu"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Supabase Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying with Supabase Auth...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In with Supabase Auth</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Offline Demo Alternative */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 text-[11px]">Need to test without Supabase credentials?</span>
            <button
              onClick={() => {
                dataService.setDataMode('demo_local');
                onContinueDemo();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Explore in Local Demo Mode</span>
            </button>
          </div>
        </div>

        {/* Footer Helper Links */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <button
            onClick={() => setShowMigrationModal(true)}
            className="hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>View SQL Permissions (003)</span>
          </button>
          <span>•</span>
          <button onClick={onOpenSettings} className="hover:text-slate-300 transition-colors flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" />
            <span>Database & RLS Hub</span>
          </button>
        </div>
      </div>

      {/* SQL Migration Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Additive Migration 003: Table Grants & Student RLS
                </h3>
              </div>
              <button
                onClick={() => setShowMigrationModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Run this script once in your{' '}
              <a
                href="https://supabase.com/dashboard/project/rqxaagvluakuoykuyswa/sql/new"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 underline"
              >
                Supabase SQL Editor
              </a>{' '}
              to grant table-level SELECT permissions to the <code>authenticated</code> role and enforce restricted student row-level security.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 max-h-72 overflow-y-auto whitespace-pre">
              {migration003Sql}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopyMigration}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow"
              >
                {copiedMigration ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMigration ? 'SQL Copied to Clipboard!' : 'Copy SQL Script'}</span>
              </button>

              <button
                onClick={() => setShowMigrationModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

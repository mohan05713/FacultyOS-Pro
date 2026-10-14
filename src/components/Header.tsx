import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Bell,
  Database,
  Calendar,
  Clock,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Settings,
} from 'lucide-react';
import { FacultyProfile, FacultyNotification } from '../types/database';
import { dataService } from '../services/dataService';
import {
  getStoredSupabaseConfig,
  verifySupabaseConnection,
  SupabaseVerificationResult,
} from '../lib/supabaseClient';

interface HeaderProps {
  currentFaculty: FacultyProfile | null;
  facultyProfiles: FacultyProfile[];
  onFacultyChange: (facultyId: string) => void;
  onOpenAiAssistant: () => void;
  onOpenSettings: () => void;
  onNavigateTab: (tabId: string) => void;
  dataMode?: 'live_supabase' | 'demo_local';
  onSignOut?: () => void;
  onShowSignIn?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentFaculty,
  facultyProfiles,
  onFacultyChange,
  onOpenAiAssistant,
  onOpenSettings,
  onNavigateTab,
  dataMode = 'live_supabase',
  onSignOut,
  onShowSignIn,
}) => {
  const [notifications, setNotifications] = useState<FacultyNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseVerificationResult | null>(null);

  useEffect(() => {
    verifySupabaseConnection().then(setSupabaseStatus);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentFaculty) {
      dataService.getNotifications(currentFaculty.id).then(setNotifications);
    }
  }, [currentFaculty]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    await dataService.markNotificationAsRead(id);
    if (currentFaculty) {
      const updated = await dataService.getNotifications(currentFaculty.id);
      setNotifications(updated);
    }
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  FacultyOS
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Academic Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Academic Year 2026–2027 • Even Semester
              </p>
            </div>
          </div>

          {/* Quick Real-Time Clock & College Calendar Info */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formattedDate}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 font-mono text-sky-400 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* AI Assistant Button */}
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all transform hover:scale-[1.02]"
              title="Launch AI Teaching Copilot"
            >
              <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
              <span className="hidden sm:inline">AI Teaching Copilot</span>
            </button>

            {/* Supabase Status Chip */}
            {dataMode === 'live_supabase' ? (
              <button
                onClick={onOpenSettings}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  supabaseStatus?.isConnected
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50'
                    : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50'
                }`}
                title={
                  supabaseStatus?.isConnected
                    ? `Live Supabase Connected (${supabaseStatus.projectUrl})`
                    : `Live Supabase Permission Alert: ${supabaseStatus?.errorMessage || 'Check tables'}`
                }
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">
                  {supabaseStatus?.isConnected ? 'Live Supabase' : 'Supabase Permission Alert'}
                </span>
              </button>
            ) : (
              <button
                onClick={onShowSignIn || onOpenSettings}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/40 text-amber-300 border border-amber-800/60 hover:bg-amber-900/50"
                title="Currently in Local Demo Mode (Click to Sign In to Live Supabase)"
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Local Demo Mode</span>
              </button>
            )}

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-400" />
                      Academic Notifications
                    </h4>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-700/50 my-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        No notifications currently.
                      </p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`py-2.5 px-2 rounded-lg transition-colors ${
                            notif.is_read ? 'opacity-70' : 'bg-slate-700/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-slate-200">
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-300 mt-0.5">
                                {notif.message}
                              </p>
                            </div>
                            {!notif.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="text-sky-400 hover:text-sky-300 text-[11px] whitespace-nowrap"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {new Date(notif.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Faculty Switcher (Supports testing multi-role and RLS) */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white truncate max-w-[140px]">
                  {currentFaculty?.full_name || 'Faculty'}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  {currentFaculty?.designation}
                </p>
              </div>

              <select
                value={currentFaculty?.id || ''}
                onChange={(e) => onFacultyChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Switch Faculty Persona (Role/RLS tester)"
              >
                {facultyProfiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.full_name} ({f.faculty_id})
                  </option>
                ))}
              </select>

              <button
                onClick={onOpenSettings}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Settings & Schema Tools"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

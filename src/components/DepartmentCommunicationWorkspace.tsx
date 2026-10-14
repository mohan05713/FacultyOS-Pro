import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Users,
  FileText,
  Pin,
  Check,
  X,
  Send,
  MessageSquare,
} from 'lucide-react';
import {
  Announcement,
  Meeting,
  FacultyProfile,
} from '../types/database';
import { dataService } from '../services/dataService';

interface DepartmentCommunicationWorkspaceProps {
  currentFaculty: FacultyProfile | null;
  onNavigateTab: (tabId: string) => void;
  onOpenAiAssistant: () => void;
}

export const DepartmentCommunicationWorkspace: React.FC<DepartmentCommunicationWorkspaceProps> = ({
  currentFaculty,
  onNavigateTab,
  onOpenAiAssistant,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeTab, setActiveTab] = useState<'announcements' | 'meetings'>('announcements');

  const loadData = async () => {
    const [ancData, meetData] = await Promise.all([
      dataService.getAnnouncements(),
      dataService.getMeetings(),
    ]);
    setAnnouncements(ancData);
    setMeetings(meetData);
  };

  useEffect(() => {
    loadData();
  }, [currentFaculty]);

  const handleAcknowledgeCircular = async (id: string) => {
    if (!currentFaculty) return;
    await dataService.markAnnouncementAsRead(id, currentFaculty.id);
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Workspace Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Module 12 • Academic Council, Meetings & Notices
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Department Communications & Meeting Minutes
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Official circulars, academic council agendas, minutes of meetings (MoM), and actionable responsibility assignments
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'announcements'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          Circulars & Notices ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'meetings'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Department Meetings & Action Items ({meetings.length})
        </button>
      </div>

      {/* Tab 1: Circulars & Notices */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((anc) => {
              const isRead = currentFaculty ? anc.read_by_faculty_ids.includes(currentFaculty.id) : false;

              return (
                <div
                  key={anc.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                        {anc.category} Circular
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{anc.title}</h4>
                    </div>
                    {anc.is_pinned && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 flex items-center gap-1">
                        <Pin className="w-3 h-3" /> PINNED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 whitespace-pre-line bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                    {anc.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>Issued by: <strong className="text-slate-200">{anc.author_name}</strong></span>
                    <span>Date: {anc.published_date}</span>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    {!isRead ? (
                      <button
                        onClick={() => handleAcknowledgeCircular(anc.id)}
                        className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold"
                      >
                        Acknowledge & Mark Read
                      </button>
                    ) : (
                      <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Acknowledged by You
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Meetings & Action Items */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          {meetings.map((meet) => (
            <div
              key={meet.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    DEPARTMENT ACADEMIC COUNCIL
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">{meet.title}</h4>
                  <p className="text-xs text-slate-400">
                    Venue: {meet.venue} • Scheduled Date: {meet.meeting_date} ({meet.start_time} - {meet.end_time})
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300">
                  {meet.status}
                </span>
              </div>

              {/* Agenda */}
              <div className="text-xs text-slate-300 space-y-1">
                <span className="text-slate-400 font-semibold block">Meeting Agenda:</span>
                <p className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 whitespace-pre-line text-slate-200">
                  {meet.agenda}
                </p>
              </div>

              {/* Action items */}
              {meet.action_items?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-sky-400 block">
                    Action Items Assigned to Faculty:
                  </span>
                  <div className="space-y-2">
                    {meet.action_items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs"
                      >
                        <span className="text-white font-medium">{item.description}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400">Due: {item.due_date}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

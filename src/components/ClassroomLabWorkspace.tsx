import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Plus,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  Server,
  Zap,
  X,
  Send,
  Calendar,
} from 'lucide-react';
import {
  LabMaintenanceRequest,
  Subject,
  CollegeClassGroup,
  FacultyProfile,
  TimetableEntry,
} from '../types/database';
import { dataService } from '../services/dataService';

interface ClassroomLabWorkspaceProps {
  currentFaculty: FacultyProfile | null;
  onNavigateTab: (tabId: string) => void;
}

export const ClassroomLabWorkspace: React.FC<ClassroomLabWorkspaceProps> = ({
  currentFaculty,
  onNavigateTab,
}) => {
  const [labRequests, setLabRequests] = useState<LabMaintenanceRequest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'labs' | 'maintenance' | 'experiments'>('labs');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState<Partial<LabMaintenanceRequest>>({
    room_or_lab: 'Lab-Cloud-2 (System 14 & 15)',
    equipment_name: '',
    issue_description: '',
    priority: 'Medium',
  });

  const practicalExperiments = [
    { id: 1, name: 'Containerization & Multi-tier Docker Compose Cluster', hours: 3, completedStudents: 34, totalStudents: 36, status: 'Completed' },
    { id: 2, name: 'Kubernetes Pod Deployment & Ingress Controller Configuration', hours: 3, completedStudents: 32, totalStudents: 36, status: 'Completed' },
    { id: 3, name: 'Benchmarking RPC Throughput with gRPC in Golang', hours: 3, completedStudents: 28, totalStudents: 36, status: 'In Progress' },
    { id: 4, name: 'Simulating Distributed Raft Leader Election under Network Flaps', hours: 3, completedStudents: 0, totalStudents: 36, status: 'Upcoming' },
    { id: 5, name: 'Fault-Tolerant High-Availability Database Replication', hours: 3, completedStudents: 0, totalStudents: 36, status: 'Upcoming' },
  ];

  const loadData = async () => {
    if (!currentFaculty) return;
    const [reqs, subs, tt] = await Promise.all([
      dataService.getLabRequests(),
      dataService.getSubjects(currentFaculty.department_id),
      dataService.getTimetable(undefined, currentFaculty.id),
    ]);

    setLabRequests(reqs);
    setSubjects(subs);
    setTimetable(tt.filter((t) => t.is_lab));
  };

  useEffect(() => {
    loadData();
  }, [currentFaculty]);

  const handleSaveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFaculty) return;

    const newReq: LabMaintenanceRequest = {
      id: `lab-req-${Date.now()}`,
      faculty_id: currentFaculty.id,
      room_or_lab: issueForm.room_or_lab || 'Lab-Cloud-2',
      equipment_name: issueForm.equipment_name || 'Workstation',
      issue_description: issueForm.issue_description || '',
      priority: (issueForm.priority as any) || 'Medium',
      status: 'Reported',
      created_at: new Date().toISOString(),
    };

    await dataService.addLabRequest(newReq);
    setShowIssueModal(false);
    setIssueForm({
      room_or_lab: 'Lab-Cloud-2 (System 14 & 15)',
      equipment_name: '',
      issue_description: '',
      priority: 'Medium',
    });
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Workspace Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Module 5 • Classroom Facilities & Laboratory Management
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Practical Labs & Classroom Facility Hub
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Lab allocations, experiment syllabus completion, workstation equipment maintenance, and projector incident logs
            </p>
          </div>

          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
          >
            <Wrench className="w-4 h-4" />
            Report Equipment Breakdown
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('labs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'labs'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Monitor className="w-4 h-4" />
          Allocated Practical Labs ({timetable.length} sessions)
        </button>
        <button
          onClick={() => setActiveTab('experiments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'experiments'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Practical Experiments Syllabus ({practicalExperiments.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'maintenance'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Equipment Maintenance Requests ({labRequests.length})
        </button>
      </div>

      {/* Tab 1: Allocated Practical Labs */}
      {activeTab === 'labs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {timetable.map((tt) => (
            <div
              key={tt.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    LABORATORY SESSION
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    {tt.lab_name || 'Advanced Cloud & Cluster Computing Lab'}
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  Room: {tt.room_number}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                <p>
                  <strong>Scheduled Day:</strong> {tt.day_of_week} (Period {tt.period_number})
                </p>
                <p>
                  <strong>Timing:</strong> {tt.start_time} - {tt.end_time}
                </p>
                <p>
                  <strong>Configured Resources:</strong> 40 High-Performance Workstations, Gigabit Switch, Docker Daemon, Dual LCD Displays.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
                <button
                  onClick={() => onNavigateTab('attendance')}
                  className="text-sky-400 hover:text-sky-300 font-semibold"
                >
                  Mark Lab Batch Attendance →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Experiments List */}
      {activeTab === 'experiments' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Expt #</th>
                <th className="py-3.5 px-4">Experiment Title</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Student Records Submitted</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {practicalExperiments.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">{exp.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{exp.name}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">{exp.hours} hours</td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-emerald-400 font-bold">
                      {exp.completedStudents} / {exp.totalStudents}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        exp.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : exp.status === 'In Progress'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {exp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Maintenance Requests */}
      {activeTab === 'maintenance' && (
        <div className="space-y-3">
          {labRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{req.equipment_name}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-indigo-400 font-medium">{req.room_or_lab}</span>
                  <span
                    className={`px-2 py-0.2 rounded font-bold uppercase text-[9px] ${
                      req.priority === 'High' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {req.priority}
                  </span>
                </div>
                <p className="text-slate-300">{req.issue_description}</p>
                {req.resolution_notes && (
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Technician update: {req.resolution_notes}
                  </p>
                )}
              </div>

              <span
                className={`px-2.5 py-1 rounded font-bold text-xs ${
                  req.status === 'Resolved'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {req.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Report Equipment Issue */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-400" />
                Report Equipment Breakdown
              </h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIssue} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Classroom / Lab Location</label>
                <input
                  type="text"
                  value={issueForm.room_or_lab || ''}
                  onChange={(e) => setIssueForm({ ...issueForm, room_or_lab: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g. Lab-Cloud-2 (System 14 & 15)"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Equipment Name / Serial</label>
                <input
                  type="text"
                  value={issueForm.equipment_name || ''}
                  onChange={(e) => setIssueForm({ ...issueForm, equipment_name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g. HDMI LCD Projector or NIC Workstation"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Issue Description</label>
                <textarea
                  value={issueForm.issue_description || ''}
                  onChange={(e) => setIssueForm({ ...issueForm, issue_description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Describe failure, error codes, and symptoms..."
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Priority</label>
                <select
                  value={issueForm.priority}
                  onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="High">High (Impacting scheduled class)</option>
                  <option value="Medium">Medium (Affects non-critical bench)</option>
                  <option value="Low">Low (Maintenance inquiry)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

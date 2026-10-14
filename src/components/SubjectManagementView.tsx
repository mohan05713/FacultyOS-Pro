import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Edit2, AlertTriangle, CheckCircle, RefreshCw, X, Building2 } from 'lucide-react';
import { Subject, Department, FacultyProfile } from '../types/database';
import { dataService } from '../services/dataService';

interface SubjectManagementViewProps {
  currentFaculty: FacultyProfile | null;
  onNavigateTab?: (tabId: string) => void;
}

export const SubjectManagementView: React.FC<SubjectManagementViewProps> = ({ currentFaculty, onNavigateTab }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [depts, subs] = await Promise.all([
        dataService.getDepartments(),
        dataService.getSubjects(),
      ]);
      setDepartments(depts);
      setSubjects(subs);

      // Default department selection if empty
      if (!departmentId && depts.length > 0) {
        setDepartmentId(depts[0].id);
      }

      const dbErrors = dataService.getDatabaseErrors();
      if (dbErrors['subjects']) {
        setErrorMsg(`Supabase Error for Subjects: ${dbErrors['subjects']}`);
      } else if (dbErrors['departments']) {
        setErrorMsg(`Supabase Error for Departments: ${dbErrors['departments']}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load data from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetForm = () => {
    setEditingId(null);
    setSubjectCode('');
    setSubjectName('');
    setDepartmentId(departments[0]?.id || '');
    setIsActive(true);
  };

  const handleEdit = (sub: Subject) => {
    setEditingId(sub.id);
    setSubjectCode(sub.code);
    setSubjectName(sub.name);
    setDepartmentId(sub.department_id);
    setIsActive(sub.is_active ?? true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!subjectCode.trim() || !subjectName.trim() || !departmentId) {
      setErrorMsg('Subject code, name, and department are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Subject = {
        id: editingId || `sub-${Date.now()}`,
        code: subjectCode.trim(),
        name: subjectName.trim(),
        department_id: departmentId,
        is_active: isActive,
        semester: 1,
        credits: 3,
        type: 'Theory',
        created_at: new Date().toISOString(),
      };

      await dataService.saveSubject(payload);
      
      const dbErrors = dataService.getDatabaseErrors();
      if (dbErrors['subjects']) {
        setErrorMsg(`Database permission/RLS error: ${dbErrors['subjects']}`);
        return;
      }

      setSuccessMsg(editingId ? 'Subject updated successfully in Supabase!' : 'New subject added successfully to Supabase!');
      handleResetForm();
      await loadData();
    } catch (err: any) {
      setErrorMsg(`Failed to save subject to Supabase: ${err.message || 'Permission denied or invalid payload'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete subject "${code}" from Supabase?`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await dataService.deleteSubject(id);

      const dbErrors = dataService.getDatabaseErrors();
      if (dbErrors['subjects']) {
        setErrorMsg(`Failed to delete subject: ${dbErrors['subjects']}`);
        return;
      }

      setSuccessMsg(`Subject "${code}" deleted from Supabase.`);
      await loadData();
    } catch (err: any) {
      setErrorMsg(`Delete failed: ${err.message || 'Permission denied'}`);
    }
  };

  const getDeptName = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? `${dept.name} (${dept.code})` : deptId;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Subject Management</h2>
            <p className="text-xs text-slate-300">
              Create, update, and manage academic subjects stored directly in live Supabase database
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh
          </button>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('timetable')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              Go to Timetable
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-1 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              {editingId ? 'Edit Subject' : 'Add New Subject'}
            </h3>
            {editingId && (
              <button
                onClick={handleResetForm}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Subject Code */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Subject Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g. CS8301"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Subject Name */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Subject Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Data Structures and Algorithms"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Department Dropdown (Populated from real records in departments table) */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Department <span className="text-rose-400">*</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                required
              >
                {departments.length === 0 ? (
                  <option value="">No departments available</option>
                ) : (
                  departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="is_active" className="text-slate-300 cursor-pointer font-medium">
                Active Subject Status (`is_active`)
              </label>
            </div>

            {/* Form Actions */}
            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || departments.length === 0}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Saving to Supabase...' : editingId ? 'Update Subject' : 'Save Subject to Supabase'}
              </button>
            </div>
          </form>
        </div>

        {/* Subjects List */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Subjects in Database ({subjects.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Source: <strong className="text-indigo-300">Supabase `subjects` Table</strong>
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Fetching subjects from Supabase...</span>
            </div>
          ) : subjects.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2 border border-dashed border-slate-800 rounded-xl p-6">
              <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
              <p className="font-semibold text-slate-300">No Subjects Found in Supabase</p>
              <p className="text-[11px] text-slate-500">
                Use the form on the left to add your first subject record into the database.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Subject Code</th>
                    <th className="py-2.5 px-3 font-semibold">Subject Name</th>
                    <th className="py-2.5 px-3 font-semibold">Department</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white font-mono">{sub.code}</td>
                      <td className="py-2.5 px-3 text-slate-200">{sub.name}</td>
                      <td className="py-2.5 px-3 text-slate-400">{getDeptName(sub.department_id)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sub.is_active ?? true
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                          }`}
                        >
                          {sub.is_active ?? true ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        <button
                          onClick={() => handleEdit(sub)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id, sub.code)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

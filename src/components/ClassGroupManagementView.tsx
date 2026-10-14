import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';
import { CollegeClassGroup, Department, FacultyProfile } from '../types/database';
import { dataService } from '../services/dataService';

interface ClassGroupManagementViewProps {
  currentFaculty: FacultyProfile | null;
  onNavigateTab?: (tabId: string) => void;
}

export const ClassGroupManagementView: React.FC<ClassGroupManagementViewProps> = ({
  currentFaculty,
  onNavigateTab,
}) => {
  const [classGroups, setClassGroups] = useState<CollegeClassGroup[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [programName, setProgramName] = useState<string>('B.Tech Computer Science');
  const [semester, setSemester] = useState<number>(5);
  const [section, setSection] = useState<string>('A');
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [depts, groups] = await Promise.all([
        dataService.getDepartments(),
        dataService.getClassGroups(),
      ]);
      setDepartments(depts);
      setClassGroups(groups);

      if (!departmentId && depts.length > 0) {
        setDepartmentId(depts[0].id);
      }

      const dbErrors = dataService.getDatabaseErrors();
      if (dbErrors['college_class_groups']) {
        setErrorMsg(`Supabase Error for Class Groups: ${dbErrors['college_class_groups']}`);
      } else if (dbErrors['departments']) {
        setErrorMsg(`Supabase Error for Departments: ${dbErrors['departments']}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load class groups from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetForm = () => {
    setEditingId(null);
    setProgramName('B.Tech Computer Science');
    setSemester(5);
    setSection('A');
    setAcademicYear('2026-2027');
    setDepartmentId(departments[0]?.id || '');
    setIsActive(true);
  };

  const handleEdit = (group: CollegeClassGroup) => {
    setEditingId(group.id);
    setProgramName(group.name || '');
    setSemester(group.semester || 1);
    setSection('A');
    setAcademicYear(group.academic_year || '2026-2027');
    setDepartmentId(group.department_id);
    setIsActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!programName.trim() || !departmentId || !academicYear.trim()) {
      setErrorMsg('Program name, department, and academic year are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Form combined group name matching existing schema
      const formattedName = section.trim()
        ? `${programName.trim()} - Sem ${semester} (Sec ${section.trim().toUpperCase()})`
        : `${programName.trim()} - Sem ${semester}`;

      const payload: CollegeClassGroup = {
        id: editingId || `grp-${Date.now()}`,
        name: formattedName,
        semester: Number(semester),
        academic_year: academicYear.trim(),
        department_id: departmentId,
        created_at: new Date().toISOString(),
      };

      await dataService.saveClassGroup(payload);

      const dbErrors = dataService.getDatabaseErrors();
      if (dbErrors['college_class_groups']) {
        setErrorMsg(`Database permission/RLS error: ${dbErrors['college_class_groups']}`);
        return;
      }

      setSuccessMsg(editingId ? 'Class group updated successfully in Supabase!' : 'New class group added successfully to Supabase!');
      handleResetForm();
      await loadData();
    } catch (err: any) {
      setErrorMsg(`Failed to save class group to Supabase: ${err.message || 'Permission denied or invalid payload'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete class group "${name}" from Supabase?`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await dataService.deleteClassGroup(id);

      const dbErrors = dataService.getDatabaseErrors();
      if (dbErrors['college_class_groups']) {
        setErrorMsg(`Failed to delete class group: ${dbErrors['college_class_groups']}`);
        return;
      }

      setSuccessMsg(`Class group "${name}" deleted from Supabase.`);
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
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Class Group Management</h2>
            <p className="text-xs text-slate-300">
              Create and manage college class groups (programs, semesters, sections) directly in live Supabase
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
              {editingId ? 'Edit Class Group' : 'Add Class Group'}
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
            {/* Program Name */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Program / Class Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Semester & Section */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Semester <span className="text-rose-400">*</span>
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Section <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. A"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Academic Year <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2026-2027"
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
                id="is_active_grp"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="is_active_grp" className="text-slate-300 cursor-pointer font-medium">
                Active Group Status (`is_active`)
              </label>
            </div>

            {/* Form Actions */}
            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || departments.length === 0}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Saving to Supabase...' : editingId ? 'Update Class Group' : 'Save Class Group to Supabase'}
              </button>
            </div>
          </form>
        </div>

        {/* Class Groups List */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Class Groups in Database ({classGroups.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Source: <strong className="text-indigo-300">Supabase `college_class_groups` Table</strong>
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Fetching class groups from Supabase...</span>
            </div>
          ) : classGroups.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2 border border-dashed border-slate-800 rounded-xl p-6">
              <Users className="w-8 h-8 mx-auto text-slate-600" />
              <p className="font-semibold text-slate-300">No Class Groups Found in Supabase</p>
              <p className="text-[11px] text-slate-500">
                Use the form on the left to add your first class group record into the database.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Group Name</th>
                    <th className="py-2.5 px-3 font-semibold">Semester</th>
                    <th className="py-2.5 px-3 font-semibold">Academic Year</th>
                    <th className="py-2.5 px-3 font-semibold">Department</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {classGroups.map((grp) => (
                    <tr key={grp.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white font-mono">{grp.name}</td>
                      <td className="py-2.5 px-3 text-slate-300">Semester {grp.semester}</td>
                      <td className="py-2.5 px-3 text-slate-400">{grp.academic_year}</td>
                      <td className="py-2.5 px-3 text-slate-400">{getDeptName(grp.department_id)}</td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        <button
                          onClick={() => handleEdit(grp)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300"
                          title="Edit Class Group"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(grp.id, grp.name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                          title="Delete Class Group"
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

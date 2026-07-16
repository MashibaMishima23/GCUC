import { useEffect, useState, useCallback } from 'react'
import { getSubjects, createSubject, updateSubject, deleteSubject, getDepartments } from '../lib/mockApi'
import toast from 'react-hot-toast'
import {
  PlusIcon, PencilIcon, TrashIcon,
  MagnifyingGlassIcon, XMarkIcon, BookOpenIcon
} from '@heroicons/react/24/outline'

const SEMESTERS = ['1st', '2nd', 'summer']
const EMPTY_FORM = { code: '', name: '', department_id: '', semester: '1st', school_year: '' }

export default function Subjects() {
  const [subjects, setSubjects]     = useState([])
  const [departments, setDepts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [semFilter, setSemFilter]   = useState('')
  const [modal, setModal]           = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [editId, setEditId]         = useState(null)
  const [saving, setSaving]         = useState(false)
  const [deleteId, setDeleteId]     = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getSubjects({ department_id: deptFilter || undefined, semester: semFilter || undefined, search: search || undefined })
      .then(r => setSubjects(r.data))
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoading(false))
  }, [deptFilter, semFilter, search])

  useEffect(() => { load(); getDepartments().then(r => setDepts(r.data)).catch(() => {}) }, [load])
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t) }, [search]) // eslint-disable-line

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setModal('add') }
  const openEdit = s => { setForm({ code: s.code, name: s.name, department_id: s.department_id, semester: s.semester, school_year: s.school_year }); setEditId(s.id); setModal('edit') }
  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setEditId(null) }

  const handleSave = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (modal === 'add') { await createSubject(form); toast.success('Subject created') }
      else { await updateSubject(editId, form); toast.success('Subject updated') }
      closeModal(); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await deleteSubject(deleteId); toast.success('Subject deleted'); setDeleteId(null); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1>Subjects</h1><p className="text-gray-500 text-sm">{subjects.length} subjects</p></div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><PlusIcon className="w-4 h-4" /> Add Subject</button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search code or name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-52" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input w-36" value={semFilter} onChange={e => setSemFilter(e.target.value)}>
          <option value="">All Semesters</option>
          {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading…</div> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Subject Name</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Semester</th>
                <th className="px-4 py-3 font-medium">School Year</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subjects.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{s.code}</span></td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex items-center gap-2"><BookOpenIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />{s.name}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.department_name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.semester}</td>
                  <td className="px-4 py-3 text-gray-500">{s.school_year}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><PencilIcon className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(s.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No subjects found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">{modal === 'add' ? 'Add Subject' : 'Edit Subject'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Subject Code *</label><input className="input" required placeholder="e.g. CS101" value={form.code} onChange={set('code')} /></div>
                <div className="col-span-2"><label className="label">Subject Name *</label><input className="input" required placeholder="e.g. Introduction to Computing" value={form.name} onChange={set('name')} /></div>
                <div className="col-span-2">
                  <label className="label">Department *</label>
                  <select className="input" required value={form.department_id} onChange={set('department_id')}>
                    <option value="">— Select Department —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Semester *</label>
                  <select className="input" required value={form.semester} onChange={set('semester')}>
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="label">School Year *</label><input className="input" required placeholder="e.g. 2024-2025" value={form.school_year} onChange={set('school_year')} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : modal === 'add' ? 'Create Subject' : 'Save Changes'}</button>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Delete Subject?</h3>
            <p className="text-sm text-gray-500">This will permanently delete the subject.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="btn-primary bg-red-600 hover:bg-red-700">Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

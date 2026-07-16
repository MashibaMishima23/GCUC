import { useEffect, useState, useCallback } from 'react'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getUsers } from '../lib/mockApi'
import toast from 'react-hot-toast'
import {
  PlusIcon, PencilIcon, TrashIcon,
  MagnifyingGlassIcon, XMarkIcon, BuildingOfficeIcon
} from '@heroicons/react/24/outline'

const EMPTY_FORM = { name:'', code:'', description:'', department_head_id:'' }

export default function Departments() {
  const [depts, setDepts]       = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [editId, setEditId]     = useState(null)
  const [saving, setSaving]     = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getDepartments()
      .then(r => setDepts(r.data))
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false))
  }, [])

  const loadTeachers = useCallback(() => {
    getUsers({ role: 'teacher', limit: 200 })
      .then(r => setTeachers(r.data.data))
      .catch(() => {})
    getUsers({ role: 'department_head', limit: 200 })
      .then(r => setTeachers(prev => {
        const ids = new Set(prev.map(t => t.id))
        return [...prev, ...r.data.data.filter(u => !ids.has(u.id))]
      }))
      .catch(() => {})
  }, [])

  useEffect(() => { load(); loadTeachers() }, [load, loadTeachers])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setModal('add') }
  const openEdit = dept => {
    setForm({ name: dept.name, code: dept.code, description: dept.description || '', department_head_id: dept.department_head_id || '' })
    setEditId(dept.id); setModal('edit')
  }
  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setEditId(null) }

  const handleSave = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, department_head_id: form.department_head_id || null }
      if (modal === 'add') { await createDepartment(payload); toast.success('Department created') }
      else { await updateDepartment(editId, payload); toast.success('Department updated') }
      closeModal(); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await deleteDepartment(deleteId); toast.success('Department deleted')
      setDeleteId(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  const filtered = depts.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1>Department Management</h1><p className="text-gray-500 text-sm">{depts.length} departments</p></div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><PlusIcon className="w-4 h-4" /> Add Department</button>
      </div>

      <div className="relative w-full max-w-sm">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search by name or code…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(d => (
            <div key={d.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 p-2 rounded-lg"><BuildingOfficeIcon className="w-5 h-5 text-primary-700" /></div>
                  <div>
                    <p className="font-semibold text-gray-800">{d.name}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{d.code}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(d.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><TrashIcon className="w-4 h-4" /></button>
                </div>
              </div>
              {d.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{d.description}</p>}
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-600">Department Head: </span>
                {d.department_head_name || <span className="italic">Not assigned</span>}
              </p>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No departments found.</div>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">{modal === 'add' ? 'Add Department' : 'Edit Department'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Department Name *</label><input className="input" required value={form.name} onChange={set('name')} placeholder="e.g. Information Technology" /></div>
                <div><label className="label">Department Code *</label><input className="input" required value={form.code} onChange={set('code')} placeholder="e.g. IT" /></div>
                <div>
                  <label className="label">Department Head</label>
                  <select className="input" value={form.department_head_id} onChange={set('department_head_id')}>
                    <option value="">— Not Assigned —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={set('description')} placeholder="Optional description…" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : modal === 'add' ? 'Create Department' : 'Save Changes'}</button>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Delete Department?</h3>
            <p className="text-sm text-gray-500">This will permanently delete the department.</p>
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

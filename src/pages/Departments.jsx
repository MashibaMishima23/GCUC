import { useEffect, useState, useCallback } from 'react'
import api from '../lib/api'
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

  const [modal, setModal]       = useState(null) // 'add'|'edit'
  const [form, setForm]         = useState(EMPTY_FORM)
  const [editId, setEditId]     = useState(null)
  const [saving, setSaving]     = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteImpact, setDeleteImpact] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/departments')
      .then(r => setDepts(r.data))
      .catch(err => {
        console.error('Department load error:', err)
        if (err.response?.status === 401) {
          toast.error('Please log in to view departments')
        } else {
          toast.error(err.response?.data?.message || 'Failed to load departments')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const loadTeachers = useCallback(() => {
    api.get('/users', { params: { role: 'teacher', limit: 200 } })
      .then(r => setTeachers(r.data.data))
      .catch(() => {})
    // also include department_head role in pool
    api.get('/users', { params: { role: 'department_head', limit: 200 } })
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
    setForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      department_head_id: dept.department_head_id || '',
    })
    setEditId(dept.id)
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setEditId(null) }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        department_head_id: form.department_head_id || null,
      }
      if (modal === 'add') {
        await api.post('/departments', payload)
        toast.success('Department created')
      } else {
        await api.patch(`/departments/${editId}`, payload)
        toast.success('Department updated')
      }
      closeModal()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/departments/${deleteId}`)
      toast.success('Department deleted')
      setDeleteId(null)
      setDeleteImpact(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleDeleteClick = async (id) => {
    try {
      const { data } = await api.get(`/departments/${id}/impact`)
      setDeleteImpact(data)
      setDeleteId(id)
    } catch {
      toast.error('Failed to check impact')
    }
  }

  const filtered = depts.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Department Management</h1>
          <p className="text-gray-500 text-sm">{depts.length} departments</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Department
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search by name or code…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Overall Statistics */}
      {!loading && depts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-blue-50 border-blue-200">
            <div className="text-sm text-blue-600 font-medium mb-1">Total Students</div>
            <div className="text-3xl font-bold text-blue-900">
              {depts.reduce((sum, d) => sum + (parseInt(d.student_count) || 0), 0)}
            </div>
          </div>
          <div className="card bg-green-50 border-green-200">
            <div className="text-sm text-green-600 font-medium mb-1">Total Teachers</div>
            <div className="text-3xl font-bold text-green-900">
              {depts.reduce((sum, d) => sum + (parseInt(d.teacher_count) || 0), 0)}
            </div>
          </div>
          <div className="card bg-purple-50 border-purple-200">
            <div className="text-sm text-purple-600 font-medium mb-1">Total Subjects</div>
            <div className="text-3xl font-bold text-purple-900">
              {depts.reduce((sum, d) => sum + (parseInt(d.subject_count) || 0), 0)}
            </div>
          </div>
          <div className="card bg-amber-50 border-amber-200">
            <div className="text-sm text-amber-600 font-medium mb-1">Total Blocks</div>
            <div className="text-3xl font-bold text-amber-900">
              {depts.reduce((sum, d) => sum + (parseInt(d.block_count) || 0), 0)}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(d => (
            <div key={d.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <BuildingOfficeIcon className="w-5 h-5 text-primary-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{d.name}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{d.code}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)}
                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded" title="Edit">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteClick(d.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {d.description && (
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{d.description}</p>
              )}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{d.student_count || 0}</div>
                  <div className="text-xs text-gray-500">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{d.teacher_count || 0}</div>
                  <div className="text-xs text-gray-500">Teachers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">{d.subject_count || 0}</div>
                  <div className="text-xs text-gray-500">Subjects</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-amber-600">{d.block_count || 0}</div>
                  <div className="text-xs text-gray-500">Blocks</div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                <span className="font-medium text-gray-600">Department Head: </span>
                {d.department_head_name || <span className="italic">Not assigned</span>}
              </p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">No departments found.</div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">{modal === 'add' ? 'Add Department' : 'Edit Department'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Department Name *</label>
                  <input className="input" required value={form.name} onChange={set('name')}
                    placeholder="e.g. Information Technology" />
                </div>
                <div>
                  <label className="label">Department Code *</label>
                  <input className="input" required value={form.code} onChange={set('code')}
                    placeholder="e.g. IT" />
                </div>
                <div>
                  <label className="label">Department Head</label>
                  <select className="input" value={form.department_head_id} onChange={set('department_head_id')}>
                    <option value="">— Not Assigned —</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <textarea className="input" rows={3} value={form.description} onChange={set('description')}
                    placeholder="Optional description…" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : modal === 'add' ? 'Create Department' : 'Save Changes'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && deleteImpact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-gray-800 text-lg">Delete Department?</h3>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 font-medium mb-3">⚠️ This action will affect:</p>
              <div className="space-y-2 text-sm text-amber-800">
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Students:
                  </span>
                  <span className="font-bold text-lg">{deleteImpact.student_count}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Teachers:
                  </span>
                  <span className="font-bold text-lg">{deleteImpact.teacher_count}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Subjects:
                  </span>
                  <span className="font-bold text-lg">{deleteImpact.subject_count}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    Blocks:
                  </span>
                  <span className="font-bold text-lg">{deleteImpact.block_count}</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              Users, subjects, and blocks linked to this department may need reassignment or will become unlinked.
            </p>
            
            <div className="flex gap-3">
              <button onClick={handleDelete} className="btn-primary bg-red-600 hover:bg-red-700 flex-1">
                Delete Anyway
              </button>
              <button onClick={() => { setDeleteId(null); setDeleteImpact(null) }} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { PlusIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function TeacherAssignments() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [subjects, setSubjects]       = useState([])
  const [teachers, setTeachers]       = useState([])
  const [loading, setLoading]         = useState(true)

  const [search, setSearch]           = useState('')
  const [subjectFilter, setSubjF]     = useState('')

  const [modal, setModal]             = useState(false)
  const [form, setForm]               = useState({ teacher_id:'', subject_id:'' })
  const [saving, setSaving]           = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/assignments')
      .then(r => setAssignments(r.data))
      .catch(() => toast.error('Failed to load assignments'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    // Subjects scoped to dept head's department (backend handles scoping via JWT)
    api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {})

    // Teachers: only from the dept head's own department
    // If dept_head — backend scopes by department_id automatically via JWT
    // We pass role=teacher and let backend filter by the user's department
    api.get('/users', {
      params: {
        role: 'teacher',
        limit: 200,
        // For guidance/admin, no dept filter — they see all.
        // For dept_head, backend enforces their department scope.
      }
    })
      .then(r => setTeachers(r.data.data))
      .catch(() => {})
  }, [load])

  const handleAdd = async e => {
    e.preventDefault()
    if (!form.teacher_id || !form.subject_id)
      return toast.error('Select both a teacher and subject')
    setSaving(true)
    try {
      await api.post('/assignments', form)
      toast.success('Assignment created')
      setModal(false)
      setForm({ teacher_id:'', subject_id:'' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const handleRemove = async id => {
    try {
      await api.delete(`/assignments/${id}`)
      toast.success('Assignment removed')
      load()
    } catch { toast.error('Failed') }
  }

  const filtered = assignments.filter(a => {
    const matchSearch = !search ||
      a.teacher_name.toLowerCase().includes(search.toLowerCase()) ||
      a.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      a.subject_code.toLowerCase().includes(search.toLowerCase())
    const matchSubj = !subjectFilter || String(a.subject_id) === subjectFilter
    return matchSearch && matchSubj
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Teacher–Subject Assignments</h1>
          <p className="text-gray-500 text-sm">{assignments.length} assignments</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Assign Teacher
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search teacher or subject…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-56" value={subjectFilter} onChange={e => setSubjF(e.target.value)}>
          <option value="">All Subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.code} – {s.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Teacher</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{a.teacher_name}</td>
                  <td className="px-4 py-3 text-gray-700">{a.subject_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{a.subject_code}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{a.department_name}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleRemove(a.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No assignments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Assign Teacher to Subject</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="label">Teacher *</label>
                <select className="input" required value={form.teacher_id}
                  onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}>
                  <option value="">— Select Teacher —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Subject *</label>
                <select className="input" required value={form.subject_id}
                  onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}>
                  <option value="">— Select Subject —</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} – {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : 'Assign'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

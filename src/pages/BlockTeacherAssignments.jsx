import { useEffect, useState, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  PlusIcon, TrashIcon, MagnifyingGlassIcon, 
  AcademicCapIcon, UserGroupIcon, BookOpenIcon
} from '@heroicons/react/24/outline'

export default function BlockTeacherAssignments() {
  const [assignments, setAssignments] = useState([])
  const [blocks, setBlocks] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [departments, setDepts] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [deptFilter, setDeptFilter] = useState('')
  const [blockFilter, setBlockFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')

  // Add modal
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ block_id: '', subject_id: '', teacher_id: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/block-assignments', {
      params: {
        department_id: deptFilter || undefined,
        block_id: blockFilter || undefined,
        subject_id: subjectFilter || undefined,
      }
    })
      .then(r => setAssignments(r.data))
      .catch(() => toast.error('Failed to load assignments'))
      .finally(() => setLoading(false))
  }, [deptFilter, blockFilter, subjectFilter])

  useEffect(() => {
    load()
    // Load filter options
    Promise.all([
      api.get('/departments'),
      api.get('/blocks', { params: { limit: 500 } }),
      api.get('/subjects', { params: { limit: 500 } }),
      api.get('/users', { params: { role: 'teacher', status: 'active', limit: 500 } })
    ]).then(([depts, blks, subjs, tchs]) => {
      setDepts(depts.data)
      setBlocks(blks.data)
      setSubjects(subjs.data)
      setTeachers(tchs.data.data || tchs.data)
    }).catch(() => {})
  }, [load])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.block_id || !form.subject_id || !form.teacher_id) {
      return toast.error('All fields are required')
    }

    setSaving(true)
    try {
      await api.post('/block-assignments', form)
      toast.success('Assignment created')
      setShowModal(false)
      setForm({ block_id: '', subject_id: '', teacher_id: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this block-subject-teacher assignment?')) return
    try {
      await api.delete(`/block-assignments/${id}`)
      toast.success('Assignment removed')
      load()
    } catch (err) {
      toast.error('Failed to remove assignment')
    }
  }

  // Group by subject for better visualization
  const groupedBySubject = assignments.reduce((acc, a) => {
    const key = `${a.subject_code} - ${a.subject_name}`
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Block-Specific Teacher Assignments</h1>
          <p className="text-gray-500 text-sm">
            Assign different teachers to the same subject for different blocks/sections
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> New Assignment
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Use Case Example:</p>
        <p>Teacher A teaches <strong>CS101</strong> to <strong>Block 3A</strong></p>
        <p>Teacher B teaches <strong>CS101</strong> to <strong>Block 3B</strong></p>
        <p className="text-xs text-blue-600 mt-2">
          Same subject, different teachers per block/section
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input w-52" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input w-44" value={blockFilter} onChange={e => setBlockFilter(e.target.value)}>
          <option value="">All Blocks</option>
          {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
        </select>
        <select className="input w-52" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
        </select>
      </div>

      {/* Assignments Grouped by Subject */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : assignments.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No assignments yet. Click "New Assignment" to create one.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBySubject).map(([subjectName, subjectAssignments]) => (
            <div key={subjectName} className="card">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <BookOpenIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-800">{subjectName}</h3>
                <span className="text-xs text-gray-500 ml-auto">
                  {subjectAssignments[0].department_name}
                </span>
              </div>
              <div className="space-y-2">
                {subjectAssignments.map(a => (
                  <div key={a.id} 
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex items-center gap-2 flex-1">
                      <UserGroupIcon className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-700">{a.block_name}</span>
                      <span className="text-xs text-gray-400">
                        {a.semester} · {a.academic_year}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <AcademicCapIcon className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{a.teacher_name}</p>
                        <p className="text-xs text-gray-500">{a.teacher_email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(a.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                      title="Remove Assignment"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">New Block-Teacher Assignment</h2>
              <p className="text-sm text-gray-500 mt-1">
                Assign a teacher to teach a subject for a specific block
              </p>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="label">Block / Section *</label>
                <select 
                  className="input" 
                  required 
                  value={form.block_id}
                  onChange={e => setForm(f => ({ ...f, block_id: e.target.value }))}
                >
                  <option value="">— Select Block —</option>
                  {blocks.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.block_name} - {b.department_name} ({b.semester} {b.academic_year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Subject *</label>
                <select 
                  className="input" 
                  required 
                  value={form.subject_id}
                  onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                >
                  <option value="">— Select Subject —</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Teacher *</label>
                <select 
                  className="input" 
                  required 
                  value={form.teacher_id}
                  onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                >
                  <option value="">— Select Teacher —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.department_name ? `(${t.department_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Creating…' : 'Create Assignment'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

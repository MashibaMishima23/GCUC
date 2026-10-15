import { useEffect, useState, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  PlusIcon, PencilIcon, MagnifyingGlassIcon, XMarkIcon,
  AcademicCapIcon, CheckCircleIcon, ClockIcon
} from '@heroicons/react/24/outline'

// Single ID field per role — no redundancy
const EMPTY_FORM = {
  id_number: '',      // maps to student_employee_id (the one unified ID field)
  name: '',
  email: '',
  password: '',
  confirm_password: '',
  year_block: '',
  is_active: 1,
}

export default function DeptStudents() {
  const { user } = useAuth()
  const [students, setStudents]   = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [periods, setPeriods]     = useState([])
  const [blocks, setBlocks]       = useState([])  // for year/block dropdown filter

  const [search, setSearch]       = useState('')
  const [yearBlock, setYearBlock] = useState('')
  const [statusF, setStatusF]     = useState('')
  const [evalFilter, setEvalFilter] = useState('')
  const [periodId, setPeriodId]   = useState('')
  const [page, setPage]           = useState(1)
  const limit = 20

  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editId, setEditId]       = useState(null)
  const [saving, setSaving]       = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/users', {
      params: {
        role: 'student',
        search: search || undefined,
        status: statusF || undefined,
        page,
        limit,
      }
    })
      .then(r => { setStudents(r.data.data); setTotal(r.data.total) })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false))
  }, [search, statusF, page])

  useEffect(() => {
    load()
    api.get('/evaluations/periods').then(r => setPeriods(r.data)).catch(() => {})
    // Load blocks for the year/block filter dropdown
    api.get('/blocks', { params: { limit: 200 } })
      .then(r => setBlocks(r.data))
      .catch(() => {})
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 400)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setModal('add') }

  const openEdit = async id => {
    try {
      const { data } = await api.get(`/users/${id}`)
      setForm({
        id_number: data.student_employee_id || data.student_id || '',
        name: data.name || '',
        email: data.email || '',
        password: '',
        confirm_password: '',
        year_block: data.year_block || '',
        is_active: data.is_active,
      })
      setEditId(id)
      setModal('edit')
    } catch { toast.error('Failed to load student') }
  }

  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setEditId(null) }

  const handleSave = async e => {
    e.preventDefault()
    if (modal === 'add' && !form.password) return toast.error('Password is required')
    if (form.password && form.password !== form.confirm_password)
      return toast.error('Passwords do not match')
    setSaving(true)
    try {
      const payload = {
        student_employee_id: form.id_number || null,
        student_id: form.id_number || null,  // keep both columns in sync
        name: form.name,
        email: form.email,
        role: 'student',
        year_block: form.year_block || null,
        is_active: form.is_active,
      }
      if (form.password) {
        payload.password = form.password
        payload.confirm_password = form.confirm_password
      }

      if (modal === 'add') {
        await api.post('/users', payload)
        toast.success('Student added')
      } else {
        await api.patch(`/users/${editId}`, payload)
        toast.success('Student updated')
      }
      closeModal()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const toggleActive = async (id, current) => {
    try {
      await api.patch(`/users/${id}`, { is_active: current ? 0 : 1 })
      toast.success('Status updated')
      load()
    } catch { toast.error('Failed') }
  }

  // Apply client-side filters for year/block and evaluation status
  const filtered = students.filter(s => {
    if (yearBlock && !(s.year_block || '').toLowerCase().includes(yearBlock.toLowerCase())) return false
    if (evalFilter === 'evaluated' && !s.has_evaluated) return false
    if (evalFilter === 'not_evaluated' && s.has_evaluated) return false
    return true
  })

  const totalPages = Math.ceil(total / limit)

  const EvalBadge = ({ s }) => {
    if (s.has_evaluated) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
          <CheckCircleIcon className="w-3 h-3" />
          Evaluated ({s.evaluations_submitted})
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
        <ClockIcon className="w-3 h-3" />
        Not Yet
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>My Students</h1>
          <p className="text-gray-500 text-sm">{total} students in your department</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search name, email, or ID…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Year/Block dropdown — populated from dept's actual blocks */}
        <select className="input w-44" value={yearBlock}
          onChange={e => setYearBlock(e.target.value)}>
          <option value="">All Blocks</option>
          {blocks.map(b => (
            <option key={b.id} value={b.block_name}>{b.block_name}</option>
          ))}
        </select>        <select className="input w-36" value={statusF}
          onChange={e => { setStatusF(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="input w-44" value={evalFilter}
          onChange={e => setEvalFilter(e.target.value)}>
          <option value="">All Evaluation Status</option>
          <option value="evaluated">Has Evaluated</option>
          <option value="not_evaluated">Not Yet Evaluated</option>
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
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">ID Number</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Year / Block</th>
                <th className="px-4 py-3 font-medium">Evaluation</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 p-1.5 rounded-full flex-shrink-0">
                        <AcademicCapIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium text-gray-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                    {s.student_employee_id || s.student_id || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.email}</td>
                  <td className="px-4 py-3 text-gray-500">{s.year_block || '—'}</td>
                  <td className="px-4 py-3">
                    <EvalBadge s={s} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s.id)}
                        className="text-primary-600 hover:text-primary-800 p-1 rounded hover:bg-primary-50"
                        title="Edit">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleActive(s.id, s.is_active)}
                        className="text-xs text-gray-500 hover:text-primary-700 hover:underline px-1">
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm">Next</button>
        </div>
      )}

      {/* Add / Edit Modal — Fix 4: single ID field, no redundancy */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">
                {modal === 'add' ? 'Add Student' : 'Edit Student'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Single unified ID field */}
                <div className="col-span-2">
                  <label className="label">Student ID Number</label>
                  <input className="input" placeholder="e.g. 2021-00123"
                    value={form.id_number} onChange={set('id_number')} />
                  <p className="text-xs text-gray-400 mt-1">Used as the student's identification number</p>
                </div>

                <div className="col-span-2">
                  <label className="label">Full Name *</label>
                  <input className="input" required value={form.name} onChange={set('name')} />
                </div>

                <div className="col-span-2">
                  <label className="label">Email Address *</label>
                  <input type="email" className="input" required value={form.email} onChange={set('email')} />
                </div>

                <div>
                  <label className="label">Year &amp; Block</label>
                  {blocks.length > 0 ? (
                    <select className="input" value={form.year_block} onChange={set('year_block')}>
                      <option value="">— Select Block —</option>
                      {blocks.map(b => (
                        <option key={b.id} value={b.block_name}>{b.block_name}</option>
                      ))}
                    </select>
                  ) : (
                    <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" readOnly
                      value="No blocks created yet" />
                  )}
                  {blocks.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">⚠ Create blocks first in the Blocks section.</p>
                  )}
                </div>

                {modal === 'edit' && (
                  <div>
                    <label className="label">Account Status</label>
                    <select className="input" value={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: parseInt(e.target.value) }))}>
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="label">
                    {modal === 'edit' ? 'New Password (leave blank to keep)' : 'Password *'}
                  </label>
                  <input type="password" className="input" required={modal === 'add'}
                    minLength={modal === 'add' ? 8 : 0}
                    value={form.password} onChange={set('password')}
                    placeholder="Min. 8 characters" />
                </div>

                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" className="input"
                    value={form.confirm_password} onChange={set('confirm_password')} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : modal === 'add' ? 'Add Student' : 'Save Changes'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { getUsers, getUser, createUser, updateUser, deleteUser, getDepartments, getBlocks } from '../lib/mockApi'
import toast from 'react-hot-toast'
import {
  PlusIcon, MagnifyingGlassIcon, PencilIcon,
  TrashIcon, CheckCircleIcon, XCircleIcon, XMarkIcon
} from '@heroicons/react/24/outline'

const ALL_ROLES = ['guidance','admin','president','vp','department_head','teacher','student','staff']
const CREATABLE_ROLES = ['president','vp','department_head','teacher','student']

const ROLE_BADGE = {
  guidance:        'bg-teal-100 text-teal-700',
  admin:           'bg-red-100 text-red-700',
  president:       'bg-purple-100 text-purple-700',
  vp:              'bg-indigo-100 text-indigo-700',
  department_head: 'bg-orange-100 text-orange-700',
  teacher:         'bg-blue-100 text-blue-700',
  student:         'bg-green-100 text-green-700',
  staff:           'bg-yellow-100 text-yellow-700',
}

const EMPTY_FORM = {
  id_number: '', name: '', email: '', password: '', confirm_password: '',
  role: 'student', department_id: '', year_block: '', is_active: 1,
}

export default function Users() {
  const [users, setUsers]       = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [departments, setDepts] = useState([])
  const [blocks, setBlocks]     = useState([])

  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [sort, setSort]             = useState('name')
  const [order, setOrder]           = useState('asc')
  const [page, setPage]             = useState(1)
  const limit = 20

  const [modal, setModal]   = useState(null)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const loadDepts = useCallback(() => {
    getDepartments().then(r => setDepts(r.data)).catch(() => {})
  }, [])

  const loadBlocks = useCallback((deptId) => {
    if (!deptId) { setBlocks([]); return }
    getBlocks({ department_id: deptId, limit: 200 })
      .then(r => setBlocks(r.data))
      .catch(() => setBlocks([]))
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    getUsers({
      role: roleFilter || undefined,
      department_id: deptFilter || undefined,
      status: statusFilter || undefined,
      search: search || undefined,
      sort, order, page, limit,
    })
      .then(r => { setUsers(r.data.data); setTotal(r.data.total) })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [roleFilter, deptFilter, statusFilter, search, sort, order, page])

  useEffect(() => { loadDepts() }, [loadDepts])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 400)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleDeptChange = e => {
    const deptId = e.target.value
    setForm(f => ({ ...f, department_id: deptId, year_block: '' }))
    loadBlocks(deptId)
  }

  const openAdd = () => { setForm(EMPTY_FORM); setBlocks([]); setEditId(null); setModal('add') }

  const openEdit = async id => {
    try {
      const { data } = await getUser(id)
      setForm({
        id_number: data.student_employee_id || data.employee_id || data.student_id || '',
        name: data.name || '', email: data.email || '',
        password: '', confirm_password: '',
        role: data.role || 'student',
        department_id: data.department_id || '',
        year_block: data.year_block || '',
        is_active: data.is_active,
      })
      if (data.department_id) loadBlocks(data.department_id)
      setEditId(id); setModal('edit')
    } catch { toast.error('Failed to load user') }
  }

  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setEditId(null) }

  const handleSave = async e => {
    e.preventDefault()
    if (modal === 'add' && !form.password) return toast.error('Password is required')
    if (form.password && form.password !== form.confirm_password) return toast.error('Passwords do not match')
    setSaving(true)
    try {
      const isStudent = form.role === 'student'
      const isStaff   = ['teacher','staff','department_head','guidance','admin'].includes(form.role)
      const payload = {
        student_employee_id: form.id_number || null,
        student_id: isStudent ? (form.id_number || null) : null,
        employee_id: isStaff  ? (form.id_number || null) : null,
        name: form.name, email: form.email, role: form.role,
        department_id: form.department_id || null,
        year_block: form.year_block || null,
        is_active: form.is_active,
      }
      if (form.password) { payload.password = form.password; payload.confirm_password = form.confirm_password }
      if (modal === 'add') { await createUser(payload); toast.success('User created') }
      else { await updateUser(editId, payload); toast.success('User updated') }
      closeModal(); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await deleteUser(deleteId); toast.success('User deactivated')
      setDeleteId(null); load()
    } catch { toast.error('Failed') }
  }

  const handleToggleActive = async (id, current) => {
    try {
      await updateUser(id, { is_active: current ? 0 : 1 }); toast.success('Status updated'); load()
    } catch { toast.error('Failed') }
  }

  const toggleSort = col => {
    if (sort === col) setOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSort(col); setOrder('asc') }
    setPage(1)
  }

  const SortIcon = ({ col }) => {
    if (sort !== col) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="text-primary-700 ml-1">{order === 'asc' ? '↑' : '↓'}</span>
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1>User Management</h1><p className="text-gray-500 text-sm">{total} total users</p></div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search name, email, or ID…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
        </select>
        <select className="input w-52" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1) }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input w-36" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('name')}>Full Name <SortIcon col="name" /></th>
                <th className="px-4 py-3 font-medium">ID Number</th>
                <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('email')}>Email <SortIcon col="email" /></th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Evaluation</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{u.student_employee_id || u.employee_id || u.student_id || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>{u.role.replace('_',' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.department_name || u.department || '—'}</td>
                  <td className="px-4 py-3">
                    {u.role === 'student' ? (
                      u.has_evaluated
                        ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✓ Evaluated ({u.evaluations_submitted})</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">⏳ Not Yet</span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u.id)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50" title="Edit"><PencilIcon className="w-4 h-4" /></button>
                      <button onClick={() => handleToggleActive(u.id, u.is_active)}
                        className={`p-1 rounded ${u.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={u.is_active ? 'Deactivate' : 'Activate'}>
                        {u.is_active ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setDeleteId(u.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm">Next</button>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">{modal === 'add' ? 'Add New User' : 'Edit User'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{['teacher','staff','department_head','guidance','admin','president','vp'].includes(form.role) ? 'Employee ID' : 'Student ID Number'}</label>
                  <input className="input" value={form.id_number} onChange={set('id_number')} placeholder="e.g. 2021-00123" />
                </div>
                <div><label className="label">Full Name *</label><input className="input" required value={form.name} onChange={set('name')} /></div>
                <div><label className="label">Email Address *</label><input type="email" className="input" required value={form.email} onChange={set('email')} /></div>
                <div>
                  <label className="label">Role *</label>
                  <select className="input" required value={form.role} onChange={set('role')}>
                    {CREATABLE_ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <select className="input" value={form.department_id} onChange={handleDeptChange}>
                    <option value="">— No Department —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                {modal === 'edit' && (
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: parseInt(e.target.value) }))}>
                      <option value={1}>Active</option><option value={0}>Inactive</option>
                    </select>
                  </div>
                )}
                {form.role === 'student' && (
                  <div>
                    <label className="label">Year &amp; Block</label>
                    {blocks.length > 0 ? (
                      <select className="input" value={form.year_block} onChange={set('year_block')}>
                        <option value="">— Select Block —</option>
                        {blocks.map(b => <option key={b.id} value={b.block_name}>{b.block_name}</option>)}
                      </select>
                    ) : (
                      <div className="input bg-gray-50 text-gray-400 text-sm">{form.department_id ? 'No blocks found' : 'Select a department first'}</div>
                    )}
                  </div>
                )}
                <div>
                  <label className="label">{modal === 'edit' ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input type="password" className="input" minLength={modal === 'add' ? 8 : 0} required={modal === 'add'} value={form.password} onChange={set('password')} placeholder="Min. 8 characters" />
                </div>
                <div><label className="label">Confirm Password</label><input type="password" className="input" value={form.confirm_password} onChange={set('confirm_password')} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : modal === 'add' ? 'Create User' : 'Save Changes'}</button>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Deactivate User?</h3>
            <p className="text-sm text-gray-500">This will deactivate the account. The user will not be able to log in.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="btn-primary bg-red-600 hover:bg-red-700">Deactivate</button>
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

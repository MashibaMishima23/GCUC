import { useEffect, useState, useCallback } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  PlusIcon, MagnifyingGlassIcon, PencilIcon,
  TrashIcon, CheckCircleIcon, XCircleIcon, XMarkIcon,
  ArrowUpTrayIcon, DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

// Roles shown in the filter bar (all roles for viewing)
const ALL_ROLES = ['guidance','admin','teacher','student']

// Roles available when CREATING a user (admin/guidance are system accounts, not creatable)
const CREATABLE_ROLES = ['department_head','teacher','student','staff']

const ROLE_BADGE = {
  guidance:        'bg-teal-100 text-teal-700',
  admin:           'bg-red-100 text-red-700',
  department_head: 'bg-orange-100 text-orange-700',
  teacher:         'bg-blue-100 text-blue-700',
  student:         'bg-green-100 text-green-700',
  staff:           'bg-yellow-100 text-yellow-700',
}

const EMPTY_FORM = {
  // Single unified ID field — replaces the redundant student_employee_id / student_id / employee_id trio
  id_number: '',
  name: '', email: '', password: '', confirm_password: '',
  role: 'student', department_id: '', year_level: '', year_block: '', is_active: 1,
}

export default function Users() {
  const { user: currentUser } = useAuth()
  const canEdit = true // All users with access to Users page can edit
  const [users, setUsers]           = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [departments, setDepts]     = useState([])
  const [blocks, setBlocks]         = useState([])  // blocks for selected department in modal

  // filters
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [sort, setSort]             = useState('name')
  const [order, setOrder]           = useState('asc')
  const [page, setPage]             = useState(1)
  const limit = 20

  // modal state
  const [modal, setModal]           = useState(null) // 'add' | 'edit'
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [editId, setEditId]         = useState(null)

  // confirm delete
  const [deleteId, setDeleteId]     = useState(null)

  // bulk import
  const [importModal, setImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  // export credentials
  const [exportModal, setExportModal] = useState(false)
  const [exportDept, setExportDept] = useState('')
  const [exporting, setExporting] = useState(false)

  const loadDepts = useCallback(() => {
    api.get('/departments').then(r => setDepts(r.data)).catch(() => {})
  }, [])

  // Load blocks whenever the selected department changes in the modal
  const loadBlocks = useCallback((deptId) => {
    if (!deptId) { setBlocks([]); return }
    api.get('/blocks', { params: { department_id: deptId, limit: 200 } })
      .then(r => setBlocks(r.data))
      .catch(() => setBlocks([]))
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    api.get('/users', {
      params: {
        role: roleFilter || undefined,
        department_id: deptFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
        sort, order, page, limit,
      }
    })
      .then(r => { setUsers(r.data.data); setTotal(r.data.total) })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [roleFilter, deptFilter, statusFilter, search, sort, order, page])

  useEffect(() => { loadDepts() }, [loadDepts])
  useEffect(() => { load() }, [load])

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 400)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // When department changes: reload blocks and clear year_block selection
  const handleDeptChange = e => {
    const deptId = e.target.value
    setForm(f => ({ ...f, department_id: deptId, year_block: '' }))
    loadBlocks(deptId)
  }

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setBlocks([])
    setEditId(null)
    setModal('add')
  }

  const openEdit = async id => {
    try {
      const { data } = await api.get(`/users/${id}`)
      setForm({
        id_number: data.student_employee_id || data.employee_id || data.student_id || '',
        name: data.name || '',
        email: data.email || '',
        password: '',
        confirm_password: '',
        role: data.role || 'student',
        department_id: data.department_id || '',
        year_level: data.year_level || '',
        year_block: data.year_block || '',
        is_active: data.is_active,
      })
      if (data.department_id) loadBlocks(data.department_id)
      setEditId(id)
      setModal('edit')
    } catch { toast.error('Failed to load user') }
  }

  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setEditId(null) }

  const handleSave = async e => {
    e.preventDefault()
    if (modal === 'add' && !form.password)
      return toast.error('Password is required')
    if (form.password && form.password !== form.confirm_password)
      return toast.error('Passwords do not match')
    setSaving(true)
    try {
      // Map unified id_number back to the correct DB columns based on role
      const isStudent = form.role === 'student'
      const isStaff   = ['teacher','staff','department_head','guidance','admin'].includes(form.role)
      const payload = {
        student_employee_id: form.id_number || null,
        student_id:          isStudent ? (form.id_number || null) : null,
        employee_id:         isStaff   ? (form.id_number || null) : null,
        name:                form.name,
        email:               form.email,
        role:                form.role,
        department_id:       form.department_id || null,
        year_level:          form.year_level || null,
        year_block:          form.year_block || null,
        is_active:           form.is_active,
      }
      if (form.password) {
        payload.password         = form.password
        payload.confirm_password = form.confirm_password
      }

      if (modal === 'add') {
        await api.post('/users', payload)
        toast.success('User created')
      } else {
        await api.patch(`/users/${editId}`, payload)
        toast.success('User updated')
      }
      closeModal()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteId}`)
      toast.success('User deactivated')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed') }
  }

  const handleToggleActive = async (id, current) => {
    try {
      await api.patch(`/users/${id}`, { is_active: current ? 0 : 1 })
      toast.success('Status updated')
      load()
    } catch { toast.error('Failed') }
  }

  const handleArchive = async (id, currentStatus) => {
    const action = currentStatus ? 'archive' : 'unarchive'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return
    
    try {
      await api.patch(`/users/${id}/archive`, { is_active: !currentStatus })
      toast.success(`User ${action}d successfully`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} user`)
    }
  }

  const handlePermanentDelete = async (id) => {
    if (!confirm('⚠️ PERMANENT DELETE\n\nThis will permanently delete the user and ALL related data (enrollments, evaluations, etc.).\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) return
    
    try {
      await api.delete(`/users/${id}/permanent`)
      toast.success('User permanently deleted')
      setDeleteId(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  // ── Bulk Import Functions ──────────────────────────────────────────────────
  const downloadTemplate = async () => {
    try {
      const response = await api.get('/imports/template', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'users_import_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Template downloaded with ALL columns (enrolled_subjects, semester, school_year, block_name)')
    } catch (err) {
      console.error('Template download error:', err)
      toast.error('Failed to download template')
    }
  }

  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)')
      return
    }
    
    setImportFile(file)
    setImportResult(null)
  }

  const handleImport = async () => {
    if (!importFile) return toast.error('Please select a file first')
    
    setImporting(true)
    setImportResult(null)
    
    const formData = new FormData()
    formData.append('file', importFile)
    
    try {
      const { data } = await api.post('/imports/users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setImportResult(data)
      toast.success(data.message || 'Import completed successfully')
      load()
      
      setTimeout(() => {
        setImportFile(null)
        if (document.getElementById('user-import-file-input')) {
          document.getElementById('user-import-file-input').value = ''
        }
      }, 5000)
      
    } catch (err) {
      const msg = err.response?.data?.message || 'Import failed'
      const hint = err.response?.data?.hint
      toast.error(msg)
      setImportResult({
        message: msg,
        hint,
        errors: err.response?.data?.errors || []
      })
    } finally {
      setImporting(false)
    }
  }

  // ── Export Credentials Functions ──────────────────────────────────────────
  const exportToExcel = async () => {
    setExporting(true)
    try {
      const { data } = await api.get('/users/export-credentials', {
        params: exportDept ? { department_id: exportDept } : {}
      })

      if (data.length === 0) {
        toast.error('No users found')
        return
      }

      // Group by department
      const byDepartment = {}
      data.forEach(user => {
        const dept = user.department_name || 'No Department'
        if (!byDepartment[dept]) byDepartment[dept] = []
        byDepartment[dept].push(user)
      })

      // Create workbook with one sheet per department
      const wb = XLSX.utils.book_new()

      Object.keys(byDepartment).sort().forEach(deptName => {
        const users = byDepartment[deptName]
        const sheetData = [
          [`${deptName.toUpperCase()} - FACULTY EVALUATION SYSTEM ACCOUNTS`],
          [],
          ['ID Number', 'Name', 'Role', 'Year Level', 'Email', 'Password', 'Login URL'],
          ...users.map(u => [
            u.id_number,
            u.name,
            u.role.replace('_', ' ').toUpperCase(),
            u.year_block || '-',
            u.email,
            u.password,
            u.login_url
          ]),
          [],
          ['INSTRUCTIONS:'],
          ['1. Login at: https://eval.gcuc.edu.ph'],
          ['2. Use your ID Number as username'],
          ['3. Default password: GCUC@2025'],
          ['4. IMPORTANT: Change your password after first login!']
        ]

        const ws = XLSX.utils.aoa_to_sheet(sheetData)
        
        // Set column widths
        ws['!cols'] = [
          { wch: 15 }, // ID
          { wch: 25 }, // Name
          { wch: 15 }, // Role
          { wch: 12 }, // Year
          { wch: 30 }, // Email
          { wch: 15 }, // Password
          { wch: 30 }  // URL
        ]

        // Add worksheet (limit sheet name to 31 chars)
        const sheetName = deptName.substring(0, 31)
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      })

      // Download
      XLSX.writeFile(wb, `User_Credentials_${new Date().toISOString().slice(0,10)}.xlsx`)
      toast.success(`Exported ${data.length} user credentials`)
      setExportModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const exportToPDF = async () => {
    setExporting(true)
    try {
      const { data } = await api.get('/users/export-credentials', {
        params: exportDept ? { department_id: exportDept } : {}
      })

      if (data.length === 0) {
        toast.error('No users found')
        return
      }

      // Group by department
      const byDepartment = {}
      data.forEach(user => {
        const dept = user.department_name || 'No Department'
        if (!byDepartment[dept]) byDepartment[dept] = []
        byDepartment[dept].push(user)
      })

      // Create HTML for printing
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>User Credentials</title>
          <style>
            @media print {
              @page { size: A4; margin: 1cm; }
              body { margin: 0; }
              .page-break { page-break-after: always; }
            }
            body { font-family: Arial, sans-serif; font-size: 11pt; }
            h1 { text-align: center; color: #1e40af; font-size: 16pt; margin-bottom: 5px; }
            h2 { text-align: center; color: #64748b; font-size: 12pt; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #1e40af; color: white; padding: 8px; text-align: left; font-size: 10pt; }
            td { border: 1px solid #e2e8f0; padding: 6px; font-size: 9pt; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .instructions { background-color: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b; margin-top: 20px; }
            .instructions h3 { margin-top: 0; color: #92400e; font-size: 11pt; }
            .instructions ol { margin: 5px 0; padding-left: 20px; color: #78350f; }
            .instructions li { margin: 3px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 9pt; }
          </style>
        </head>
        <body>
      `

      Object.keys(byDepartment).sort().forEach((deptName, index) => {
        const users = byDepartment[deptName]
        
        html += `
          <div class="${index > 0 ? 'page-break' : ''}">
            <h1>GCUC Faculty Evaluation System</h1>
            <h2>${deptName.toUpperCase()} - User Credentials</h2>
            <table>
              <thead>
                <tr>
                  <th>ID Number</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Year Level</th>
                  <th>Email</th>
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
        `

        users.forEach(u => {
          html += `
                <tr>
                  <td>${u.id_number}</td>
                  <td>${u.name}</td>
                  <td>${u.role.replace('_', ' ').toUpperCase()}</td>
                  <td>${u.year_block || '-'}</td>
                  <td>${u.email}</td>
                  <td><strong>${u.password}</strong></td>
                </tr>
          `
        })

        html += `
              </tbody>
            </table>
            <div class="instructions">
              <h3>📋 INSTRUCTIONS FOR USERS:</h3>
              <ol>
                <li><strong>Login Website:</strong> https://eval.gcuc.edu.ph</li>
                <li><strong>Username:</strong> Use your ID Number (as shown in table)</li>
                <li><strong>Password:</strong> GCUC@2025</li>
                <li><strong>IMPORTANT:</strong> Change your password immediately after logging in!</li>
              </ol>
            </div>
            <div class="footer">
              Generated on ${new Date().toLocaleDateString()} | GCUC Guidance Office<br>
              Total Users: ${users.length} | Keep this document secure and confidential
            </div>
          </div>
        `
      })

      html += `
        </body>
        </html>
      `

      // Open in new window for printing
      const printWindow = window.open('', '_blank')
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)

      toast.success(`Generated PDF for ${data.length} users`)
      setExportModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed')
    } finally {
      setExporting(false)
    }
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>User Management</h1>
          <p className="text-gray-500 text-sm">{total} total users</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => setExportModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
              <DocumentArrowDownIcon className="w-4 h-4" /> Export Credentials
            </button>
            <button onClick={() => setImportModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
              <ArrowUpTrayIcon className="w-4 h-4" /> Bulk Import
            </button>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-4 h-4" /> Add User
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search name, email, or ID…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
        </select>
        <select className="input w-52" value={deptFilter}
          onChange={e => { setDeptFilter(e.target.value); setPage(1) }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input w-36" value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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
                <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('name')}>
                  Full Name <SortIcon col="name" />
                </th>
                <th className="px-4 py-3 font-medium">ID Number</th>
                <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('email')}>
                  Email <SortIcon col="email" />
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('role')}>
                  Role <SortIcon col="role" />
                </th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                    {u.student_employee_id || u.employee_id || u.student_id || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {u.role.replace('_',' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.department_name || u.department || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(u.id)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="Edit">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {currentUser?.role === 'admin' && (
                          <>
                            <button onClick={() => handleArchive(u.id, u.is_active)}
                              className={`p-1 rounded text-xs px-2 py-1 ${u.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                              title={u.is_active ? 'Archive' : 'Unarchive'}>
                              {u.is_active ? 'Archive' : 'Unarchive'}
                            </button>
                            <button onClick={() => handlePermanentDelete(u.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                              title="Permanent Delete">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">View only</span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No users found.</td></tr>
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

      {/* Add / Edit Modal — only for guidance/admin/department_head */}
      {canEdit && modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">{modal === 'add' ? 'Add New User' : 'Edit User'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Single ID field — label adapts to role */}
                <div>
                  <label className="label">
                    {['teacher','staff','department_head','guidance','admin'].includes(form.role)
                      ? 'Employee ID'
                      : 'Student ID Number'}
                  </label>
                  <input className="input"
                    placeholder={['teacher','staff','department_head','guidance','admin'].includes(form.role)
                      ? 'e.g. EMP-001'
                      : 'e.g. 2021-00123'}
                    value={form.id_number}
                    onChange={set('id_number')} />
                </div>

                {/* Full Name */}
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" required value={form.name} onChange={set('name')} />
                </div>

                {/* Email */}
                <div>
                  <label className="label">Email Address *</label>
                  <input type="email" className="input" required value={form.email} onChange={set('email')} />
                </div>

                {/* Role — excludes admin, guidance, staff (managed separately) */}
                <div>
                  <label className="label">Role *</label>
                  <select className="input" required value={form.role} onChange={set('role')}>
                    {CREATABLE_ROLES.map(r => (
                      <option key={r} value={r}>
                        {r.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department — triggers block reload */}
                <div>
                  <label className="label">Department</label>
                  <select className="input" value={form.department_id} onChange={handleDeptChange}>
                    <option value="">— No Department —</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status (edit only) */}
                {modal === 'edit' && (
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: parseInt(e.target.value) }))}>
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                )}

                {/* Year Level & Block — students only */}
                {form.role === 'student' && (
                  <>
                    <div>
                      <label className="label">Year Level</label>
                      <select className="input" value={form.year_level} onChange={set('year_level')}>
                        <option value="">— Select Year —</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Year &amp; Block</label>
                      {blocks.length > 0 ? (
                        <select className="input" value={form.year_block} onChange={set('year_block')}>
                          <option value="">— Select Block —</option>
                          {blocks.map(b => (
                            <option key={b.id} value={b.block_name}>
                              {b.block_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="input bg-gray-50 text-gray-400 cursor-not-allowed flex items-center text-sm">
                          {form.department_id
                            ? 'No blocks found for this department'
                            : 'Select a department first'}
                        </div>
                      )}
                      {form.department_id && blocks.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠ No blocks exist yet. Ask the Department Head to create blocks first.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Password */}
                <div>
                  <label className="label">
                    {modal === 'edit' ? 'New Password (leave blank to keep)' : 'Password *'}
                  </label>
                  <input type="password" className="input"
                    minLength={modal === 'add' ? 8 : 0}
                    required={modal === 'add'}
                    value={form.password} onChange={set('password')}
                    placeholder="Min. 8 characters" />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" className="input"
                    value={form.confirm_password} onChange={set('confirm_password')}
                    placeholder="Repeat password" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : modal === 'add' ? 'Create User' : 'Save Changes'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm — only for guidance/admin/department_head */}
      {canEdit && deleteId && (
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

      {/* Bulk Import Modal */}
      {canEdit && importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">Bulk Import Users</h2>
                <p className="text-xs text-gray-400 mt-0.5">Upload an Excel file to create multiple users at once</p>
              </div>
              <button onClick={() => { setImportModal(false); setImportFile(null); setImportResult(null) }} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <DocumentArrowDownIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 text-sm">Step 1: Download Template</h3>
                    <p className="text-xs text-blue-700 mt-1">Download the Excel template with correct column format.</p>
                    <button onClick={downloadTemplate} className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 underline">Download Template (.xlsx)</button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <ArrowUpTrayIcon className="w-5 h-5 text-gray-600 flex-shrink-0 mt-3" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">Step 2: Upload Your File</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-3">Select the completed Excel file with user data.</p>
                    <input id="user-import-file-input" type="file" accept=".xlsx,.xls" onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
                    {importFile && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
                        <span className="font-medium">✓ File selected:</span><span>{importFile.name}</span><span className="text-gray-500">({(importFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 text-sm mb-2">Required Columns</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span><code className="text-gray-700">id_number</code></div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span><code className="text-gray-700">name</code></div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span><code className="text-gray-700">email</code></div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span><code className="text-gray-700">role</code></div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span><code className="text-gray-700">department</code></div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span><code className="text-gray-700">year_block</code></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block mr-1"></span>Required ·
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block ml-2 mr-1"></span>Optional
                </p>
              </div>
              {importResult && (
                <div className={`border rounded-lg p-4 ${importResult.errors?.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                  <h3 className={`font-medium text-sm mb-3 ${importResult.errors?.length > 0 ? 'text-amber-900' : 'text-green-900'}`}>Import Results</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {importResult.total_rows !== undefined && <div className="flex justify-between"><span className="text-gray-600">Total Rows:</span><span className="font-medium">{importResult.total_rows}</span></div>}
                    {importResult.users_created !== undefined && <div className="flex justify-between"><span className="text-gray-600">Users Created:</span><span className="font-medium text-green-700">{importResult.users_created}</span></div>}
                    {importResult.subjects_assigned !== undefined && importResult.subjects_assigned > 0 && <div className="flex justify-between"><span className="text-gray-600">Subjects Assigned:</span><span className="font-medium text-blue-700">{importResult.subjects_assigned}</span></div>}
                    {importResult.departments_created !== undefined && importResult.departments_created > 0 && <div className="flex justify-between"><span className="text-gray-600">Departments Created:</span><span className="font-medium text-purple-700">{importResult.departments_created}</span></div>}
                    {importResult.skipped_existing !== undefined && importResult.skipped_existing > 0 && <div className="flex justify-between"><span className="text-gray-600">Skipped (existing):</span><span className="font-medium text-gray-500">{importResult.skipped_existing}</span></div>}
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-amber-300">
                      <p className="text-xs font-medium text-amber-900 mb-2">⚠️ {importResult.errors.length} row(s) had errors:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.errors.slice(0, 10).map((err, i) => (
                          <div key={i} className="text-xs text-amber-800 bg-amber-100 rounded px-2 py-1"><span className="font-medium">Row {err.row}:</span> {err.reason}</div>
                        ))}
                        {importResult.errors.length > 10 && <p className="text-xs text-amber-700 italic">... and {importResult.errors.length - 10} more errors</p>}
                      </div>
                    </div>
                  )}
                  {importResult.hint && <p className="text-xs text-amber-700 mt-2 italic">💡 {importResult.hint}</p>}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={handleImport} disabled={!importFile || importing} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">{importing ? 'Importing...' : 'Upload & Import'}</button>
                <button type="button" onClick={() => { setImportModal(false); setImportFile(null); setImportResult(null) }} className="btn-secondary">Close</button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-medium mb-1">📋 Column Guide:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>subject_codes</strong> (optional): For teachers/dept heads, list subject codes separated by commas (e.g., "CS101,CS102,CS103")</li>
                  <li><strong>year_block</strong>: For students only (e.g., "3A", "2B")</li>
                  <li><strong>email</strong>: Optional (auto-generated if blank)</li>
                </ul>
                <p className="font-medium mt-2 mb-1">Valid Roles:</p>
                <p>student, teacher, department_head, guidance, admin, staff</p>
                <p className="font-medium mt-2 mb-1">Notes:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Default password: <code className="bg-gray-200 px-1 rounded">GCUC@2025</code></li>
                  <li>Existing users (by email/ID) are skipped but can still have subjects assigned</li>
                  <li>Subject codes must exist in the system before importing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Credentials Modal */}
      {canEdit && exportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">Export User Credentials</h2>
                <p className="text-xs text-gray-400 mt-0.5">Download account credentials for distribution</p>
              </div>
              <button onClick={() => setExportModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">📄 What will be exported:</p>
                <ul className="space-y-1 text-xs">
                  <li>• ID Number, Name, Email, Role</li>
                  <li>• Default Password: <code className="bg-blue-100 px-1 rounded font-mono">GCUC@2025</code></li>
                  <li>• Login instructions included</li>
                  <li>• Organized by department</li>
                </ul>
              </div>

              <div>
                <label className="label">Filter by Department (Optional)</label>
                <select className="input" value={exportDept} onChange={e => setExportDept(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave as "All" to export all users, or select a specific department
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <p className="font-semibold mb-1">⚠️ Security Notice:</p>
                <p>These files contain sensitive credentials. Handle securely and distribute only to authorized personnel (department heads).</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={exportToExcel} 
                  disabled={exporting} 
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  {exporting ? 'Exporting...' : 'Download Excel'}
                </button>
                <button 
                  onClick={exportToPDF} 
                  disabled={exporting} 
                  className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                  {exporting ? 'Generating...' : 'Print PDF'}
                </button>
              </div>

              <button 
                onClick={() => setExportModal(false)} 
                className="btn-secondary w-full">
                Cancel
              </button>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-medium mb-1">📋 Distribution Guide:</p>
                <ol className="space-y-0.5 list-decimal list-inside">
                  <li>Download Excel file (organized by department)</li>
                  <li>Print or distribute digitally to Department Heads</li>
                  <li>Department Heads distribute to their faculty/students</li>
                  <li>Remind users to change password after first login</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

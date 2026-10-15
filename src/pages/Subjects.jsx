import { useEffect, useState, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import * as XLSX from 'xlsx'
import {
  PlusIcon, PencilIcon, TrashIcon,
  MagnifyingGlassIcon, XMarkIcon, BookOpenIcon, UserPlusIcon,
  ArrowUpTrayIcon, DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

const SEMESTERS = ['1st', '2nd', 'summer']

const EMPTY_FORM = {
  code: '', name: '', department_id: '', semester: '1st', school_year: '',
}

export default function Subjects() {
  const { user } = useAuth()
  const [subjects, setSubjects]     = useState([])
  const [departments, setDepts]     = useState([])
  const [loading, setLoading]       = useState(true)

  // filters
  const [search, setSearch]         = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [semFilter, setSemFilter]   = useState('')

  // modal
  const [modal, setModal]           = useState(null) // 'add' | 'edit' | 'assign_teachers'
  const [form, setForm]             = useState(EMPTY_FORM)
  const [editId, setEditId]         = useState(null)
  const [saving, setSaving]         = useState(false)
  const [deleteId, setDeleteId]     = useState(null)

  // teacher assignment
  const [activeSubject, setActiveSubject] = useState(null)
  const [allTeachers, setAllTeachers] = useState([])
  const [assignedTeachers, setAssignedTeachers] = useState([])
  const [selectedTeachers, setSelectedTeachers] = useState([])

  // bulk import
  const [importModal, setImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const downloadTemplate = () => {
    const headers = ['code', 'name', 'department', 'semester', 'school_year']
    const sampleRows = [
      ['CS101', 'Introduction to Computing', 'College of Computer Studies', '1st', '2024-2025'],
      ['CS102', 'Computer Programming 1', 'College of Computer Studies', '1st', '2024-2025'],
      ['ENGR201', 'Engineering Mathematics', 'College of Engineering', '2nd', '2024-2025'],
      ['BIO101', 'General Biology', 'College of Arts and Sciences', '1st', '2024-2025'],
    ]

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Subjects Template')

    const maxWidths = headers.map((h, i) => 
      Math.max(h.length, ...sampleRows.map(r => String(r[i] || '').length)) + 2
    )
    ws['!cols'] = maxWidths.map(w => ({ wch: w }))

    XLSX.writeFile(wb, 'subjects_import_template.xlsx')
    toast.success('Template downloaded')
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
      const { data } = await api.post('/imports/subjects', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setImportResult(data)
      toast.success(data.message || 'Import completed successfully')
      load()
      
      setTimeout(() => {
        setImportFile(null)
        if (document.getElementById('subject-import-file-input')) {
          document.getElementById('subject-import-file-input').value = ''
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

  const load = useCallback(() => {
    setLoading(true)
    api.get('/subjects', {
      params: {
        department_id: deptFilter || undefined,
        semester:      semFilter  || undefined,
        search:        search     || undefined,
      }
    })
      .then(r => setSubjects(r.data))
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoading(false))
  }, [deptFilter, semFilter, search])

  useEffect(() => {
    load()
    api.get('/departments').then(r => setDepts(r.data)).catch(() => {})
  }, [load])

  // debounce search
  useEffect(() => {
    const t = setTimeout(load, 400)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setModal('add')
  }

  const openEdit = s => {
    setForm({
      code:          s.code,
      name:          s.name,
      department_id: s.department_id,
      semester:      s.semester,
      school_year:   s.school_year,
    })
    setEditId(s.id)
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setEditId(null) }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === 'add') {
        await api.post('/subjects', form)
        toast.success('Subject created')
      } else {
        await api.patch(`/subjects/${editId}`, form)
        toast.success('Subject updated')
      }
      closeModal()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/subjects/${deleteId}`)
      toast.success('Subject deleted')
      setDeleteId(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const openAssignTeachers = async (subject) => {
    setActiveSubject(subject)
    setSaving(true)
    try {
      // Fetch all active teachers
      const teachersRes = await api.get('/users', { 
        params: { role: 'teacher', status: 'active', limit: 500 } 
      })
      
      // Fetch currently assigned teachers for this subject
      const assignedRes = await api.get(`/assignments/subjects/${subject.id}/teachers`)
      
      setAllTeachers(teachersRes.data.data || teachersRes.data)
      setAssignedTeachers(assignedRes.data)
      setSelectedTeachers(assignedRes.data.map(t => t.id))
      setModal('assign_teachers')
    } catch (err) {
      toast.error('Failed to load teachers')
    } finally {
      setSaving(false)
    }
  }

  const toggleTeacher = (teacherId) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId) 
        : [...prev, teacherId]
    )
  }

  const handleSaveTeachers = async () => {
    setSaving(true)
    try {
      // Find teachers to add (in selected but not in assigned)
      const currentIds = assignedTeachers.map(t => t.id)
      const toAdd = selectedTeachers.filter(id => !currentIds.includes(id))
      
      // Find teachers to remove (in assigned but not in selected)
      const toRemove = assignedTeachers.filter(t => !selectedTeachers.includes(t.id))

      // Add new assignments
      for (const teacherId of toAdd) {
        await api.post('/assignments', {
          teacher_id: teacherId,
          subject_id: activeSubject.id
        })
      }

      // Remove unselected assignments
      for (const teacher of toRemove) {
        // Find the assignment ID
        const [assignment] = await api.get('/assignments', {
          params: { subject_id: activeSubject.id }
        })
        const assignmentToDelete = assignment.data.find(a => a.teacher_id === teacher.id)
        if (assignmentToDelete) {
          await api.delete(`/assignments/${assignmentToDelete.id}`)
        }
      }

      toast.success('Teacher assignments updated')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update assignments')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Subjects</h1>
          <p className="text-gray-500 text-sm">{subjects.length} subjects</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImportModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowUpTrayIcon className="w-4 h-4" /> Bulk Import
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search code or name…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-52" value={deptFilter}
          onChange={e => { setDeptFilter(e.target.value) }}>
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select className="input w-36" value={semFilter}
          onChange={e => setSemFilter(e.target.value)}>
          <option value="">All Semesters</option>
          {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Subject Name</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Assigned Teachers</th>
                <th className="px-4 py-3 font-medium">Enrolled</th>
                <th className="px-4 py-3 font-medium">Semester</th>
                <th className="px-4 py-3 font-medium">School Year</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subjects.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{s.code}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <BookOpenIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      {s.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.department_name}</td>
                  <td className="px-4 py-3">
                    {s.teachers ? (
                      <div className="flex flex-wrap gap-1">
                        {s.teachers.split(', ').slice(0, 3).map((teacher, i) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {teacher}
                          </span>
                        ))}
                        {s.teachers.split(', ').length > 3 && (
                          <span className="text-xs text-gray-500">+{s.teachers.split(', ').length - 3} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Not assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded inline-flex items-center gap-1 ${
                      parseInt(s.enrolled_count) > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      {s.enrolled_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.semester}</td>
                  <td className="px-4 py-3 text-gray-500">{s.school_year}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user?.role === 'admin' && (
                        <button onClick={() => openAssignTeachers(s)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded" title="Assign Teachers">
                          <UserPlusIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEdit(s)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(s.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No subjects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">
                {modal === 'add' ? 'Add Subject' : 'Edit Subject'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Subject Code *</label>
                  <input className="input" required placeholder="e.g. CS101"
                    value={form.code} onChange={set('code')} />
                </div>
                <div className="col-span-2">
                  <label className="label">Subject Name *</label>
                  <input className="input" required placeholder="e.g. Introduction to Computing"
                    value={form.name} onChange={set('name')} />
                </div>
                <div className="col-span-2">
                  <label className="label">Department *</label>
                  <select className="input" required value={form.department_id}
                    onChange={set('department_id')}>
                    <option value="">— Select Department —</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Semester *</label>
                  <select className="input" required value={form.semester}
                    onChange={set('semester')}>
                    {SEMESTERS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">School Year *</label>
                  <input className="input" required placeholder="e.g. 2024-2025"
                    value={form.school_year} onChange={set('school_year')} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : modal === 'add' ? 'Create Subject' : 'Save Changes'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teachers Modal */}
      {modal === 'assign_teachers' && activeSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">Assign Teachers</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {activeSubject.code} - {activeSubject.name}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 bg-blue-50 border-b">
              <p className="text-sm text-blue-800">
                <strong>{selectedTeachers.length}</strong> teacher(s) selected
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {allTeachers.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No teachers available</p>
              ) : (
                <div className="space-y-2">
                  {allTeachers.map(teacher => (
                    <label 
                      key={teacher.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
                    >
                      <input
                        type="checkbox"
                        className="rounded w-5 h-5 text-primary-600"
                        checked={selectedTeachers.includes(teacher.id)}
                        onChange={() => toggleTeacher(teacher.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{teacher.name}</p>
                        <p className="text-xs text-gray-500">{teacher.email}</p>
                        {teacher.department_name && (
                          <p className="text-xs text-gray-400 mt-0.5">{teacher.department_name}</p>
                        )}
                      </div>
                      {assignedTeachers.some(t => t.id === teacher.id) && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Currently Assigned
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3">
              <button 
                onClick={handleSaveTeachers} 
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving…' : 'Save Assignments'}
              </button>
              <button 
                onClick={() => setModal(null)} 
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Delete Subject?</h3>
            <p className="text-sm text-gray-500">
              This will permanently delete the subject and remove all teacher/student assignments linked to it.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="btn-primary bg-red-600 hover:bg-red-700">Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">Bulk Import Subjects</h2>
                <p className="text-xs text-gray-400 mt-0.5">Upload an Excel file to create multiple subjects at once</p>
              </div>
              <button onClick={() => { setImportModal(false); setImportFile(null); setImportResult(null) }} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">📥 How to Import:</p>
                <ol className="space-y-1 text-xs list-decimal list-inside">
                  <li>Download the Excel template below</li>
                  <li>Fill in your subject data (code, name, department, semester, school year)</li>
                  <li>Upload the completed file</li>
                  <li>Review the import results</li>
                </ol>
              </div>

              <div>
                <button 
                  onClick={downloadTemplate}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Download Template
                </button>
              </div>

              <div>
                <label className="label">Upload Excel File</label>
                <input 
                  id="subject-import-file-input"
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100
                    cursor-pointer"
                />
                {importFile && (
                  <p className="text-xs text-green-600 mt-2">✓ {importFile.name} selected</p>
                )}
              </div>

              {importResult && (
                <div className={`border rounded-lg p-4 ${importResult.errors?.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                  <h3 className={`font-medium text-sm mb-3 ${importResult.errors?.length > 0 ? 'text-amber-900' : 'text-green-900'}`}>Import Results</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {importResult.total_rows !== undefined && <div className="flex justify-between"><span className="text-gray-600">Total Rows:</span><span className="font-medium">{importResult.total_rows}</span></div>}
                    {importResult.subjects_created !== undefined && <div className="flex justify-between"><span className="text-gray-600">Subjects Created:</span><span className="font-medium text-green-700">{importResult.subjects_created}</span></div>}
                    {importResult.departments_created !== undefined && importResult.departments_created > 0 && <div className="flex justify-between"><span className="text-gray-600">Departments Created:</span><span className="font-medium text-purple-700">{importResult.departments_created}</span></div>}
                    {importResult.skipped_existing !== undefined && importResult.skipped_existing > 0 && <div className="flex justify-between"><span className="text-gray-600">Skipped (existing):</span><span className="font-medium text-gray-500">{importResult.skipped_existing}</span></div>}
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-amber-300">
                      <p className="text-xs font-medium text-amber-900 mb-2">⚠️ {importResult.errors.length} row(s) had errors:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.errors.slice(0, 10).map((err, i) => (
                          <div key={i} className="text-xs text-amber-800 bg-amber-100 rounded px-2 py-1">
                            <span className="font-medium">Row {err.row}:</span> {err.reason}
                          </div>
                        ))}
                        {importResult.errors.length > 10 && <p className="text-xs text-amber-700 italic">... and {importResult.errors.length - 10} more errors</p>}
                      </div>
                    </div>
                  )}
                  {importResult.hint && <p className="text-xs text-amber-700 mt-2 italic">💡 {importResult.hint}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={handleImport} disabled={!importFile || importing} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  {importing ? 'Importing...' : 'Upload & Import'}
                </button>
                <button type="button" onClick={() => { setImportModal(false); setImportFile(null); setImportResult(null) }} className="btn-secondary">
                  Close
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-medium mb-1">📋 Required Columns:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>code</strong> - Subject code (e.g., "CS101")</li>
                  <li><strong>name</strong> - Subject name (e.g., "Introduction to Computing")</li>
                  <li><strong>department</strong> - Department name (will be auto-created if doesn't exist)</li>
                  <li><strong>semester</strong> - "1st", "2nd", or "summer"</li>
                  <li><strong>school_year</strong> - Format: "2024-2025"</li>
                </ul>
                <p className="font-medium mt-2 mb-1">Notes:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Duplicate subjects (same code, semester, and year) are skipped</li>
                  <li>Departments are auto-created if they don't exist</li>
                  <li>Maximum file size: 10MB</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

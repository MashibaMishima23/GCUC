import { useEffect, useState, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  MagnifyingGlassIcon, PlusIcon, TrashIcon, XMarkIcon,
  UserGroupIcon, AcademicCapIcon, ArrowUpTrayIcon, DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([])
  const [subjects, setSubjects]       = useState([])
  const [blocks, setBlocks]           = useState([])
  const [students, setStudents]       = useState([])  // for enroll modal
  const [loading, setLoading]         = useState(true)

  // filters
  const [search, setSearch]       = useState('')
  const [subjectF, setSubjectF]   = useState('')
  const [semF, setSemF]           = useState('')
  const [yearF, setYearF]         = useState('')
  const [blockF, setBlockF]       = useState('')
  const [page, setPage]           = useState(1)
  const limit = 25

  // single enroll modal
  const [enrollModal, setEnrollModal] = useState(false)
  const [enrollForm, setEnrollForm]   = useState({ student_id: '', subject_id: '', school_year: '', semester: '1st' })
  const [enrolling, setEnrolling]     = useState(false)

  // bulk enroll modal
  const [bulkModal, setBulkModal]       = useState(false)
  const [bulkForm, setBulkForm]         = useState({ block_id: '', subject_ids: [], school_year: '', semester: '1st' })
  const [bulkLoading, setBulkLoading]   = useState(false)

  // bulk import modal
  const [importModal, setImportModal]   = useState(false)
  const [importFile, setImportFile]     = useState(null)
  const [importing, setImporting]       = useState(false)
  const [importResult, setImportResult] = useState(null)

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/enrollments', {
      params: {
        search:     search     || undefined,
        subject_id: subjectF   || undefined,
        semester:   semF       || undefined,
        school_year: yearF     || undefined,
        block_id:   blockF     || undefined,
        page, limit,
      }
    })
      .then(r => setEnrollments(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load enrollments'))
      .finally(() => setLoading(false))
  }, [search, subjectF, semF, yearF, blockF, page])

  useEffect(() => {
    load()
    api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {})
    api.get('/blocks').then(r => setBlocks(r.data)).catch(() => {})
  }, [load])

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 400)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  // load students when enroll modal opens
  const openEnrollModal = () => {
    api.get('/users', { params: { role: 'student', limit: 500 } })
      .then(r => setStudents(r.data.data || []))
      .catch(() => {})
    setEnrollForm({ student_id: '', subject_id: '', school_year: '', semester: '1st' })
    setEnrollModal(true)
  }

  const handleEnroll = async e => {
    e.preventDefault()
    const { student_id, subject_id, school_year, semester } = enrollForm
    if (!student_id || !subject_id || !school_year || !semester)
      return toast.error('All fields are required')
    setEnrolling(true)
    try {
      await api.post('/enrollments', { student_id: parseInt(student_id), subject_id: parseInt(subject_id), school_year, semester })
      toast.success('Student enrolled successfully')
      setEnrollModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed')
    } finally { setEnrolling(false) }
  }

  const handleBulkEnroll = async e => {
    e.preventDefault()
    const { block_id, subject_ids, school_year, semester } = bulkForm
    if (!block_id || !subject_ids.length || !school_year || !semester)
      return toast.error('Select a block, at least one subject, school year, and semester')
    setBulkLoading(true)
    try {
      const r = await api.post('/enrollments/bulk-block', {
        block_id: parseInt(block_id),
        subject_ids: subject_ids.map(Number),
        school_year,
        semester,
      })
      toast.success(r.data.message)
      setBulkModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk enrollment failed')
    } finally { setBulkLoading(false) }
  }

  const handleUnenroll = async () => {
    if (!deleteTarget) return
    try {
      await api.delete('/enrollments', {
        data: {
          student_id:  deleteTarget.student_id,
          subject_id:  deleteTarget.subject_id,
          school_year: deleteTarget.school_year,
          semester:    deleteTarget.semester,
        }
      })
      toast.success('Student unenrolled')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const toggleSubject = id => {
    setBulkForm(f => ({
      ...f,
      subject_ids: f.subject_ids.includes(id)
        ? f.subject_ids.filter(x => x !== id)
        : [...f.subject_ids, id],
    }))
  }

  // ── Download Excel template ───────────────────────────────────────────────
  const downloadTemplate = () => {
    const headers = [
      'student_id', 'student_name', 'year_block', 'department',
      'subject_code', 'subject_name', 'teacher_employee_id', 'teacher_name',
      'semester', 'school_year'
    ]
    const sampleRows = [
      ['2021-00001', 'Juan Dela Cruz', '3A', 'College of Computer Studies', 'CS301', 'Data Structures', 'EMP-1001', 'Prof. Maria Santos', '1st', '2024-2025'],
      ['2021-00001', 'Juan Dela Cruz', '3A', 'College of Computer Studies', 'CS302', 'Algorithms', 'EMP-1002', 'Prof. Jose Garcia', '1st', '2024-2025'],
      ['2021-00002', 'Maria Clara', '3A', 'College of Computer Studies', 'CS301', 'Data Structures', 'EMP-1001', 'Prof. Maria Santos', '1st', '2024-2025'],
    ]

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Enrollment Template')

    // Auto-width columns
    const maxWidths = headers.map((h, i) => 
      Math.max(h.length, ...sampleRows.map(r => String(r[i] || '').length)) + 2
    )
    ws['!cols'] = maxWidths.map(w => ({ wch: w }))

    XLSX.writeFile(wb, 'enrollment_import_template.xlsx')
    toast.success('Template downloaded')
  }

  // ── Handle file upload ────────────────────────────────────────────────────
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

  // ── Upload and import ─────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!importFile) return toast.error('Please select a file first')
    
    setImporting(true)
    setImportResult(null)
    
    const formData = new FormData()
    formData.append('file', importFile)
    
    try {
      const { data } = await api.post('/imports/enrollment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setImportResult(data)
      toast.success(data.message || 'Import completed successfully')
      load() // Refresh enrollments list
      
      // Clear file after 5 seconds if successful
      setTimeout(() => {
        setImportFile(null)
        if (document.getElementById('import-file-input')) {
          document.getElementById('import-file-input').value = ''
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

  const setE = k => e => setEnrollForm(f => ({ ...f, [k]: e.target.value }))
  const setB = k => e => setBulkForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Enrollment Management</h1>
          <p className="text-gray-500 text-sm">{enrollments.length} enrollment records shown</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setBulkModal(true)}
            className="btn-secondary flex items-center gap-2 text-sm">
            <UserGroupIcon className="w-4 h-4" /> Bulk Enroll by Block
          </button>
          <button onClick={openEnrollModal}
            className="btn-primary flex items-center gap-2 text-sm">
            <PlusIcon className="w-4 h-4" /> Enroll Student
          </button>
        </div>
      </div>


      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative col-span-1 sm:col-span-2">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search student name or ID…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" value={subjectF} onChange={e => { setSubjectF(e.target.value); setPage(1) }}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.code} – {s.name}</option>)}
        </select>
        <select className="input" value={semF} onChange={e => { setSemF(e.target.value); setPage(1) }}>
          <option value="">All Semesters</option>
          <option value="1st">1st</option>
          <option value="2nd">2nd</option>
          <option value="summer">Summer</option>
        </select>
        <input className="input" placeholder="School Year (e.g. 2024-2025)"
          value={yearF} onChange={e => { setYearF(e.target.value); setPage(1) }} />
        <select className="input" value={blockF} onChange={e => { setBlockF(e.target.value); setPage(1) }}>
          <option value="">All Blocks</option>
          {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
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
                <th className="px-4 py-3 font-medium">Student ID</th>
                <th className="px-4 py-3 font-medium">Year / Block</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Semester</th>
                <th className="px-4 py-3 font-medium">School Year</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrollments.map((e, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 p-1.5 rounded-full flex-shrink-0">
                        <AcademicCapIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium text-gray-800">{e.student_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                    {e.student_employee_id || e.student_no || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{e.year_block || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{e.subject_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{e.subject_code}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{e.semester}</td>
                  <td className="px-4 py-3 text-gray-500">{e.school_year}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteTarget({
                        student_id:  e.student_id,
                        subject_id:  e.subject_id,
                        school_year: e.school_year,
                        semester:    e.semester,
                        student_name: e.student_name,
                        subject_name: e.subject_name,
                      })}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      title="Unenroll">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No enrollment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {enrollments.length === limit && (
        <div className="flex items-center gap-2 justify-center">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm">Next</button>
        </div>
      )}

      {/* ── Single Enroll Modal ─────────────────────────────────────────── */}
      {enrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">Enroll Student in Subject</h2>
                <p className="text-xs text-gray-400 mt-0.5">For irregular students or individual subject enrollment</p>
              </div>
              <button onClick={() => setEnrollModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEnroll} className="p-6 space-y-4">
              <div>
                <label className="label">Student *</label>
                <select className="input" required value={enrollForm.student_id} onChange={setE('student_id')}>
                  <option value="">— Select Student —</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.student_employee_id ? `(${s.student_employee_id})` : ''} {s.year_block ? `· ${s.year_block}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Subject *</label>
                <select className="input" required value={enrollForm.subject_id} onChange={setE('subject_id')}>
                  <option value="">— Select Subject —</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} — {s.name} ({s.semester} / {s.school_year})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">School Year *</label>
                  <input className="input" placeholder="e.g. 2024-2025" required
                    value={enrollForm.school_year} onChange={setE('school_year')} />
                </div>
                <div>
                  <label className="label">Semester *</label>
                  <select className="input" required value={enrollForm.semester} onChange={setE('semester')}>
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="summer">Summer</option>
                  </select>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                💡 After enrolling, if the subject has a teacher assigned, this student will see that teacher in their evaluation form.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={enrolling} className="btn-primary">
                  {enrolling ? 'Enrolling…' : 'Enroll Student'}
                </button>
                <button type="button" onClick={() => setEnrollModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bulk Enroll Modal ───────────────────────────────────────────── */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">Bulk Enroll by Block</h2>
                <p className="text-xs text-gray-400 mt-0.5">Enrolls all students in a block into selected subjects at once</p>
              </div>
              <button onClick={() => setBulkModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBulkEnroll} className="p-6 space-y-4">
              <div>
                <label className="label">Block / Section *</label>
                <select className="input" required value={bulkForm.block_id} onChange={setB('block_id')}>
                  <option value="">— Select Block —</option>
                  {blocks.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.block_name} · {b.student_count} students
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">School Year *</label>
                  <input className="input" placeholder="e.g. 2024-2025" required
                    value={bulkForm.school_year} onChange={setB('school_year')} />
                </div>
                <div>
                  <label className="label">Semester *</label>
                  <select className="input" required value={bulkForm.semester} onChange={setB('semester')}>
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="summer">Summer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Subjects to Enroll In * <span className="text-xs text-gray-400 font-normal">(select all that apply)</span></label>
                <div className="border border-gray-300 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                  {subjects.length === 0 ? (
                    <p className="p-3 text-sm text-gray-400">No subjects available.</p>
                  ) : subjects.map(s => (
                    <label key={s.id}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${
                        bulkForm.subject_ids.includes(s.id) ? 'bg-primary-50' : 'hover:bg-gray-50'
                      }`}>
                      <input type="checkbox" className="rounded"
                        checked={bulkForm.subject_ids.includes(s.id)}
                        onChange={() => toggleSubject(s.id)} />
                      <div>
                        <span className="font-medium text-sm text-gray-800">{s.name}</span>
                        <span className="text-xs text-gray-400 ml-2 font-mono">{s.code}</span>
                        <span className="text-xs text-gray-400 ml-1">· {s.semester} / {s.school_year}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {bulkForm.subject_ids.length > 0 && (
                  <p className="text-xs text-primary-700 mt-1">{bulkForm.subject_ids.length} subject(s) selected</p>
                )}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                ⚠️ This will enroll <strong>all students in the selected block</strong> into the chosen subjects.
                Students already enrolled will be skipped (no duplicates).
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={bulkLoading} className="btn-primary">
                  {bulkLoading ? 'Enrolling…' : 'Bulk Enroll'}
                </button>
                <button type="button" onClick={() => setBulkModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bulk Import Modal ────────────────────────────────────────────── */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">Bulk Import Student Enrollments</h2>
                <p className="text-xs text-gray-400 mt-0.5">Upload an Excel file to automatically enroll multiple students</p>
              </div>
              <button onClick={() => { setImportModal(false); setImportFile(null); setImportResult(null) }}
                className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Step 1: Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <DocumentArrowDownIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 text-sm">Step 1: Download Template</h3>
                    <p className="text-xs text-blue-700 mt-1">
                      Download the Excel template with the correct column format. Fill it with your student enrollment data.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 underline">
                      Download Template (.xlsx)
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Upload File */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <ArrowUpTrayIcon className="w-5 h-5 text-gray-600 flex-shrink-0 mt-3" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">Step 2: Upload Your File</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-3">
                      Select the completed Excel file. Each row should represent one student enrolled in one subject.
                    </p>
                    <input
                      id="import-file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0 file:text-sm file:font-medium
                        file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100
                        cursor-pointer"
                    />
                    {importFile && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
                        <span className="font-medium">✓ File selected:</span>
                        <span>{importFile.name}</span>
                        <span className="text-gray-500">({(importFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expected Columns */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 text-sm mb-2">Required Columns</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <code className="text-gray-700">student_id</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <code className="text-gray-700">student_name</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    <code className="text-gray-700">year_block</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    <code className="text-gray-700">department</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <code className="text-gray-700">subject_code</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    <code className="text-gray-700">subject_name</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    <code className="text-gray-700">teacher_employee_id</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    <code className="text-gray-700">teacher_name</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <code className="text-gray-700">semester</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <code className="text-gray-700">school_year</code>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block mr-1"></span>
                  Required fields ·
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block ml-2 mr-1"></span>
                  Optional (but recommended)
                </p>
              </div>

              {/* Import Results */}
              {importResult && (
                <div className={`border rounded-lg p-4 ${
                  importResult.errors?.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
                }`}>
                  <h3 className={`font-medium text-sm mb-3 ${
                    importResult.errors?.length > 0 ? 'text-amber-900' : 'text-green-900'
                  }`}>
                    Import Results
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {importResult.total_rows !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Rows:</span>
                        <span className="font-medium">{importResult.total_rows}</span>
                      </div>
                    )}
                    {importResult.departments_created !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Departments Created:</span>
                        <span className="font-medium text-green-700">{importResult.departments_created}</span>
                      </div>
                    )}
                    {importResult.students_created !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Students Created:</span>
                        <span className="font-medium text-green-700">{importResult.students_created}</span>
                      </div>
                    )}
                    {importResult.teachers_created !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Teachers Created:</span>
                        <span className="font-medium text-green-700">{importResult.teachers_created}</span>
                      </div>
                    )}
                    {importResult.subjects_created !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subjects Created:</span>
                        <span className="font-medium text-green-700">{importResult.subjects_created}</span>
                      </div>
                    )}
                    {importResult.assignments_created !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Teacher Assignments:</span>
                        <span className="font-medium text-green-700">{importResult.assignments_created}</span>
                      </div>
                    )}
                    {importResult.enrollments_created !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Enrollments Created:</span>
                        <span className="font-medium text-blue-700">{importResult.enrollments_created}</span>
                      </div>
                    )}
                    {importResult.skipped_duplicates !== undefined && importResult.skipped_duplicates > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duplicates Skipped:</span>
                        <span className="font-medium text-gray-500">{importResult.skipped_duplicates}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Automatic Matching Summary */}
                  {importResult.summary && (
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <div className="flex items-start gap-2 text-xs bg-green-100 border border-green-300 rounded-lg p-3">
                        <span className="text-green-700 text-lg">🎯</span>
                        <div className="flex-1">
                          <p className="font-medium text-green-900 mb-1">Automatic Subject Matching</p>
                          <p className="text-green-800">{importResult.summary}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-amber-300">
                      <p className="text-xs font-medium text-amber-900 mb-2">
                        ⚠️ {importResult.errors.length} row(s) had errors:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.errors.slice(0, 10).map((err, i) => (
                          <div key={i} className="text-xs text-amber-800 bg-amber-100 rounded px-2 py-1">
                            <span className="font-medium">Row {err.row}:</span> {err.reason}
                          </div>
                        ))}
                        {importResult.errors.length > 10 && (
                          <p className="text-xs text-amber-700 italic">
                            ... and {importResult.errors.length - 10} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {importResult.hint && (
                    <p className="text-xs text-amber-700 mt-2 italic">💡 {importResult.hint}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  {importing ? 'Importing...' : 'Upload & Import'}
                </button>
                <button
                  type="button"
                  onClick={() => { setImportModal(false); setImportFile(null); setImportResult(null) }}
                  className="btn-secondary">
                  Close
                </button>
              </div>

              {/* Help Text */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Each row = one student enrolled in one subject with one teacher</li>
                  <li>A student with 5 subjects should appear on 5 rows</li>
                  <li><strong className="text-primary-700">🎯 Automatic matching:</strong> Students are automatically matched to teachers through their shared subjects</li>
                  <li>Missing students/teachers/departments are auto-created with password: <code className="bg-gray-200 px-1 rounded">GCUC@2025</code></li>
                  <li>Duplicate enrollments are automatically skipped</li>
                  <li>Column names are flexible (e.g., "Student ID" or "student_no" both work)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Unenroll Confirm ────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Unenroll Student?</h3>
            <p className="text-sm text-gray-600">
              This will remove <strong>{deleteTarget.student_name}</strong> from{' '}
              <strong>{deleteTarget.subject_name}</strong> ({deleteTarget.semester} / {deleteTarget.school_year}).
            </p>
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              ⚠️ If this student already submitted an evaluation for this subject's teacher, that evaluation is kept.
              Only future evaluations will be affected.
            </p>
            <div className="flex gap-3">
              <button onClick={handleUnenroll} className="btn-primary bg-red-600 hover:bg-red-700">Unenroll</button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

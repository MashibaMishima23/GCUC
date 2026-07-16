import { useEffect, useState, useCallback } from 'react'
import { getEnrollments, getSubjects, getBlocks, getUsers, enrollStudent, bulkEnrollBlock, unenrollStudent } from '../lib/mockApi'
import toast from 'react-hot-toast'
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, XMarkIcon, UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([])
  const [subjects, setSubjects]       = useState([])
  const [blocks, setBlocks]           = useState([])
  const [students, setStudents]       = useState([])
  const [loading, setLoading]         = useState(true)

  const [search, setSearch]   = useState('')
  const [subjectF, setSubjectF] = useState('')
  const [semF, setSemF]         = useState('')
  const [yearF, setYearF]       = useState('')
  const [blockF, setBlockF]     = useState('')
  const [page, setPage]         = useState(1)
  const limit = 25

  const [enrollModal, setEnrollModal] = useState(false)
  const [enrollForm, setEnrollForm]   = useState({ student_id: '', subject_id: '', school_year: '', semester: '1st' })
  const [enrolling, setEnrolling]     = useState(false)

  const [bulkModal, setBulkModal]     = useState(false)
  const [bulkForm, setBulkForm]       = useState({ block_id: '', subject_ids: [], school_year: '', semester: '1st' })
  const [bulkLoading, setBulkLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getEnrollments({ search: search || undefined, subject_id: subjectF || undefined, semester: semF || undefined, school_year: yearF || undefined, block_id: blockF || undefined, page, limit })
      .then(r => setEnrollments(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load enrollments'))
      .finally(() => setLoading(false))
  }, [search, subjectF, semF, yearF, blockF, page])

  useEffect(() => {
    load()
    getSubjects({}).then(r => setSubjects(r.data)).catch(() => {})
    getBlocks({}).then(r => setBlocks(r.data)).catch(() => {})
  }, [load])

  useEffect(() => { const t = setTimeout(() => { setPage(1); load() }, 400); return () => clearTimeout(t) }, [search]) // eslint-disable-line

  const openEnrollModal = () => {
    getUsers({ role: 'student', limit: 500 }).then(r => setStudents(r.data.data || [])).catch(() => {})
    setEnrollForm({ student_id: '', subject_id: '', school_year: '', semester: '1st' })
    setEnrollModal(true)
  }

  const handleEnroll = async e => {
    e.preventDefault()
    const { student_id, subject_id, school_year, semester } = enrollForm
    if (!student_id || !subject_id || !school_year || !semester) return toast.error('All fields are required')
    setEnrolling(true)
    try {
      await enrollStudent({ student_id: parseInt(student_id), subject_id: parseInt(subject_id), school_year, semester })
      toast.success('Student enrolled successfully'); setEnrollModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Enrollment failed') }
    finally { setEnrolling(false) }
  }

  const handleBulkEnroll = async e => {
    e.preventDefault()
    const { block_id, subject_ids, school_year, semester } = bulkForm
    if (!block_id || !subject_ids.length || !school_year || !semester) return toast.error('Select a block, at least one subject, school year, and semester')
    setBulkLoading(true)
    try {
      const r = await bulkEnrollBlock({ block_id: parseInt(block_id), subject_ids: subject_ids.map(Number), school_year, semester })
      toast.success(r.data.message); setBulkModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Bulk enrollment failed') }
    finally { setBulkLoading(false) }
  }

  const handleUnenroll = async () => {
    if (!deleteTarget) return
    try {
      await unenrollStudent({ student_id: deleteTarget.student_id, subject_id: deleteTarget.subject_id, school_year: deleteTarget.school_year, semester: deleteTarget.semester })
      toast.success('Student unenrolled'); setDeleteTarget(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const toggleSubject = id => setBulkForm(f => ({
    ...f, subject_ids: f.subject_ids.includes(id) ? f.subject_ids.filter(x => x !== id) : [...f.subject_ids, id]
  }))

  const setE = k => e => setEnrollForm(f => ({ ...f, [k]: e.target.value }))
  const setB = k => e => setBulkForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1>Enrollment Management</h1><p className="text-gray-500 text-sm">{enrollments.length} enrollment records shown</p></div>
        <div className="flex gap-2">
          <button onClick={() => setBulkModal(true)} className="btn-secondary flex items-center gap-2 text-sm"><UserGroupIcon className="w-4 h-4" /> Bulk Enroll by Block</button>
          <button onClick={openEnrollModal} className="btn-primary flex items-center gap-2 text-sm"><PlusIcon className="w-4 h-4" /> Enroll Student</button>
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-sm text-primary-800">
        <p className="font-semibold mb-0.5">📋 How subject matching works</p>
        <p className="text-xs text-primary-700">
          Students only see teachers to evaluate if they are enrolled in that teacher's subject.
          <strong> Regular students</strong> — use Bulk Enroll by Block.
          <strong> Irregular students</strong> — use Enroll Student individually.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative col-span-1 sm:col-span-2">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search student name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" value={subjectF} onChange={e => { setSubjectF(e.target.value); setPage(1) }}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.code} – {s.name}</option>)}
        </select>
        <select className="input" value={semF} onChange={e => { setSemF(e.target.value); setPage(1) }}>
          <option value="">All Semesters</option>
          <option value="1st">1st</option><option value="2nd">2nd</option><option value="summer">Summer</option>
        </select>
        <input className="input" placeholder="School Year (e.g. 2024-2025)" value={yearF} onChange={e => { setYearF(e.target.value); setPage(1) }} />
        <select className="input" value={blockF} onChange={e => { setBlockF(e.target.value); setPage(1) }}>
          <option value="">All Blocks</option>
          {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading…</div> : (
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
                      <div className="bg-green-100 p-1.5 rounded-full flex-shrink-0"><AcademicCapIcon className="w-4 h-4 text-green-600" /></div>
                      <span className="font-medium text-gray-800">{e.student_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{e.student_employee_id || e.student_no || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{e.year_block || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{e.subject_name}</td>
                  <td className="px-4 py-3"><span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{e.subject_code}</span></td>
                  <td className="px-4 py-3 text-gray-500">{e.semester}</td>
                  <td className="px-4 py-3 text-gray-500">{e.school_year}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDeleteTarget({ student_id: e.student_id, subject_id: e.subject_id, school_year: e.school_year, semester: e.semester, student_name: e.student_name, subject_name: e.subject_name })}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {enrollments.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">No enrollment records found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {enrollments.length === limit && (
        <div className="flex items-center gap-2 justify-center">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm">Next</button>
        </div>
      )}

      {/* Single Enroll Modal */}
      {enrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <div><h2 className="text-lg font-semibold">Enroll Student in Subject</h2><p className="text-xs text-gray-400 mt-0.5">For irregular students or individual enrollment</p></div>
              <button onClick={() => setEnrollModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEnroll} className="p-6 space-y-4">
              <div>
                <label className="label">Student *</label>
                <select className="input" required value={enrollForm.student_id} onChange={setE('student_id')}>
                  <option value="">— Select Student —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.student_employee_id ? `(${s.student_employee_id})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subject *</label>
                <select className="input" required value={enrollForm.subject_id} onChange={setE('subject_id')}>
                  <option value="">— Select Subject —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name} ({s.semester} / {s.school_year})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">School Year *</label><input className="input" placeholder="e.g. 2024-2025" required value={enrollForm.school_year} onChange={setE('school_year')} /></div>
                <div>
                  <label className="label">Semester *</label>
                  <select className="input" required value={enrollForm.semester} onChange={setE('semester')}>
                    <option value="1st">1st Semester</option><option value="2nd">2nd Semester</option><option value="summer">Summer</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={enrolling} className="btn-primary">{enrolling ? 'Enrolling…' : 'Enroll Student'}</button>
                <button type="button" onClick={() => setEnrollModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Enroll Modal */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div><h2 className="text-lg font-semibold">Bulk Enroll by Block</h2><p className="text-xs text-gray-400 mt-0.5">Enrolls all students in a block into selected subjects</p></div>
              <button onClick={() => setBulkModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleBulkEnroll} className="p-6 space-y-4">
              <div>
                <label className="label">Block / Section *</label>
                <select className="input" required value={bulkForm.block_id} onChange={setB('block_id')}>
                  <option value="">— Select Block —</option>
                  {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name} · {b.student_count} students</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">School Year *</label><input className="input" placeholder="e.g. 2024-2025" required value={bulkForm.school_year} onChange={setB('school_year')} /></div>
                <div>
                  <label className="label">Semester *</label>
                  <select className="input" required value={bulkForm.semester} onChange={setB('semester')}>
                    <option value="1st">1st Semester</option><option value="2nd">2nd Semester</option><option value="summer">Summer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Subjects to Enroll In * <span className="text-xs text-gray-400 font-normal">(select all that apply)</span></label>
                <div className="border border-gray-300 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                  {subjects.map(s => (
                    <label key={s.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${bulkForm.subject_ids.includes(s.id) ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                      <input type="checkbox" className="rounded" checked={bulkForm.subject_ids.includes(s.id)} onChange={() => toggleSubject(s.id)} />
                      <div>
                        <span className="font-medium text-sm text-gray-800">{s.name}</span>
                        <span className="text-xs text-gray-400 ml-2 font-mono">{s.code}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {bulkForm.subject_ids.length > 0 && <p className="text-xs text-primary-700 mt-1">{bulkForm.subject_ids.length} subject(s) selected</p>}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                ⚠️ This will enroll <strong>all students in the selected block</strong> into the chosen subjects. Students already enrolled will be skipped.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={bulkLoading} className="btn-primary">{bulkLoading ? 'Enrolling…' : 'Bulk Enroll'}</button>
                <button type="button" onClick={() => setBulkModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unenroll Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Unenroll Student?</h3>
            <p className="text-sm text-gray-600">This will remove <strong>{deleteTarget.student_name}</strong> from <strong>{deleteTarget.subject_name}</strong> ({deleteTarget.semester} / {deleteTarget.school_year}).</p>
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

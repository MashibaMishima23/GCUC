import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { PlusIcon, ChartBarIcon, CalendarIcon, ClockIcon, UserGroupIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'

function StatBox({ label, value, sub, color }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="text-xs mt-0.5 opacity-70">{sub}</p>}
    </div>
  )
}

function ProgressRow({ label, evaluated, total, color = 'bg-primary-500' }) {
  const pct = total > 0 ? Math.round((evaluated / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 font-medium truncate max-w-xs">{label}</span>
        <span className="text-gray-500 ml-2 flex-shrink-0">{evaluated}/{total} <span className="text-xs">({pct}%)</span></span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function EvaluationPeriods() {
  const { can, user } = useAuth()
  const [periods, setPeriods]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [questionnaires, setQ]      = useState([])
  const [editingPeriod, setEditingPeriod] = useState(null)
  const [form, setForm]             = useState({ questionnaire_id:'', school_year:'2025-2026', start_date:'', end_date:'' })
  const [submitting, setSubmitting] = useState(false)

  const [selectedPeriod, setSelectedPeriod]   = useState(null)
  const [teachers, setTeachers]               = useState([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [scheduleError, setScheduleError]     = useState(null)

  const [progressPeriod, setProgressPeriod]       = useState(null)
  const [progress, setProgress]                   = useState(null)
  const [loadingProgress, setLoadingProgress]     = useState(false)

  const [schedulePeriod, setSchedulePeriod]       = useState(null)
  const [schedules, setSchedules]                 = useState([])
  const [loadingSchedules, setLoadingSchedules]   = useState(false)
  const [departments, setDepartments]             = useState([])
  const [editingSchedule, setEditingSchedule]     = useState(null)
  const [scheduleForm, setScheduleForm]           = useState({ start_date: '', end_date: '' })

  const [statusPeriod, setStatusPeriod]           = useState(null)
  const [teacherStatus, setTeacherStatus]         = useState(null)
  const [loadingStatus, setLoadingStatus]         = useState(false)

  const load = () => {
    setLoading(true)
    // Filter periods by user role:
    // - Students only see student-type evaluation periods
    // - Teachers only see peer-type evaluation periods
    // - Guidance/admin/staff see all periods
    const params = {}
    if (user?.role === 'student') {
      params.evaluator_type = 'student'
    } else if (user?.role === 'teacher') {
      params.evaluator_type = 'peer'
    }
    
    api.get('/evaluations/periods', { params })
      .then(r => setPeriods(r.data))
      .catch(err => {
        console.error('Failed to load periods:', err)
        toast.error('Failed to load evaluation periods')
        setPeriods([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    if (can('guidance','admin','staff')) {
      api.get('/questionnaires', { params: { status: 'fully_approved' } }).then(r => setQ(r.data))
      api.get('/departments').then(r => setDepartments(r.data))
    }
  }, [])

  const openEditForm = (period) => {
    setEditingPeriod(period)
    setForm({
      questionnaire_id: period.questionnaire_id || '',
      school_year: period.school_year || '',
      start_date: period.start_date?.slice(0, 10) || '',
      end_date: period.end_date?.slice(0, 10) || ''
    })
    setShowForm(true)
  }

  const updatePeriod = async e => {
    e.preventDefault()
    if (!editingPeriod) return
    
    setSubmitting(true)
    try {
      await api.put(`/evaluations/periods/${editingPeriod.id}`, form)
      toast.success('Period updated successfully! Schedules auto-regenerated.')
      setShowForm(false)
      setEditingPeriod(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally { setSubmitting(false) }
  }

  const openPeriod = async (period) => {
    setSelectedPeriod(period)
    setLoadingTeachers(true)
    setScheduleError(null)
    try {
      const r = await api.get(`/evaluations/periods/${period.id}/teachers`)
      setTeachers(r.data)
    } catch (err) {
      setTeachers([])
      if (err.response?.data?.schedule_required || err.response?.data?.not_yet_started || err.response?.data?.already_ended) {
        setScheduleError(err.response.data)
      } else {
        toast.error(err.response?.data?.message || 'Failed to load teachers')
      }
    } finally { setLoadingTeachers(false) }
  }

  const openSchedules = async (period) => {
    setSchedulePeriod(period)
    setLoadingSchedules(true)
    try {
      const r = await api.get(`/evaluations/periods/${period.id}/schedules`)
      setSchedules(r.data)
    } catch { setSchedules([]) } finally { setLoadingSchedules(false) }
  }

  const togglePeriodStatus = async (period) => {
    try {
      const action = period.is_active ? 'close' : 'open'
      if (!confirm(`Are you sure you want to ${action} this evaluation period?`)) return
      
      await api.patch(`/evaluations/periods/${period.id}/toggle`)
      toast.success(`Period ${action}ed successfully`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${period.is_active ? 'close' : 'open'} period`)
    }
  }

  const editSchedule = (schedule) => {
    setEditingSchedule(schedule)
    setScheduleForm({
      start_date: schedule.start_date?.slice(0, 10) || '',
      end_date: schedule.end_date?.slice(0, 10) || ''
    })
  }

  const saveSchedule = async () => {
    if (!editingSchedule || !scheduleForm.start_date || !scheduleForm.end_date) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      await api.put(
        `/evaluations/periods/${schedulePeriod.id}/schedules/${editingSchedule.id}`,
        scheduleForm
      )
      toast.success('Schedule updated')
      setEditingSchedule(null)
      openSchedules(schedulePeriod)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update schedule')
    }
  }

  const openProgress = async (period) => {
    setProgressPeriod(period)
    setLoadingProgress(true)
    try {
      const r = await api.get(`/evaluations/periods/${period.id}/progress`)
      setProgress(r.data)
    } catch { setProgress(null) } finally { setLoadingProgress(false) }
  }

  const openTeacherStatus = async (period) => {
    setStatusPeriod(period)
    setLoadingStatus(true)
    try {
      const r = await api.get(`/evaluations/periods/${period.id}/status`)
      setTeacherStatus(r.data)
    } catch (err) {
      toast.error('Failed to load teacher status')
      setTeacherStatus(null)
    } finally { setLoadingStatus(false) }
  }

  const today = new Date().toISOString().slice(0, 10)
  const isActive = p => p.is_active && p.start_date?.slice(0,10) <= today && p.end_date?.slice(0,10) >= today

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Evaluation Periods</h1>
          <p className="text-gray-500 text-sm">Three fixed periods: 1st Semester, 2nd Semester, and Summer</p>
        </div>
      </div>

      {showForm && can('guidance','admin') && editingPeriod && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2>Update {editingPeriod.title}</h2>
              <p className="text-sm text-gray-500">{editingPeriod.semester} Semester</p>
            </div>
            <button onClick={() => { setShowForm(false); setEditingPeriod(null) }} 
              className="text-gray-400 hover:text-gray-600">
              <span className="text-2xl">×</span>
            </button>
          </div>
          <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
            ℹ️ When you update dates, the system will automatically regenerate schedules based on current departments.
          </div>
          <form onSubmit={updatePeriod} className="space-y-4">
            <div>
              <label className="label">Approved Questionnaire *</label>
              <select className="input" value={form.questionnaire_id} onChange={e => setForm(f => ({ ...f, questionnaire_id: e.target.value }))} required>
                <option value="">Select questionnaire...</option>
                {questionnaires.map(q => <option key={q.id} value={q.id}>{q.title} ({q.evaluator_type})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">School Year *</label>
                <input className="input" value={form.school_year} 
                  onChange={e => setForm(f => ({ ...f, school_year: e.target.value }))} 
                  placeholder="2025-2026" required />
              </div>
              <div>
                <label className="label">Start Date *</label>
                <input type="date" className="input" value={form.start_date} 
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
              </div>
              <div>
                <label className="label">End Date *</label>
                <input type="date" className="input" value={form.end_date} 
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Updating...' : 'Update Period & Regenerate Schedules'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingPeriod(null) }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : periods.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">No evaluation periods found.</div>
      ) : (
        <div className="space-y-3">
          {periods.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3>{p.title}</h3>
                    {isActive(p)
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">● Active</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{p.questionnaire_title} · {p.semester} · S.Y. {p.school_year}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.start_date?.slice(0,10)} → {p.end_date?.slice(0,10)}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.evaluator_type === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {p.evaluator_type === 'student' ? '🎓 Student Evaluations' : '👥 Peer Evaluations'}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {can('guidance','admin') && (
                    <>
                      <button onClick={() => openEditForm(p)}
                        className="btn-secondary flex items-center gap-1.5 text-sm">
                        <CalendarIcon className="w-4 h-4" /> Update Period
                      </button>
                      <button onClick={() => openSchedules(p)}
                        className="btn-secondary flex items-center gap-1.5 text-sm">
                        <CalendarIcon className="w-4 h-4" /> View Schedule
                      </button>
                    </>
                  )}
                  {can('admin') && (
                    <button 
                      onClick={() => togglePeriodStatus(p)}
                      className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium transition ${
                        p.is_active 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}>
                      <ClockIcon className="w-4 h-4" /> {p.is_active ? 'Close Period' : 'Open Period'}
                    </button>
                  )}
                  {can('guidance','admin','staff') && (
                    <>
                      <button onClick={() => openProgress(p)}
                        className="btn-secondary flex items-center gap-1.5 text-sm">
                        <ChartBarIcon className="w-4 h-4" /> Progress
                      </button>
                      <button onClick={() => openTeacherStatus(p)}
                        className="btn-secondary flex items-center gap-1.5 text-sm">
                        <UserGroupIcon className="w-4 h-4" /> Teacher Status
                      </button>
                    </>
                  )}
                  {/* Evaluate button — students/teachers only, NOT guidance/admin */}
                  {isActive(p) && can('student','teacher','staff') && (() => {
                    if (user.role === 'teacher' && p.evaluator_type === 'student') return null
                    return (
                      <button onClick={() => openPeriod(p)} className="btn-primary text-sm">
                        {p.evaluator_type === 'student' ? 'Evaluate Teachers' : 'Peer Evaluation'}
                      </button>
                    )
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher selection modal */}
      {selectedPeriod && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2>Select a Teacher to Evaluate</h2>
              <button onClick={() => setSelectedPeriod(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <p className="text-sm text-gray-500">{selectedPeriod.title}</p>
            {scheduleError ? (
              <div className="text-center py-8 space-y-3">
                <div className="text-5xl">⏰</div>
                <p className="text-gray-700 font-semibold">Evaluation Not Available</p>
                <p className="text-gray-500 text-sm">
                  The evaluation period is either not yet started or has already ended.
                </p>
                <p className="text-gray-400 text-xs">
                  Period: {selectedPeriod.start_date?.slice(0,10)} to {selectedPeriod.end_date?.slice(0,10)}
                </p>
              </div>
            ) : loadingTeachers ? (
              <div className="text-center py-8 text-gray-400">Loading teachers...</div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-gray-500 font-medium">No teachers to evaluate</p>
                {user.role === 'student' && (
                  <p className="text-gray-400 text-sm">
                    You only evaluate teachers assigned to subjects you are enrolled in
                    for this semester and school year. If you see this, check with your
                    department head that your enrollments are set up correctly.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {user.role === 'student' && (
                  <p className="text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-2">
                    🎓 Showing only teachers for your enrolled subjects this semester.
                  </p>
                )}
                {teachers.map(t => (
                  <div key={`${t.id}-${t.subject_id || 'peer'}`}
                    className={`flex items-center justify-between p-3 border rounded-lg ${t.already_evaluated ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50 border-gray-200'}`}>
                    <div>
                      <p className="font-medium text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.department}</p>
                      {t.subject_name && <p className="text-xs text-blue-600">{t.subject_code} – {t.subject_name}</p>}
                    </div>
                    {t.already_evaluated ? (
                      <span className="text-xs text-green-600 font-medium">✓ Done</span>
                    ) : (
                      <Link
                        to={`/evaluate/${selectedPeriod.id}/${t.id}${t.subject_id ? `?subject=${t.subject_id}` : ''}`}
                        onClick={() => setSelectedPeriod(null)}
                        className="btn-primary text-sm">
                        Evaluate
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress modal */}
      {progressPeriod && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
              <div>
                <h2 className="font-bold text-gray-800">📊 Evaluation Progress</h2>
                <p className="text-sm text-gray-500 mt-0.5">{progressPeriod.title}</p>
              </div>
              <button onClick={() => { setProgressPeriod(null); setProgress(null) }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-6">
              {loadingProgress ? (
                <div className="text-center py-10 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
                  <p className="text-sm">Loading progress data…</p>
                </div>
              ) : !progress ? (
                <p className="text-center py-10 text-gray-400">No progress data available.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatBox label="Total Students" value={progress.total_students} color="bg-primary-50 text-primary-800" />
                    <StatBox label="Evaluated" value={progress.evaluated}
                      sub={`${progress.total_students > 0 ? Math.round(progress.evaluated / progress.total_students * 100) : 0}% complete`}
                      color="bg-green-50 text-green-800" />
                    <StatBox label="Not Yet" value={progress.not_yet} sub="pending" color="bg-amber-50 text-amber-800" />
                    <StatBox label="Submissions" value={progress.total_submissions} sub="total forms" color="bg-blue-50 text-blue-800" />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">Overall Completion</p>
                      <p className="text-sm font-bold text-primary-700">
                        {progress.total_students > 0 ? Math.round(progress.evaluated / progress.total_students * 100) : 0}%
                      </p>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-700"
                        style={{ width: `${progress.total_students > 0 ? Math.round(progress.evaluated / progress.total_students * 100) : 0}%` }} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-500 inline-block" /> {progress.evaluated} evaluated</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> {progress.not_yet} remaining</span>
                    </div>
                  </div>

                  {progress.by_department?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Evaluated vs. Total — by Department</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={progress.by_department} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="evaluated" name="Evaluated" fill="#1d4ed8" radius={[4,4,0,0]} />
                          <Bar dataKey="total" name="Total" fill="#e2e8f0" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {progress.by_teacher?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Progress per Teacher</p>
                      <div className="space-y-3">
                        {progress.by_teacher.map((t, i) => (
                          <ProgressRow key={i}
                            label={`${t.name} — ${t.subject}`}
                            evaluated={t.evaluated}
                            total={t.total}
                            color={t.total > 0 && t.evaluated / t.total >= 0.8 ? 'bg-green-500' : t.total > 0 && t.evaluated / t.total >= 0.5 ? 'bg-primary-500' : 'bg-amber-400'}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {progress.daily_trend?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Daily Submission Trend</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={progress.daily_trend} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip labelFormatter={l => `Date: ${l}`} />
                          <Line type="monotone" dataKey="count" name="Submissions" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule modal (READ-ONLY) */}
      {schedulePeriod && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">📅 Evaluation Schedule</h2>
                <p className="text-sm text-gray-500 mt-1">{schedulePeriod.title}</p>
              </div>
              <button onClick={() => { setSchedulePeriod(null); setSchedules([]) }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-4">
              {loadingSchedules ? (
                <div className="text-center py-10 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
                  <p className="text-sm">Loading schedules…</p>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No evaluation schedules found for this period.</p>
                  <p className="text-sm mt-1">The system automatically assigns evaluation windows.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {schedules.map(s => {
                      const deptName = departments.find(d => d.id === s.department_id)?.name || 'All Departments'
                      const isEditing = editingSchedule?.id === s.id
                      
                      return (
                        <div key={s.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="font-semibold text-gray-800 mb-2">{deptName}</div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="label">Start Date</label>
                                  <input 
                                    type="date" 
                                    className="input"
                                    value={scheduleForm.start_date}
                                    onChange={e => setScheduleForm(f => ({ ...f, start_date: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <label className="label">End Date</label>
                                  <input 
                                    type="date" 
                                    className="input"
                                    value={scheduleForm.end_date}
                                    onChange={e => setScheduleForm(f => ({ ...f, end_date: e.target.value }))}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={saveSchedule} className="btn-primary text-sm">Save Changes</button>
                                <button 
                                  onClick={() => setEditingSchedule(null)} 
                                  className="btn-secondary text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="mb-1">
                                  <span className="font-semibold text-gray-800">{deptName}</span>
                                </div>
                                {s.year_level && (
                                  <p className="text-sm text-gray-600">Year Level: {s.year_level}</p>
                                )}
                                <p className="text-sm text-gray-500 mt-1">
                                  📅 {s.start_date?.slice(0,10)} → {s.end_date?.slice(0,10)}
                                </p>
                              </div>
                              {can('admin') && (
                                <button 
                                  onClick={() => editSchedule(s)}
                                  className="btn-secondary text-sm ml-2"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-medium mb-1">ℹ️ About {can('admin') ? 'Schedules' : 'Automatic Schedules'}</p>
                    <p className="text-blue-700">
                      {can('admin') 
                        ? 'As admin, you can edit evaluation schedules to adjust the dates for different departments and year levels.'
                        : 'The system automatically creates evaluation windows for different departments and year levels to distribute the evaluation workload evenly across the evaluation period.'
                      }
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Status modal */}
      {statusPeriod && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-bold text-gray-800">👥 Teacher Evaluation Status</h2>
                <p className="text-sm text-gray-500 mt-0.5">{statusPeriod.title}</p>
              </div>
              <button onClick={() => { setStatusPeriod(null); setTeacherStatus(null) }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-6">
              {loadingStatus ? (
                <div className="text-center py-10 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
                  <p className="text-sm">Loading teacher status…</p>
                </div>
              ) : !teacherStatus ? (
                <p className="text-center py-10 text-gray-400">Failed to load teacher status.</p>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                    <p className="font-medium text-blue-800 mb-1">
                      {teacherStatus.evaluator_type === 'student' ? '🎓 Student Evaluation Type' : '👥 Peer Evaluation Type'}
                    </p>
                    <p className="text-blue-700">
                      {teacherStatus.evaluator_type === 'student' 
                        ? 'Shows which teachers have been evaluated by their students for this period.'
                        : 'Shows which teachers have been evaluated by their peers for this period.'
                      }
                    </p>
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-2xl font-bold text-green-700">
                        {teacherStatus.teachers?.filter(t => t.status === 'completed').length || 0}
                      </p>
                      <p className="text-xs font-medium text-green-600">Completed</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-2xl font-bold text-amber-700">
                        {teacherStatus.teachers?.filter(t => t.status === 'in_progress').length || 0}
                      </p>
                      <p className="text-xs font-medium text-amber-600">In Progress</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <p className="text-2xl font-bold text-red-700">
                        {teacherStatus.teachers?.filter(t => t.status === 'not_evaluated').length || 0}
                      </p>
                      <p className="text-xs font-medium text-red-600">Not Evaluated</p>
                    </div>
                  </div>

                  {/* Teacher list */}
                  <div className="space-y-2">
                    {teacherStatus.teachers?.length === 0 ? (
                      <p className="text-center py-8 text-gray-400">No teachers found</p>
                    ) : (
                      teacherStatus.teachers?.map(teacher => (
                        <div key={teacher.id} 
                          className={`border rounded-lg p-4 ${
                            teacher.status === 'completed' ? 'bg-green-50 border-green-200' :
                            teacher.status === 'in_progress' ? 'bg-amber-50 border-amber-200' :
                            'bg-red-50 border-red-200'
                          }`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-800">{teacher.name}</h3>
                                {teacher.status === 'completed' ? (
                                  <span className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                    <CheckCircleIcon className="w-3 h-3" /> Completed
                                  </span>
                                ) : teacher.status === 'in_progress' ? (
                                  <span className="flex items-center gap-1 text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full">
                                    ⏳ In Progress
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                                    <XCircleIcon className="w-3 h-3" /> Not Evaluated
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {teacher.department_name || teacher.department || 'No Department'}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-gray-600">
                                  <span className="font-medium text-gray-800">{teacher.received_evaluations}</span> / {teacher.expected_evaluations} evaluations
                                </span>
                                <span className="text-gray-600">
                                  {teacher.completion_percentage}% complete
                                </span>
                                {teacher.avg_score && (
                                  <span className="text-gray-600">
                                    Avg: <span className="font-medium text-gray-800">{teacher.avg_score}</span>/5.0
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-32">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${
                                    teacher.status === 'completed' ? 'bg-green-600' :
                                    teacher.status === 'in_progress' ? 'bg-amber-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${teacher.completion_percentage}%` }}
                                />
                              </div>
                              <p className="text-xs text-center text-gray-500 mt-1">
                                {teacher.completion_percentage}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

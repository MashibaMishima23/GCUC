import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getEvaluationPeriods, getQuestionnaires, createEvaluationPeriod, getPeriodTeachers
} from '../lib/mockApi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function EvaluationPeriods() {
  const { can, user } = useAuth()
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [questionnaires, setQuestionnaires] = useState([])
  const [form, setForm] = useState({ questionnaire_id:'', title:'', semester:'1st', school_year:'2025-2026', start_date:'', end_date:'' })
  const [submitting, setSubmitting] = useState(false)

  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)

  const load = () => {
    setLoading(true)
    getEvaluationPeriods().then(r => setPeriods(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    if (can('guidance','admin','staff')) {
      getQuestionnaires({ status: 'fully_approved' }).then(r => setQuestionnaires(r.data))
    }
  }, [])

  const createPeriod = async e => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createEvaluationPeriod(form)
      toast.success('Evaluation period created')
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSubmitting(false) }
  }

  const openPeriod = async (period) => {
    setSelectedPeriod(period)
    setLoadingTeachers(true)
    try {
      const r = await getPeriodTeachers(period.id)
      setTeachers(r.data)
    } catch { setTeachers([]) } finally { setLoadingTeachers(false) }
  }

  const today = new Date().toISOString().slice(0, 10)
  // A period is active if is_active=1 AND today falls within start→end (or end_date is in the future)
  const isActive = p => p.is_active === 1 && p.start_date?.slice(0,10) <= today && p.end_date?.slice(0,10) >= today

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Evaluation Periods</h1>
          <p className="text-gray-500 text-sm">Active and past evaluation periods</p>
        </div>
        {can('guidance','admin') && (
          <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> New Period
          </button>
        )}
      </div>

      {showForm && can('guidance','admin') && (
        <div className="card space-y-4">
          <h2>Create New Evaluation Period</h2>
          <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            ⚠️ Only questionnaires that have been <strong>approved</strong> by the President/VP can be used.
          </p>
          <form onSubmit={createPeriod} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" placeholder="e.g. 1st Semester 2025-2026 Student Evaluation"
                value={form.title} onChange={set('title')} required />
            </div>
            <div>
              <label className="label">Approved Questionnaire *</label>
              <select className="input" value={form.questionnaire_id} onChange={set('questionnaire_id')} required>
                <option value="">Select questionnaire...</option>
                {questionnaires.map(q => (
                  <option key={q.id} value={q.id}>{q.title} ({q.evaluator_type})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Semester</label>
                <select className="input" value={form.semester} onChange={set('semester')}>
                  <option value="1st">1st Semester</option>
                  <option value="2nd">2nd Semester</option>
                  <option value="summer">Summer</option>
                </select>
              </div>
              <div>
                <label className="label">School Year</label>
                <input className="input" value={form.school_year} onChange={set('school_year')} required />
              </div>
              <div>
                <label className="label">Start Date</label>
                <input type="date" className="input" value={form.start_date} onChange={set('start_date')} required />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input" value={form.end_date} onChange={set('end_date')} required />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating...' : 'Create Period'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
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
                  <div className="flex items-center gap-2">
                    <h3>{p.title}</h3>
                    {isActive(p)
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">● Active</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                    }
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {p.questionnaire_title} · {p.semester} · S.Y. {p.school_year}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.start_date?.slice(0,10)} → {p.end_date?.slice(0,10)}
                  </p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.evaluator_type === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {p.evaluator_type === 'student' ? '🎓 Student Evaluations' : '👥 Peer Evaluations'}
                  </span>
                </div>
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
          ))}
        </div>
      )}

      {selectedPeriod && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2>Select a Teacher to Evaluate</h2>
              <button onClick={() => setSelectedPeriod(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <p className="text-sm text-gray-500">{selectedPeriod.title}</p>
            {loadingTeachers ? (
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
    </div>
  )
}

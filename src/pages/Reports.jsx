import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getReports, getEvaluationPeriods, getUsers, getDepartments,
  generateIndividualReport, generateDepartmentReport, getMyReports
} from '../lib/mockApi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { SparklesIcon } from '@heroicons/react/24/outline'

export default function Reports() {
  const { can } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState([])
  const [teachers, setTeachers] = useState([])
  const [departments, setDepartments] = useState([])
  const [genModal, setGenModal] = useState(null)
  const [genForm, setGenForm] = useState({ period_id: '', teacher_id: '', department_id: '' })
  const [generating, setGenerating] = useState(false)

  const load = () => {
    setLoading(true)
    getReports().then(r => setReports(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    getEvaluationPeriods().then(r => setPeriods(r.data))
    getUsers({ role: 'teacher' }).then(r => setTeachers(r.data.data || []))
    getDepartments().then(r => setDepartments(r.data))
  }, [])

  const generate = async () => {
    setGenerating(true)
    try {
      const payload = genModal.type === 'individual'
        ? { period_id: parseInt(genForm.period_id), teacher_id: parseInt(genForm.teacher_id) }
        : { period_id: parseInt(genForm.period_id), department_id: parseInt(genForm.department_id) }

      if (genModal.type === 'individual') {
        await generateIndividualReport(payload)
      } else {
        await generateDepartmentReport(payload)
      }
      toast.success('Report generated successfully!')
      setGenModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed')
    } finally { setGenerating(false) }
  }

  const set = k => e => setGenForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Narrative Reports</h1>
          <p className="text-gray-500 text-sm">AI-generated evaluation reports per faculty and department</p>
        </div>
        {can('guidance','admin','staff','president','vp') && (
          <div className="flex gap-2">
            <button onClick={() => setGenModal({ type: 'individual' })} className="btn-primary flex items-center gap-2 text-sm">
              <SparklesIcon className="w-4 h-4" /> Individual Report
            </button>
            <button onClick={() => setGenModal({ type: 'department' })} className="btn-secondary flex items-center gap-2 text-sm">
              <SparklesIcon className="w-4 h-4" /> Department Report
            </button>
          </div>
        )}
      </div>

      {can('teacher') && <TeacherReports />}

      {can('guidance','admin','staff','president','vp') && (
        loading ? (
          <div className="text-center py-12 text-gray-400">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="card text-center py-12">
            <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reports generated yet.</p>
            <p className="text-gray-400 text-sm mt-1">Use the buttons above to generate AI-powered narrative reports.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="card flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.report_type === 'individual' ? 'bg-primary-100 text-primary-700' : 'bg-primary-700 text-white'
                    }`}>
                      {r.report_type}
                    </span>
                    <p className="font-semibold text-gray-800">
                      {r.report_type === 'individual' ? r.teacher_name : r.department_name}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{r.period_title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Avg: <strong>{parseFloat(r.average_score || 0).toFixed(2)}/5.00</strong> · {r.total_evaluations} evaluations · Generated {r.generated_at?.slice(0,10)}
                  </p>
                </div>
                <Link to={`/reports/${r.id}`} className="btn-secondary text-sm">View Report</Link>
              </div>
            ))}
          </div>
        )
      )}

      {genModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-primary-600" />
              Generate {genModal.type === 'individual' ? 'Individual Faculty' : 'Department'} Report
            </h2>
            <p className="text-sm text-gray-500">
              The AI will analyze evaluation data and generate a comprehensive narrative report.
            </p>
            <div>
              <label className="label">Evaluation Period *</label>
              <select className="input" value={genForm.period_id} onChange={set('period_id')} required>
                <option value="">Select period...</option>
                {periods.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            {genModal.type === 'individual' ? (
              <div>
                <label className="label">Teacher *</label>
                <select className="input" value={genForm.teacher_id} onChange={set('teacher_id')} required>
                  <option value="">Select teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.department})</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="label">Department *</label>
                <select className="input" value={genForm.department_id} onChange={set('department_id')} required>
                  <option value="">Select department...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              🎭 Demo mode: Report will be generated with sample AI narrative data.
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setGenModal(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={generate}
                disabled={generating || !genForm.period_id || (genModal.type === 'individual' ? !genForm.teacher_id : !genForm.department_id)}
                className="btn-primary flex items-center gap-2">
                {generating ? (
                  <><span className="animate-spin">⚙</span> Generating...</>
                ) : (
                  <><SparklesIcon className="w-4 h-4" /> Generate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TeacherReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyReports().then(r => setReports(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-4 text-gray-400 text-sm">Loading your reports...</div>
  if (reports.length === 0)
    return <div className="card text-center py-8 text-gray-400">No reports available for you yet.</div>

  return (
    <div className="space-y-3">
      <h2>My Performance Reports</h2>
      {reports.map(r => (
        <div key={r.id} className="card flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-semibold text-gray-800">{r.period_title}</p>
            <p className="text-sm text-gray-500">{r.semester} · S.Y. {r.school_year}</p>
            <p className="text-xs text-gray-400">Avg: <strong>{parseFloat(r.average_score || 0).toFixed(2)}/5.00</strong> · Generated {r.generated_at?.slice(0,10)}</p>
          </div>
          <Link to={`/reports/${r.id}`} className="btn-secondary text-sm">View Report</Link>
        </div>
      ))}
    </div>
  )
}

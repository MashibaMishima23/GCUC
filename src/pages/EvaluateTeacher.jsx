import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function EvaluateTeacher() {
  const { periodId, teacherId } = useParams()
  const [searchParams] = useSearchParams()
  const subjectId = searchParams.get('subject')
  const navigate = useNavigate()

  const [period, setPeriod] = useState(null)
  const [teacher, setTeacher] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/evaluations/periods`),
      api.get(`/users`).catch(() => ({ data: { data: [] } })),
    ]).then(async ([periodsRes]) => {
      const p = periodsRes.data.find(x => x.id == periodId)
      if (!p) { toast.error('Period not found'); navigate('/periods'); return }
      setPeriod(p)

      const qRes = await api.get(`/questionnaires/${p.questionnaire_id}`)
      setQuestions(qRes.data.questions || [])

      // Get teacher info
      try {
        const uRes = await api.get('/users', { params: { role: 'teacher' } })
        const t = uRes.data.data?.find(x => x.id == teacherId)
        setTeacher(t)
      } catch {}
    }).finally(() => setLoading(false))
  }, [periodId, teacherId])

  const setAnswer = (qId, field, value) => {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], question_id: qId, [field]: value } }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const answerList = Object.values(answers)

    // Validate all rating questions answered
    const missing = questions.filter(q => q.type === 'rating' && !answers[q.id]?.rating_value)
    if (missing.length) return toast.error(`Please answer all ${missing.length} rating question(s)`)

    setSubmitting(true)
    try {
      await api.post('/evaluations/submit', {
        period_id: parseInt(periodId),
        teacher_id: parseInt(teacherId),
        subject_id: subjectId ? parseInt(subjectId) : null,
        answers: answerList,
      })
      toast.success('Evaluation submitted successfully!')
      navigate('/periods')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading evaluation form...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card bg-primary-50 border-primary-200">
        <h1 className="text-primary-800">Teacher Evaluation Form</h1>
        <p className="text-primary-600 text-sm mt-1">{period?.title}</p>
        {teacher && (
          <div className="mt-3 pt-3 border-t border-primary-200">
            <p className="font-semibold text-gray-800">Evaluating: {teacher.name}</p>
            <p className="text-sm text-gray-500">{teacher.department}</p>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2">Your responses are anonymous and confidential.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="card space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{q.text}</p>
                {q.category && <p className="text-xs text-gray-400 mt-0.5">{q.category}</p>}
              </div>
            </div>

            {q.type === 'rating' ? (
              <div>
                <p className="text-sm text-gray-500 mb-2">Rate from 1 (Poor) to 5 (Excellent)</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} type="button"
                      onClick={() => setAnswer(q.id, 'rating_value', v)}
                      className={`w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all ${
                        answers[q.id]?.rating_value === v
                          ? 'bg-primary-600 border-primary-600 text-white shadow-md scale-105'
                          : 'border-gray-300 text-gray-600 hover:border-primary-400 hover:bg-primary-50'
                      }`}>
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                  <span>Poor</span><span>Fair</span><span>Good</span><span>Very Good</span><span>Excellent</span>
                </div>
              </div>
            ) : (
              <textarea
                className="input"
                rows={3}
                placeholder="Share your feedback (optional)..."
                value={answers[q.id]?.open_text || ''}
                onChange={e => setAnswer(q.id, 'open_text', e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </button>
          <button type="button" onClick={() => navigate('/periods')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  getEvaluationPeriods, getQuestionnaire, getUsers, submitEvaluation
} from '../lib/mockApi'
import toast from 'react-hot-toast'
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' }
const RATING_COLORS = {
  1: { active: 'bg-red-500 border-red-500 text-white',    hover: 'hover:border-red-400 hover:bg-red-50 hover:text-red-600' },
  2: { active: 'bg-orange-400 border-orange-400 text-white', hover: 'hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600' },
  3: { active: 'bg-yellow-400 border-yellow-400 text-white', hover: 'hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-600' },
  4: { active: 'bg-blue-500 border-blue-500 text-white',  hover: 'hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600' },
  5: { active: 'bg-green-500 border-green-500 text-white', hover: 'hover:border-green-400 hover:bg-green-50 hover:text-green-600' },
}

function RatingInput({ qId, value, onChange }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map(v => {
          const col = RATING_COLORS[v]
          const isSelected = value === v
          return (
            <button key={v} type="button"
              onClick={() => onChange(v)}
              className={`
                relative flex flex-col items-center justify-center
                w-16 h-16 rounded-2xl border-2 font-bold text-xl
                transition-all duration-150 select-none
                ${isSelected ? col.active + ' shadow-lg scale-110 ring-2 ring-offset-2 ring-current' : 'border-gray-200 text-gray-500 bg-white ' + col.hover}
              `}>
              {v}
              {isSelected && (
                <span className="absolute -top-1.5 -right-1.5 text-xs">
                  {v === 5 ? '⭐' : v === 4 ? '👍' : v === 3 ? '😐' : v === 2 ? '👎' : '❌'}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map(v => (
          <span key={v}
            className={`text-xs px-2 py-0.5 rounded-full transition-all ${value === v ? RATING_COLORS[v].active : 'text-gray-400'}`}
            style={{ width: '4rem', textAlign: 'center' }}>
            {RATING_LABELS[v]}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProgressBar({ answered, total }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{answered} of {total} questions answered</span>
        <span className="font-medium text-primary-700">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function EvaluateTeacher() {
  const { periodId, teacherId } = useParams()
  const [searchParams] = useSearchParams()
  const subjectId = searchParams.get('subject')
  const navigate = useNavigate()

  const [period, setPeriod]     = useState(null)
  const [teacher, setTeacher]   = useState(null)
  const [subject, setSubject]   = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers]   = useState({})
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getEvaluationPeriods().then(async periodsRes => {
      const p = periodsRes.data.find(x => x.id == periodId)
      if (!p) { toast.error('Period not found'); navigate('/periods'); return }
      setPeriod(p)

      const qRes = await getQuestionnaire(p.questionnaire_id)
      setQuestions(qRes.data.questions || [])

      try {
        const uRes = await getUsers({ role: 'teacher' })
        const t = uRes.data.data?.find(x => x.id == teacherId)
        setTeacher(t)
      } catch {}

      // Try to find subject name from the period teachers data
      if (subjectId) {
        try {
          const { getPeriodTeachers } = await import('../lib/mockApi')
          const tRes = await getPeriodTeachers(p.id)
          const entry = tRes.data.find(t => t.subject_id == subjectId)
          if (entry) setSubject({ name: entry.subject_name, code: entry.subject_code })
        } catch {}
      }
    }).finally(() => setLoading(false))
  }, [periodId, teacherId, subjectId])

  const setAnswer = (qId, field, value) => {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], question_id: qId, [field]: value } }))
  }

  const ratingQuestions = questions.filter(q => q.type === 'rating')
  const answeredCount   = ratingQuestions.filter(q => answers[q.id]?.rating_value).length
  const allRatingsAnswered = answeredCount === ratingQuestions.length && ratingQuestions.length > 0

  const handleSubmit = async e => {
    e.preventDefault()
    const missing = ratingQuestions.filter(q => !answers[q.id]?.rating_value)
    if (missing.length) {
      toast.error(`Please answer all ${missing.length} rating question(s) before submitting.`)
      // Scroll to first unanswered question
      const el = document.getElementById(`question-${missing[0].id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    try {
      await submitEvaluation({
        period_id:  parseInt(periodId),
        teacher_id: parseInt(teacherId),
        subject_id: subjectId ? parseInt(subjectId) : null,
        answers:    Object.values(answers),
      })
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-400">Loading evaluation form…</p>
      </div>
    )
  }

  // ── Success screen ───────────────────────────────────────────────────
  if (submitted) {
    const avgScore = ratingQuestions.length > 0
      ? (ratingQuestions.reduce((sum, q) => sum + (answers[q.id]?.rating_value || 0), 0) / ratingQuestions.length).toFixed(2)
      : null

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card text-center py-10 space-y-4">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircleIcon className="w-14 h-14 text-green-600" />
            </div>
          </div>
          <div>
            <h1 className="text-green-700">Evaluation Submitted!</h1>
            <p className="text-gray-500 mt-1">Thank you for completing your evaluation.</p>
          </div>

          {avgScore && (
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 inline-block mx-auto">
              <p className="text-xs text-gray-500 uppercase font-medium tracking-wide mb-1">Your Average Rating</p>
              <p className="text-5xl font-bold text-primary-700">{avgScore}</p>
              <p className="text-sm text-gray-400 mt-0.5">out of 5.00</p>
              <div className="flex justify-center gap-0.5 mt-2">
                {[1,2,3,4,5].map(v => (
                  v <= Math.round(parseFloat(avgScore))
                    ? <StarSolid key={v} className="w-5 h-5 text-amber-400" />
                    : <StarIcon key={v} className="w-5 h-5 text-gray-300" />
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Teacher evaluated</span>
              <span className="font-medium text-gray-800">{teacher?.name || '—'}</span>
            </div>
            {subject && (
              <div className="flex justify-between">
                <span className="text-gray-500">Subject</span>
                <span className="font-medium text-gray-800">{subject.code} – {subject.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Period</span>
              <span className="font-medium text-gray-800">{period?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Questions answered</span>
              <span className="font-medium text-gray-800">{questions.length}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400">Your responses are anonymous and confidential.</p>

          <div className="flex gap-3 justify-center pt-2">
            <button onClick={() => navigate('/periods')} className="btn-primary">
              ← Back to Evaluations
            </button>
            <Link to="/" className="btn-secondary">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Evaluation Form ──────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-5">

      {/* Header card */}
      <div className="card bg-gradient-to-br from-primary-700 to-primary-800 text-white border-0 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-xl flex-shrink-0">
            <StarSolid className="w-7 h-7 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-xl font-bold">Teacher Evaluation Form</h1>
            <p className="text-primary-200 text-sm mt-0.5">{period?.title}</p>
            {teacher && (
              <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-3">
                <div className="bg-white/20 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center text-lg flex-shrink-0">
                  {teacher.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{teacher.name}</p>
                  <p className="text-primary-200 text-xs">{teacher.department}</p>
                  {subject && <p className="text-amber-200 text-xs mt-0.5">{subject.code} – {subject.name}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-primary-300 text-xs mt-3 border-t border-white/10 pt-3">
          🔒 Your responses are anonymous and confidential.
        </p>
      </div>

      {/* Progress bar */}
      <div className="card py-3 px-4">
        <ProgressBar answered={answeredCount} total={ratingQuestions.length} />
      </div>

      {/* Questions */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((q, i) => {
          const isAnswered = q.type === 'rating'
            ? !!answers[q.id]?.rating_value
            : true // open-ended is always optional

          return (
            <div
              id={`question-${q.id}`}
              key={q.id}
              className={`card space-y-4 transition-all ${
                q.type === 'rating' && !isAnswered
                  ? 'border-gray-200'
                  : q.type === 'rating'
                  ? 'border-green-200 bg-green-50/30'
                  : 'border-gray-200'
              }`}>

              {/* Question header */}
              <div className="flex items-start gap-3">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5
                  ${q.type === 'rating' && isAnswered
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-100 text-primary-700'}
                `}>
                  {q.type === 'rating' && isAnswered ? '✓' : i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="font-medium text-gray-800 leading-snug">{q.text}</p>
                    {q.type === 'rating' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        isAnswered ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {isAnswered ? '✓ Answered' : '* Required'}
                      </span>
                    )}
                    {q.type === 'open_ended' && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 flex-shrink-0">Optional</span>
                    )}
                  </div>
                  {q.category && (
                    <span className="inline-block text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full mt-1">{q.category}</span>
                  )}
                </div>
              </div>

              {/* Input */}
              {q.type === 'rating' ? (
                <div className="pl-11">
                  <RatingInput
                    qId={q.id}
                    value={answers[q.id]?.rating_value || null}
                    onChange={v => setAnswer(q.id, 'rating_value', v)}
                  />
                </div>
              ) : (
                <div className="pl-11">
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="Share your feedback here (optional)…"
                    value={answers[q.id]?.open_text || ''}
                    onChange={e => setAnswer(q.id, 'open_text', e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">This open-ended response is optional but very helpful.</p>
                </div>
              )}
            </div>
          )
        })}

        {/* Submit area */}
        <div className="card border-2 border-dashed border-primary-200 bg-primary-50/40">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-semibold text-gray-800">Ready to submit?</p>
              {allRatingsAnswered ? (
                <p className="text-sm text-green-600 mt-0.5">✅ All {ratingQuestions.length} rating questions answered.</p>
              ) : (
                <p className="text-sm text-amber-600 mt-0.5">
                  ⚠️ {ratingQuestions.length - answeredCount} rating question{ratingQuestions.length - answeredCount !== 1 ? 's' : ''} still need{ratingQuestions.length - answeredCount === 1 ? 's' : ''} a response.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/periods')}
                className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`btn-primary flex items-center gap-2 px-6 ${
                  !allRatingsAnswered ? 'opacity-60' : ''
                }`}>
                {submitting ? (
                  <><span className="animate-spin">⚙</span> Submitting…</>
                ) : (
                  <><CheckCircleIcon className="w-4 h-4" /> Submit Evaluation</>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

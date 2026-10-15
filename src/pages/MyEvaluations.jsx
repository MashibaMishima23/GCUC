import { useEffect, useState } from 'react'
import api from '../lib/api'
import { ChartBarIcon, ChatBubbleLeftRightIcon, AcademicCapIcon, CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function MyEvaluations() {
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [details, setDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get all evaluation periods
    api.get('/evaluations/periods')
      .then(r => {
        const teacherPeriods = r.data.filter(p => {
          const endDate = new Date(p.end_date)
          const now = new Date()
          return endDate < now // Only show ended periods
        })
        setPeriods(teacherPeriods)
      })
      .catch(() => setPeriods([]))
      .finally(() => setLoading(false))
  }, [])

  const loadDetails = async (periodId) => {
    setDetailsLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/evaluations/my-results/${periodId}/details`)
      setDetails(data)
      setSelectedPeriod(periodId)
    } catch (err) {
      if (err.response?.status === 403) {
        setError({
          message: err.response.data.message,
          end_date: err.response.data.end_date
        })
      } else {
        setError({ message: 'Failed to load details' })
      }
    } finally {
      setDetailsLoading(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1>My Evaluation Results</h1>
        <p className="text-gray-500 text-sm">View your evaluation scores and student feedback</p>
      </div>

      {periods.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No completed evaluation periods yet.</p>
          <p className="text-sm text-gray-500 mt-2">Results will appear here after evaluation periods end.</p>
        </div>
      ) : (
        <>
          {/* Period Selection */}
          <div className="card">
            <h2 className="mb-4">Select Evaluation Period</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {periods.map(p => (
                <button
                  key={p.id}
                  onClick={() => loadDetails(p.id)}
                  className={`text-left p-4 border-2 rounded-lg transition-all ${
                    selectedPeriod === p.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-gray-800">{p.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    <CalendarIcon className="w-4 h-4 inline mr-1" />
                    {p.semester} · S.Y. {p.school_year}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ended: {new Date(p.end_date).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="card bg-amber-50 border-2 border-amber-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="font-semibold text-amber-900">{error.message}</p>
                  {error.end_date && (
                    <p className="text-sm text-amber-700 mt-1">
                      Period ends: {new Date(error.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading Details */}
          {detailsLoading && (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto"></div>
              <p className="text-gray-400 mt-3">Loading evaluation details...</p>
            </div>
          )}

          {/* Details Display */}
          {details && !detailsLoading && (
            <>
              {/* Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200">
                  <p className="text-sm text-primary-700 font-medium">Overall Average</p>
                  <p className="text-3xl font-bold text-primary-900 mt-1">{details.stats.overall_avg}</p>
                  <p className="text-xs text-primary-600">out of 5.00</p>
                </div>
                <div className="card">
                  <p className="text-sm text-gray-600 font-medium">Total Evaluations</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{details.stats.total_evaluations}</p>
                  <p className="text-xs text-gray-500">students responded</p>
                </div>
                <div className="card">
                  <p className="text-sm text-gray-600 font-medium">Highest Rating</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{details.stats.highest_rating}</p>
                  <p className="text-xs text-gray-500">best score given</p>
                </div>
                <div className="card">
                  <p className="text-sm text-gray-600 font-medium">Lowest Rating</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">{details.stats.lowest_rating}</p>
                  <p className="text-xs text-gray-500">needs attention</p>
                </div>
              </div>

              {/* By Subject Breakdown */}
              {details.by_subject && details.by_subject.length > 0 && (
                <div className="card">
                  <h2 className="mb-4 flex items-center gap-2">
                    <AcademicCapIcon className="w-5 h-5 text-primary-700" />
                    Scores by Subject
                  </h2>
                  <div className="space-y-3">
                    {details.by_subject.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{s.subject}</p>
                          {s.code && <p className="text-xs text-gray-500 font-mono">{s.code}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">{s.evaluations} evaluations</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-700">{s.avg_score}</p>
                          <p className="text-xs text-gray-500">average</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Scores */}
              <div className="card">
                <h2 className="mb-4 flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-primary-700" />
                  Scores by Question
                </h2>
                <div className="space-y-3">
                  {details.question_scores.map((q, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-700 flex-1">{q.question}</p>
                        <span className="text-lg font-bold text-primary-700 ml-3">{q.avg_score}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-primary-600 h-full transition-all"
                            style={{ width: `${(parseFloat(q.avg_score) / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-20 text-right">{q.response_count} responses</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="card">
                <h2 className="mb-4 flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary-700" />
                  Student Comments ({details.comments.length})
                </h2>
                {details.comments.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No written comments</p>
                ) : (
                  <div className="space-y-3">
                    {details.comments.map((c, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-primary-700 font-medium mb-1">{c.question}</p>
                        <p className="text-sm text-gray-700 italic">"{c.comment}"</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(c.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy Notice */}
              <div className="card bg-blue-50 border-2 border-blue-200">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🔒</span>
                  <div>
                    <p className="font-semibold text-blue-900">Student Anonymity Protected</p>
                    <p className="text-sm text-blue-700 mt-1">
                      All student identities are hidden to ensure honest feedback. Results are only visible after the evaluation period ends to prevent bias.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

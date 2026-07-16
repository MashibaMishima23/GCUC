import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyEvaluationResults } from '../lib/mockApi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function MyEvaluations() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyEvaluationResults().then(r => setResults(r.data)).finally(() => setLoading(false))
  }, [])

  const chartData = results.map(r => ({
    name: r.period_title?.slice(0, 20) + '...',
    score: parseFloat(r.avg_score || 0).toFixed(2),
  }))

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1>My Evaluation Results</h1>
        <p className="text-gray-500 text-sm">Your performance evaluation history</p>
      </div>

      {results.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">No evaluation results yet.</div>
      ) : (
        <>
          {chartData.length > 1 && (
            <div className="card">
              <h2 className="mb-4">Performance Trend</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v}/5.00`, 'Avg Score']} />
                  <Bar dataKey="score" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-3">
            {results.map(r => (
              <div key={r.id} className="card flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{r.period_title}</p>
                  <p className="text-sm text-gray-500">{r.semester} · S.Y. {r.school_year}</p>
                  {r.subject_name && <p className="text-xs text-blue-600 mt-0.5">{r.subject_name}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.evaluator_type} evaluation · {r.submitted_at?.slice(0,10)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-700">{parseFloat(r.avg_score || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">out of 5.00</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 className="mb-2">View Full Reports</h2>
            <p className="text-sm text-gray-500 mb-3">AI-generated narrative reports with strengths and recommendations are available in the Reports section.</p>
            <Link to="/reports" className="btn-primary text-sm">Go to Reports</Link>
          </div>
        </>
      )}
    </div>
  )
}

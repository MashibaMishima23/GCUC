import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../lib/api'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'

export default function ReportDetail() {
  const [searchParams] = useSearchParams()
  const periodId = searchParams.get('period')
  const teacherId = searchParams.get('teacher')
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!periodId || !teacherId) {
      setError('Missing period or teacher parameter')
      setLoading(false)
      return
    }

    api.get(`/reports/evaluation-data/${periodId}/${teacherId}`)
      .then(r => setData(r.data))
      .catch(err => {
        console.error('Error loading report data:', err)
        setError(err.response?.data?.message || 'Failed to load report data')
      })
      .finally(() => setLoading(false))
  }, [periodId, teacherId])

  const handlePrint = () => window.print()

  if (loading) return <div className="text-center py-12 text-gray-400">Loading evaluation report...</div>
  if (error) return <div className="text-center py-12 text-red-500">Error: {error}</div>
  if (!data) return <div className="text-center py-12 text-gray-400">No data available.</div>

  const scoreColor = s => {
    if (s >= 4.5) return '#10b981'
    if (s >= 3.5) return '#1d4ed8'
    if (s >= 2.5) return '#f59e0b'
    return '#ef4444'
  }

  const scoreLabel = s => {
    if (s >= 4.5) return 'Outstanding'
    if (s >= 3.5) return 'Very Satisfactory'
    if (s >= 2.5) return 'Satisfactory'
    if (s >= 1.5) return 'Fair'
    return 'Poor'
  }

  const avg = parseFloat(data.overall.avg_score)

  const radarData = data.categories.map(c => ({
    subject: c.category?.split(' ').slice(0,2).join(' ') || 'General',
    score: parseFloat(c.avg),
    fullMark: 5,
  }))

  const distData = data.distribution.map(d => ({
    rating: `${d.rating}★`,
    value: d.rating,
    count: d.count,
  }))

  return (
    <div className="max-w-6xl space-y-6 print:max-w-none">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 print:hidden">
        <Link to="/reports" className="btn-secondary text-sm">← Back to Reports</Link>
        <button onClick={handlePrint} className="btn-primary text-sm">🖨 Print / Save PDF</button>
      </div>

      {/* Report Card */}
      <div className="card space-y-6 print:shadow-none print:border-none">
        {/* Title block */}
        <div className="text-center border-b pb-6">
          <p className="text-sm text-gray-500 uppercase tracking-widest font-medium">Gingoog City United Colleges</p>
          <h1 className="text-2xl font-bold text-primary-700 mt-1">
            Faculty Performance Evaluation Report
          </h1>
          <p className="text-gray-500 mt-1">{data.period?.title}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
            <span>📅 S.Y. {data.period?.school_year}</span>
            <span>📌 {data.period?.semester} Semester</span>
            <span>📊 {data.overall.total_evaluations} Student Evaluations</span>
          </div>
        </div>

        {/* Teacher info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Faculty Member</p>
            <p className="text-lg font-bold text-gray-800">{data.teacher?.name}</p>
            {data.teacher?.department && (
              <p className="text-sm text-gray-500 mt-0.5">{data.teacher.department}</p>
            )}
          </div>
          <div className="bg-primary-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Overall Average Score</p>
            <p className="text-4xl font-bold" style={{ color: scoreColor(avg) }}>{avg.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">out of 5.00</p>
            <p className="text-sm font-semibold mt-1" style={{ color: scoreColor(avg) }}>{scoreLabel(avg)}</p>
          </div>
        </div>

        {/* Performance Charts - Per Subject */}
        {data.subjects && data.subjects.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Performance by Subject</h3>
            <div className="space-y-6">
              {data.subjects.map(subject => {
                // Get category data for this subject
                const subjectCategories = data.subject_categories?.filter(sc => sc.subject_id === subject.id) || []
                const subjectRadarData = subjectCategories.map(sc => ({
                  subject: sc.category?.split(' ').slice(0, 2).join(' ') || 'General',
                  score: parseFloat(sc.avg_score),
                  fullMark: 5,
                }))

                // Get rating distribution for this subject (would need backend support)
                const subjectVal = parseFloat(subject.avg_score)

                return (
                  <div key={subject.id} className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">{subject.code} - {subject.name}</h4>
                        <p className="text-sm text-gray-500">{subject.total_evaluations} student evaluations</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: scoreColor(subjectVal) }}>{subject.avg_score}</p>
                        <p className="text-sm" style={{ color: scoreColor(subjectVal) }}>{scoreLabel(subjectVal)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Radar Chart for this subject */}
                      {subjectRadarData.length > 2 && (
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-600 mb-2">Category Performance</p>
                          <ResponsiveContainer width="100%" height={200}>
                            <RadarChart data={subjectRadarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                              <Radar dataKey="score" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.3} />
                              <Tooltip formatter={v => [`${parseFloat(v).toFixed(2)}/5.00`, 'Score']} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Category breakdown */}
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">Category Scores</p>
                        <div className="space-y-2">
                          {subjectCategories.map(sc => {
                            const catVal = parseFloat(sc.avg_score)
                            const pct = (catVal / 5) * 100
                            return (
                              <div key={sc.category}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600">{sc.category}</span>
                                  <span className="font-semibold" style={{ color: scoreColor(catVal) }}>
                                    {sc.avg_score}
                                  </span>
                                </div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full" 
                                    style={{ width: `${pct}%`, backgroundColor: scoreColor(catVal) }} 
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Overall Charts if single subject or summary */}
        {(!data.subjects || data.subjects.length <= 1) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Radar Chart */}
            {radarData.length > 2 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Performance by Category</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <Radar dataKey="score" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.3} />
                    <Tooltip formatter={v => [`${parseFloat(v).toFixed(2)}/5.00`, 'Score']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Rating Distribution */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={distData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Number of Ratings" radius={[4,4,0,0]}>
                    {distData.map((d, i) => (
                      <Cell key={i} fill={scoreColor(d.value)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Category Scores - Only show if single subject or no subject breakdown */}
        {(!data.subjects || data.subjects.length <= 1) && data.categories && data.categories.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Category Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.categories.map(c => {
                const val = parseFloat(c.avg)
                const pct = (val / 5) * 100
                return (
                  <div key={c.category} className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 font-medium">{c.category}</span>
                      <span className="text-lg font-bold" style={{ color: scoreColor(val) }}>
                        {val.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: scoreColor(val) }} />
                    </div>
                    <p className="text-xs" style={{ color: scoreColor(val) }}>{scoreLabel(val)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Overall Subject Summary - Simple list if multiple subjects */}
        {data.subjects && data.subjects.length > 1 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Subject Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.subjects.map(s => {
                const val = parseFloat(s.avg_score)
                return (
                  <div key={s.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{s.code}</p>
                      <p className="text-xs text-gray-500">{s.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{s.total_evaluations} evaluations</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: scoreColor(val) }}>{val}</p>
                      <p className="text-xs" style={{ color: scoreColor(val) }}>{scoreLabel(val)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Student Comments - Raw, Uncategorized */}
        {data.comments && data.comments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Student Feedback ({data.comments.length} {data.comments.length === 1 ? 'comment' : 'comments'})
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Anonymous comments from students. Comments are shown exactly as submitted.
            </p>
            <div className="space-y-3">
              {data.comments.map((c, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-300">
                  <p className="text-gray-800 leading-relaxed">"{c.text}"</p>
                  {c.subject_name && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded">
                        {c.subject_code} - {c.subject_name}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.comments && data.comments.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg">
            No written comments submitted for this evaluation period.
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-4 text-xs text-gray-400 text-center">
          <p>Generated by GCUC Evaluation System · {new Date().toLocaleDateString()}</p>
          <p className="mt-0.5">This report shows evaluation scores and student feedback.</p>
        </div>
      </div>
    </div>
  )
}

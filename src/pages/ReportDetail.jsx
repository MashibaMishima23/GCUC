import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getReport } from '../lib/mockApi'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function ReportDetail() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReport(id).then(r => setReport(r.data)).finally(() => setLoading(false))
  }, [id])

  const handlePrint = () => window.print()

  if (loading) return <div className="text-center py-12 text-gray-400">Loading report...</div>
  if (!report) return <div className="text-center py-12 text-gray-400">Report not found.</div>

  const scoreColor = s => {
    if (s >= 4.5) return 'text-emerald-600'
    if (s >= 3.5) return 'text-primary-600'
    if (s >= 2.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const scoreLabel = s => {
    if (s >= 4.5) return 'Outstanding'
    if (s >= 3.5) return 'Very Satisfactory'
    if (s >= 2.5) return 'Satisfactory'
    if (s >= 1.5) return 'Fair'
    return 'Poor'
  }

  const avg = parseFloat(report.average_score || 0)

  return (
    <div className="max-w-4xl space-y-6 print:max-w-none">
      <div className="flex items-start justify-between flex-wrap gap-3 print:hidden">
        <Link to="/reports" className="btn-secondary text-sm">← Back to Reports</Link>
        <button onClick={handlePrint} className="btn-primary text-sm">🖨 Print / Save PDF</button>
      </div>

      <div className="card space-y-6 print:shadow-none print:border-none">
        <div className="text-center border-b pb-6">
          <p className="text-sm text-gray-500 uppercase tracking-widest font-medium">Gingoog City United Colleges</p>
          <h1 className="text-2xl font-bold text-gcuc-blue mt-1">
            {report.report_type === 'individual' ? 'Faculty Performance Evaluation Report' : 'Department Performance Evaluation Report'}
          </h1>
          <p className="text-gray-500 mt-1">{report.period_title}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
            <span>📅 S.Y. {report.school_year}</span>
            <span>📌 {report.semester} Semester</span>
            <span>📊 {report.total_evaluations} Evaluations</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">
              {report.report_type === 'individual' ? 'Faculty Member' : 'Department'}
            </p>
            <p className="text-lg font-bold text-gray-800">
              {report.report_type === 'individual' ? report.teacher_name : report.department_name}
            </p>
            {report.department && report.report_type === 'individual' && (
              <p className="text-sm text-gray-500 mt-0.5">{report.department}</p>
            )}
          </div>
          <div className="bg-primary-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Overall Average Score</p>
            <p className={`text-4xl font-bold ${scoreColor(avg)}`}>{avg.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">out of 5.00</p>
            <p className={`text-sm font-semibold mt-1 ${scoreColor(avg)}`}>{scoreLabel(avg)}</p>
          </div>
        </div>

        {report.narrative && (
          <div>
            <h2 className="text-gcuc-blue mb-3">📝 Narrative Report</h2>
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-5">
              {report.narrative.split('\n').map((line, i) => (
                <p key={i} className="mb-2">{line}</p>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.strengths && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="text-green-700 mb-3">💪 Strengths</h3>
              <div className="text-sm text-gray-700 space-y-1">
                {report.strengths.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i} className="flex gap-2"><span className="text-green-500 flex-shrink-0">•</span>{line.replace(/^[-•*]\s*/, '')}</p>
                ))}
              </div>
            </div>
          )}
          {report.weaknesses && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="text-yellow-700 mb-3">⚠️ Areas for Improvement</h3>
              <div className="text-sm text-gray-700 space-y-1">
                {report.weaknesses.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i} className="flex gap-2"><span className="text-yellow-500 flex-shrink-0">•</span>{line.replace(/^[-•*]\s*/, '')}</p>
                ))}
              </div>
            </div>
          )}
          {report.recommendations && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <h3 className="text-primary-800 mb-3">🎯 Recommendations</h3>
              <div className="text-sm text-gray-700 space-y-1">
                {report.recommendations.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i} className="flex gap-2"><span className="text-blue-500 flex-shrink-0">•</span>{line.replace(/^[-•*]\s*/, '')}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4 text-xs text-gray-400 text-center">
          <p>Generated by GCUC AI-Assisted Evaluation System · {report.generated_at?.slice(0,10)}</p>
          <p className="mt-0.5">This report is AI-generated and should be reviewed by authorized personnel before official use.</p>
        </div>
      </div>
    </div>
  )
}

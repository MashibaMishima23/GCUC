import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  SparklesIcon, DocumentTextIcon, ChartBarIcon,
  ChatBubbleLeftRightIcon, LightBulbIcon, CheckCircleIcon,
  MagnifyingGlassIcon, FunnelIcon, ArrowLeftIcon
} from '@heroicons/react/24/outline'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

// ── AI guidance per section ───────────────────────────────────────────────────
const SECTION_GUIDANCE = {
  introduction: {
    title: 'Introduction',
    hint: 'Briefly identify the teacher, evaluation period, number of respondents, and overall performance rating.',
    placeholder: 'e.g., This report presents the evaluation results of [Teacher Name] for the [Semester] of Academic Year [Year]. A total of [N] students participated in the evaluation...',
  },
  overall: {
    title: 'Overall Performance Summary',
    hint: 'Discuss the average score, highest-rated competencies, and any noticeable trends across evaluation categories.',
    placeholder: 'e.g., [Teacher Name] received an overall average rating of [X.XX] out of 5.00, reflecting a [descriptor] level of performance...',
  },
  strengths: {
    title: 'Key Strengths',
    hint: 'Include two or three major strengths supported by evaluation scores and recurring positive comments from students.',
    placeholder: 'e.g., The evaluation results highlight [Teacher Name]\'s exceptional performance in [Category], consistently rated at [X.XX]/5.00...',
  },
  improvements: {
    title: 'Areas for Improvement',
    hint: 'Discuss recurring suggestions for improvement supported by evaluation results and constructive student feedback.',
    placeholder: 'e.g., While overall performance is commendable, the evaluation data suggests opportunities for growth in [Category]...',
  },
  evidence: {
    title: 'Supporting Evaluation Evidence',
    hint: 'Reference specific statistics, category scores, and selected anonymous student comments that support your narrative.',
    placeholder: 'e.g., Category scores indicate that students rated [Category] at [X.XX]/5.00. Representative student feedback includes...',
  },
  recommendations: {
    title: 'Recommendations',
    hint: 'Provide practical and achievable recommendations aligned with identified improvement areas. Be specific and actionable.',
    placeholder: 'e.g., Based on the evaluation results, the following recommendations are proposed to support continuous professional development...',
  },
  conclusion: {
    title: 'Conclusion',
    hint: 'End with a balanced summary that recognizes achievements while encouraging continuous professional development.',
    placeholder: 'e.g., Overall, [Teacher Name] demonstrates a strong commitment to quality instruction and student success...',
  },
}

const SCORE_COLOR = s => {
  if (s >= 4.5) return '#10b981'
  if (s >= 3.5) return '#1d4ed8'
  if (s >= 2.5) return '#f59e0b'
  return '#ef4444'
}

const SCORE_LABEL = s => {
  if (s >= 4.5) return 'Outstanding'
  if (s >= 3.5) return 'Very Satisfactory'
  if (s >= 2.5) return 'Satisfactory'
  if (s >= 1.5) return 'Fair'
  return 'Poor'
}

// ── Step 1: Period + Teacher selector ────────────────────────────────────────
function StepSelector({ onSelect }) {
  const [periods, setPeriods] = useState([])
  const [teachers, setTeachers] = useState([])
  const [periodId, setPeriodId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/evaluations/periods').then(r => setPeriods(r.data))
    api.get('/users', { params: { role: 'teacher' } }).then(r => setTeachers(r.data.data || []))
  }, [])

  const handleStart = async () => {
    if (!periodId || !teacherId) return toast.error('Select both a period and a teacher')
    setLoading(true)
    try {
      const r = await api.get(`/reports/evaluation-data/${periodId}/${teacherId}`)
      onSelect({ periodId, teacherId, data: r.data })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load evaluation data')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <DocumentTextIcon className="w-8 h-8 text-primary-700" />
        </div>
        <h1>Create Narrative Report</h1>
        <p className="text-gray-500 mt-1 max-w-md mx-auto">
          Select an evaluation period and teacher to review the data, then write a professional report with AI assistance.
        </p>
      </div>

      <div className="card space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">📋 How this works</p>
          <ol className="space-y-1 list-decimal list-inside text-blue-700">
            <li>Review the complete evaluation data for the selected teacher</li>
            <li>Write the narrative report using your professional judgment</li>
            <li>Use AI suggestions as a guide — not as the final author</li>
            <li>Optionally request an AI draft as a starting point to edit</li>
            <li>Save your finalized report</li>
          </ol>
        </div>

        <div>
          <label className="label">Evaluation Period *</label>
          <select className="input" value={periodId} onChange={e => setPeriodId(e.target.value)}>
            <option value="">— Select Period —</option>
            {periods.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Teacher / Faculty *</label>
          <select className="input" value={teacherId} onChange={e => setTeacherId(e.target.value)}>
            <option value="">— Select Teacher —</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.department || 'Unknown Dept'}</option>)}
          </select>
        </div>

        <button
          onClick={handleStart}
          disabled={loading || !periodId || !teacherId}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {loading
            ? <><span className="animate-spin">⚙</span> Loading evaluation data…</>
            : <><ChartBarIcon className="w-5 h-5" /> Review Evaluation Data & Write Report</>}
        </button>
      </div>
    </div>
  )
}

// ── Left panel: Evaluation data ───────────────────────────────────────────────
function EvalDataPanel({ data, insights, loadingInsights, onLoadInsights, periodId, teacherId }) {
  const [commentFilter, setCommentFilter] = useState('all')
  const [themeFilter, setThemeFilter]     = useState('all')
  const [commentSearch, setCommentSearch] = useState('')
  const [activeTab, setActiveTab]         = useState('summary')

  const avg = parseFloat(data.overall.avg_score)

  // When insights are loaded, enrich raw comments with per_comment AI data
  const enrichedComments = data.comments.map((c, i) => {
    const aiData = insights?.per_comment?.find(p => p.index === i + 1) || null
    return {
      ...c,
      sentiment:           aiData?.sentiment           || null,
      themes:              aiData?.themes              || [],
      language:            aiData?.language            || null,
      english_translation: aiData?.english_translation || null,
      is_serious_concern:  aiData?.is_serious_concern  || false,
    }
  })

  // Derive theme list from AI insights or raw categories
  const allThemes = insights?.themes?.map(t => t.name) ||
    [...new Set(data.comments.map(c => c.category).filter(Boolean))]

  const sentimentCounts = insights ? {
    Positive: insights.sentiment_breakdown?.Positive || 0,
    Negative: insights.sentiment_breakdown?.Negative || 0,
  } : null

  const filtered = enrichedComments.filter(c => {
    const matchSentiment = commentFilter === 'all' || c.sentiment === commentFilter
    const matchTheme     = themeFilter === 'all' ||
      c.category === themeFilter ||
      c.themes?.includes(themeFilter)
    const matchSearch    = !commentSearch ||
      c.text.toLowerCase().includes(commentSearch.toLowerCase())
    return matchSentiment && matchTheme && matchSearch
  })

  // Summary stats for current filter
  const filteredInsight = insights?.themes?.find(t => t.name === themeFilter)
  const filteredSummary = commentFilter !== 'all' && insights
    ? (commentFilter === 'Positive' ? insights.positive_highlights?.join(' ') :
       commentFilter === 'Negative' ? insights.notable_concerns?.join('. ') : null)
    : filteredInsight?.insight || null

  const SENTIMENT_CONFIG = {
    Positive: { color: 'bg-green-100 text-green-700 border-green-300', dot: 'bg-green-500', label: 'Positive' },
    Negative: { color: 'bg-red-100 text-red-700 border-red-300',       dot: 'bg-red-500',   label: 'Negative' },
  }

  const radarData = data.categories.map(c => ({
    subject: c.category?.split(' ').slice(0,2).join(' ') || 'General',
    score: parseFloat(c.avg),
    fullMark: 5,
  }))

  const distData = data.distribution.map(d => ({
    rating: `${d.rating}★`,
    count: d.count,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
        {[
          { key: 'summary',  label: 'Summary',  icon: ChartBarIcon },
          { key: 'comments', label: `Comments (${data.comments.length})`, icon: ChatBubbleLeftRightIcon },
          { key: 'insights', label: 'AI Insights', icon: LightBulbIcon },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Summary tab */}
        {activeTab === 'summary' && (
          <>
            {/* Overall score */}
            <div className="bg-primary-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Overall Average</p>
              <p className="text-4xl font-bold" style={{ color: SCORE_COLOR(avg) }}>
                {avg.toFixed(2)}
              </p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: SCORE_COLOR(avg) }}>
                {SCORE_LABEL(avg)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{data.overall.total_evaluations} respondents</p>
            </div>

            {/* Radar chart */}
            {radarData.length > 2 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Performance by Category</p>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.2} />
                    <Tooltip formatter={v => [`${parseFloat(v).toFixed(2)}/5.00`, 'Score']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category scores */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Category Scores</p>
              <div className="space-y-2">
                {data.categories.map(c => {
                  const val = parseFloat(c.avg)
                  const pct = (val / 5) * 100
                  return (
                    <div key={c.category} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-700 truncate">{c.category}</span>
                        <span className="font-semibold ml-2 flex-shrink-0" style={{ color: SCORE_COLOR(val) }}>
                          {val.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: SCORE_COLOR(val) }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rating distribution */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Rating Distribution</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={distData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Responses" radius={[3,3,0,0]}>
                    {distData.map((d, i) => (
                      <Cell key={i} fill={SCORE_COLOR(parseInt(d.rating))} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Comments tab — AI-classified sentiment & theme filtering */}
        {activeTab === 'comments' && (
          <>
            {/* Sentiment filter buttons */}
            <div className="space-y-2">
              <div className="flex gap-1 flex-wrap">
                {['all','Positive','Negative'].map(f => {
                  const cfg = SENTIMENT_CONFIG[f]
                  const count = f === 'all'
                    ? data.comments.length
                    : (sentimentCounts?.[f] ?? enrichedComments.filter(c => c.sentiment === f).length)
                  const total = data.comments.length
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <button key={f} onClick={() => setCommentFilter(f)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                        commentFilter === f
                          ? f === 'all' ? 'bg-primary-600 text-white border-primary-600'
                            : `${cfg.color} border-current`
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {f === 'all' ? `All (${count})` : `${f} (${count}${sentimentCounts ? ` · ${pct}%` : ''})`}
                    </button>
                  )
                })}
              </div>

              {/* Theme filter */}
              {allThemes.length > 0 && (
                <select className="input text-xs py-1.5 w-full"
                  value={themeFilter} onChange={e => setThemeFilter(e.target.value)}>
                  <option value="all">All Themes</option>
                  {allThemes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )}

              {/* Keyword search */}
              <div className="relative">
                <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-8 text-xs py-1.5" placeholder="Search comments…"
                  value={commentSearch} onChange={e => setCommentSearch(e.target.value)} />
              </div>
            </div>

            {/* AI-generated summary for current filter */}
            {filteredSummary && (
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 flex gap-2">
                <SparklesIcon className="w-3.5 h-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-primary-800 leading-relaxed">{filteredSummary}</p>
              </div>
            )}

            {/* Result count */}
            <p className="text-xs text-gray-400">
              {filtered.length} of {data.comments.length} comments
              {!insights && <span className="ml-1 text-amber-600">· Load AI Insights to classify by sentiment</span>}
            </p>

            {/* Comment list */}
            {filtered.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">No comments match the current filters.</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((c, i) => {
                  const cfg = c.sentiment ? SENTIMENT_CONFIG[c.sentiment] : null
                  const borderColors = { Positive:'#22c55e', Negative:'#ef4444' }
                  return (
                    <div key={i}
                      className="rounded-xl bg-white border p-3"
                      style={cfg ? { borderLeftWidth: 3, borderLeftColor: borderColors[c.sentiment] } : {}}>
                      <p className="text-xs text-gray-700 leading-relaxed">"{c.text}"</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {cfg && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium border ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        )}
                        {c.language && c.language !== 'English' && (
                          <span className="text-xs bg-purple-50 border border-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full">
                            {c.language}
                          </span>
                        )}
                        {c.category && (
                          <span className="text-xs bg-primary-50 border border-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full">
                            {c.category}
                          </span>
                        )}
                        {c.themes?.filter(t => t !== c.category).slice(0,2).map((t,j) => (
                          <span key={j} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                      {c.english_translation && c.language !== 'English' && (
                        <p className="text-xs text-gray-400 italic mt-1">
                          🌐 <em>"{c.english_translation}"</em>
                        </p>
                      )}
                      {c.is_serious_concern && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                          ⚠️ <strong>Serious concern flagged</strong> — requires immediate attention
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Prompt to run AI if not loaded */}
            {!insights && data.comments.length > 0 && (
              <div className="border border-dashed border-primary-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-2">Run AI analysis to classify comments by sentiment and theme</p>
                <button onClick={onLoadInsights} disabled={loadingInsights}
                  className="btn-primary text-xs flex items-center gap-1.5 mx-auto">
                  {loadingInsights
                    ? <><span className="animate-spin">⚙</span> Analyzing…</>
                    : <><SparklesIcon className="w-3.5 h-3.5" /> Classify Comments</>}
                </button>
              </div>
            )}
          </>
        )}

        {/* AI Insights tab — multilingual analysis */}
        {activeTab === 'insights' && (
          !insights ? (
            <div className="text-center py-8 space-y-3">
              <LightBulbIcon className="w-10 h-10 text-gray-200 mx-auto" />
              <p className="text-sm text-gray-500 font-medium">Multilingual Comment Analysis</p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                AI will analyze comments in English, Filipino, Bisaya, and mixed languages —
                detecting themes, sentiment, and recurring patterns.
              </p>
              <button onClick={onLoadInsights} disabled={loadingInsights}
                className="btn-primary flex items-center gap-2 mx-auto text-sm">
                {loadingInsights
                  ? <><span className="animate-spin">⚙</span> Analyzing comments…</>
                  : <><SparklesIcon className="w-4 h-4" /> Analyze Comments</>}
              </button>
            </div>
          ) : insights.total_analyzed === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ChatBubbleLeftRightIcon className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No open-ended comments to analyze.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-primary-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-primary-700">{insights.total_analyzed}</p>
                  <p className="text-xs text-gray-500">Comments Analyzed</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-700">{insights.themes?.length || 0}</p>
                  <p className="text-xs text-gray-500">Themes Found</p>
                </div>
              </div>

              {/* Serious concerns alert */}
              {insights.serious_concerns?.length > 0 && (
                <div className="bg-red-50 border-2 border-red-400 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-800 flex items-center gap-1.5 mb-1.5">
                    ⚠️ {insights.serious_concerns.length} Serious Concern{insights.serious_concerns.length > 1 ? 's' : ''} Flagged
                  </p>
                  <p className="text-xs text-red-700 mb-2">
                    The following comments contain allegations that require immediate attention by the Guidance Office.
                  </p>
                  {insights.serious_concerns.map((c, i) => (
                    <p key={i} className="text-xs text-red-800 bg-red-100 rounded px-2 py-1 mb-1 italic">"{c}"</p>
                  ))}
                </div>
              )}

              {/* Language breakdown */}
              {insights.language_breakdown && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">🌐 Language Detection</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(insights.language_breakdown).filter(([,v]) => v > 0).map(([lang, count]) => (
                      <span key={lang} className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        lang === 'English'  ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        lang === 'Filipino' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                        lang === 'Bisaya'   ? 'bg-orange-50 border-orange-200 text-orange-700' :
                        'bg-purple-50 border-purple-200 text-purple-700'
                      }`}>
                        {lang}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentiment breakdown */}
              {insights.sentiment_breakdown && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">💬 Sentiment Breakdown</p>
                  <div className="space-y-1">
                    {Object.entries(insights.sentiment_breakdown).filter(([,v]) => v > 0).map(([sent, count]) => {
                      const total = insights.total_analyzed
                      const pct = Math.round((count / total) * 100)
                      const colors = {
                        Positive: 'bg-green-500',
                        Negative: 'bg-red-500',
                      }
                      return (
                        <div key={sent} className="flex items-center gap-2 text-xs">
                          <span className="w-20 text-gray-600 flex-shrink-0">{sent}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${colors[sent] || 'bg-gray-400'} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-gray-500 w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Overall summary */}
              {insights.overall_summary && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">📋 Overall Summary</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{insights.overall_summary}</p>
                </div>
              )}

              {/* Themes */}
              {insights.themes?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">🏷 Identified Themes</p>
                  <div className="space-y-2">
                    {insights.themes.slice(0,6).map((theme, i) => (
                      <div key={i} className={`rounded-lg border p-3 ${
                        theme.sentiment === 'Positive' ? 'bg-green-50 border-green-200' :
                        theme.sentiment === 'Negative' ? 'bg-red-50 border-red-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-gray-800">{theme.name}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500">{theme.count}x</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              theme.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                              theme.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>{theme.sentiment}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-1.5">{theme.insight}</p>
                        {theme.representative_comments?.slice(0,2).map((c, j) => (
                          <p key={j} className="text-xs text-gray-500 italic bg-white/70 rounded px-2 py-1 mb-0.5">"{c}"</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recurring strengths */}
              {insights.recurring_strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-1.5">✅ Recurring Strengths</p>
                  <div className="space-y-2">
                    {insights.recurring_strengths.map((s, i) => (
                      <div key={i} className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-green-800">{s.description}</p>
                          <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">{s.frequency}x</span>
                        </div>
                        {s.evidence?.slice(0,1).map((e, j) => (
                          <p key={j} className="text-xs text-gray-500 italic">"{e}"</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recurring improvements */}
              {insights.recurring_improvements?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-1.5">⚠ Areas for Improvement</p>
                  <div className="space-y-2">
                    {insights.recurring_improvements.map((s, i) => (
                      <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-amber-800">{s.description}</p>
                          <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">{s.frequency}x</span>
                        </div>
                        {s.evidence?.slice(0,1).map((e, j) => (
                          <p key={j} className="text-xs text-gray-500 italic">"{e}"</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notable concerns */}
              {insights.notable_concerns?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1.5">🔴 Notable Concerns</p>
                  <ul className="space-y-0.5">
                    {insights.notable_concerns.map((c, i) => (
                      <li key={i} className="text-xs text-red-700">• {c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reload button */}
              <button onClick={onLoadInsights} disabled={loadingInsights}
                className="btn-secondary text-xs w-full flex items-center justify-center gap-1.5">
                <SparklesIcon className="w-3.5 h-3.5" /> Re-analyze Comments
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

// ── Section editor ────────────────────────────────────────────────────────────
function SectionEditor({ sectionKey, value, onChange, insights }) {
  const g = SECTION_GUIDANCE[sectionKey]
  const [showHint, setShowHint] = useState(true)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <p className="text-sm font-semibold text-gray-800">{g.title}</p>
        <button onClick={() => setShowHint(h => !h)}
          className="text-xs text-primary-600 hover:underline flex items-center gap-1">
          <LightBulbIcon className="w-3.5 h-3.5" />
          {showHint ? 'Hide' : 'Show'} AI Guidance
        </button>
      </div>

      {showHint && (
        <div className="px-4 py-2.5 bg-primary-50/50 border-b border-primary-100 flex gap-2">
          <SparklesIcon className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-primary-800 leading-relaxed">{g.hint}</p>
        </div>
      )}

      <textarea
        className="w-full px-4 py-3 text-sm text-gray-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
        rows={5}
        placeholder={g.placeholder}
        value={value}
        onChange={e => onChange(sectionKey, e.target.value)}
      />
    </div>
  )
}

// ── Right panel: Report editor ────────────────────────────────────────────────
function ReportEditorPanel({ data, sections, onChange, onSave, saving,
  onAIDraft, loadingDraft, isDraftLoaded, periodId, teacherId }) {

  const wordCount = Object.values(sections).join(' ').split(/\s+/).filter(Boolean).length
  const filledCount = Object.values(sections).filter(v => v.trim().length > 0).length
  const totalSections = Object.keys(SECTION_GUIDANCE).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Editor header */}
      <div className="px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              {data.teacher?.name} — Narrative Report
            </p>
            <p className="text-xs text-gray-400">{data.period?.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {filledCount}/{totalSections} sections · {wordCount} words
            </span>
            <button onClick={onAIDraft} disabled={loadingDraft}
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
              {loadingDraft
                ? <><span className="animate-spin text-xs">⚙</span> Generating…</>
                : <><SparklesIcon className="w-3.5 h-3.5" /> AI Draft</>}
            </button>
            <button onClick={onSave} disabled={saving || filledCount === 0}
              className="btn-primary text-xs flex items-center gap-1.5 py-1.5">
              {saving
                ? <><span className="animate-spin text-xs">⚙</span> Saving…</>
                : <><CheckCircleIcon className="w-3.5 h-3.5" /> Save Report</>}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${(filledCount / totalSections) * 100}%` }} />
        </div>
      </div>

      {/* AI draft notice */}
      {isDraftLoaded && (
        <div className="mx-5 mt-3 flex-shrink-0 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
          <SparklesIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">AI Draft Loaded</p>
            <p className="text-xs text-amber-700 mt-0.5">
              This draft is a suggestion only. Review, edit, and verify all content before saving.
              Your professional judgment is the final authority.
            </p>
          </div>
        </div>
      )}

      {/* Section editors */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {Object.keys(SECTION_GUIDANCE).map(key => (
          <SectionEditor
            key={key}
            sectionKey={key}
            value={sections[key]}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ReportBuilder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Step management
  const [step, setStep] = useState('select') // 'select' | 'build'
  const [evalData, setEvalData] = useState(null)
  const [periodId, setPeriodId] = useState(null)
  const [teacherId, setTeacherId] = useState(null)

  // Insights
  const [insights, setInsights] = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  // Report sections
  const [sections, setSections] = useState({
    introduction: '',
    overall:      '',
    strengths:    '',
    improvements: '',
    evidence:     '',
    recommendations: '',
    conclusion:   '',
  })
  const [saving, setSaving] = useState(false)
  const [isDraftLoaded, setIsDraftLoaded] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(false)

  const handleSelect = ({ periodId: pid, teacherId: tid, data }) => {
    setPeriodId(pid)
    setTeacherId(tid)
    setEvalData(data)
    setStep('build')
  }

  const handleSectionChange = useCallback((key, val) => {
    setSections(prev => ({ ...prev, [key]: val }))
  }, [])

  const handleLoadInsights = async () => {
    setLoadingInsights(true)
    try {
      const r = await api.post('/reports/analyze-comments', {
        period_id:  parseInt(periodId),
        teacher_id: parseInt(teacherId),
      })
      setInsights(r.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load insights. Is Ollama running?')
    } finally { setLoadingInsights(false) }
  }

  const handleAIDraft = async () => {
    setLoadingDraft(true)
    try {
      const r = await api.post('/reports/ai-draft', {
        period_id: parseInt(periodId),
        teacher_id: parseInt(teacherId),
      })
      const d = r.data
      setSections({
        introduction:    `${evalData?.teacher?.name} is a faculty member of ${evalData?.teacher?.department || 'the department'}. This report summarizes the results of the ${evalData?.period?.title} evaluation, which gathered responses from ${evalData?.overall?.total_evaluations} student respondents. The overall average rating is ${evalData?.overall?.avg_score} out of 5.00.`,
        overall:         d.narrative?.split('\n')[0] || '',
        strengths:       d.strengths || '',
        improvements:    d.weaknesses || '',
        evidence:        `Based on the evaluation data, category scores ranged across ${evalData?.categories?.length} competency areas. The highest-rated category was ${evalData?.categories?.[0]?.category || 'N/A'} at ${evalData?.categories?.[0]?.avg || 'N/A'}/5.00.`,
        recommendations: d.recommendations || '',
        conclusion:      `In conclusion, ${evalData?.teacher?.name} demonstrates ${d.narrative?.includes('outstanding') ? 'outstanding' : 'commendable'} professional commitment. Continued engagement with professional development will further enhance teaching effectiveness.`,
      })
      setIsDraftLoaded(true)
      toast.success('AI draft loaded. Review and edit before saving.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI draft failed. Is Ollama running?')
    } finally { setLoadingDraft(false) }
  }

  const handleSave = async () => {
    const narrative = [
      sections.introduction,
      sections.overall,
      sections.strengths,
      sections.improvements,
      sections.evidence,
      sections.recommendations,
      sections.conclusion,
    ].filter(Boolean).join('\n\n')

    if (!narrative.trim()) return toast.error('Please write at least one section before saving.')
    setSaving(true)
    try {
      const r = await api.post('/reports/save', {
        period_id:      parseInt(periodId),
        teacher_id:     parseInt(teacherId),
        narrative,
        strengths:      sections.strengths,
        weaknesses:     sections.improvements,
        recommendations: sections.recommendations,
        is_ai_assisted: isDraftLoaded,
      })
      toast.success('Report saved successfully!')
      navigate(`/reports/${r.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  if (step === 'select') {
    return (
      <div className="space-y-4">
        <Link to="/reports" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Reports
        </Link>
        <StepSelector onSelect={handleSelect} />
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <button onClick={() => setStep('select')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700">
          <ArrowLeftIcon className="w-4 h-4" /> Change Selection
        </button>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <SparklesIcon className="w-3.5 h-3.5 text-primary-500" />
          <span>AI Assistant — Human judgment is the final authority</span>
        </div>
      </div>

      {/* Split screen */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Left: Evaluation data */}
        <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Evaluation Data</p>
            <p className="text-xs text-gray-400 mt-0.5">{evalData?.teacher?.name}</p>
          </div>
          <EvalDataPanel
            data={evalData}
            insights={insights}
            loadingInsights={loadingInsights}
            onLoadInsights={handleLoadInsights}
            periodId={periodId}
            teacherId={teacherId}
          />
        </div>

        {/* Right: Report editor */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <ReportEditorPanel
            data={evalData}
            sections={sections}
            onChange={handleSectionChange}
            onSave={handleSave}
            saving={saving}
            onAIDraft={handleAIDraft}
            loadingDraft={loadingDraft}
            isDraftLoaded={isDraftLoaded}
            periodId={periodId}
            teacherId={teacherId}
          />
        </div>
      </div>
    </div>
  )
}

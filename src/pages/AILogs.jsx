import { useEffect, useState } from 'react'
import { getAiLogs, getAiLog } from '../lib/mockApi'
import { SparklesIcon, ClockIcon, CpuChipIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const fmt = n => Number(n || 0).toLocaleString()
const ms  = n => Number(n || 0) < 1000 ? `${Number(n || 0)} ms` : `${(Number(n) / 1000).toFixed(1)} s`

const FEATURE_LABEL = {
  question_suggestion: { label: 'Question Suggestion', color: 'bg-primary-100 text-primary-700' },
  individual_report:   { label: 'Individual Report',   color: 'bg-primary-200 text-primary-800' },
  department_report:   { label: 'Department Report',   color: 'bg-primary-700 text-white' },
}

const STATUS_STYLE = {
  success: 'bg-emerald-100 text-emerald-700',
  failed:  'bg-red-100 text-red-700',
}

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function LogModal({ log, onClose }) {
  if (!log) return null
  const feat = FEATURE_LABEL[log.feature] || { label: log.feature, color: 'bg-gray-100 text-gray-600' }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-5 h-5 text-primary-600" />
            <div>
              <p className="font-bold text-gray-800">AI Interaction Detail</p>
              <p className="text-xs text-gray-400">{log.uuid}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Feature',      value: <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${feat.color}`}>{feat.label}</span> },
              { label: 'Status',       value: <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[log.status]}`}>{log.status}</span> },
              { label: 'Model',        value: log.model_name },
              { label: 'Triggered by', value: `${log.triggered_by_name} (${log.triggered_by_role})` },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <div className="text-sm font-medium text-gray-800">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-primary-800 mb-3">🔢 Token Usage</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-2xl font-bold text-primary-700">{fmt(log.prompt_tokens)}</p><p className="text-xs text-gray-500">Prompt Tokens</p></div>
              <div><p className="text-2xl font-bold text-primary-600">{fmt(log.completion_tokens)}</p><p className="text-xs text-gray-500">Completion Tokens</p></div>
              <div><p className="text-2xl font-bold text-primary-800">{fmt(log.total_tokens)}</p><p className="text-xs text-gray-500">Total Tokens</p></div>
            </div>
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-primary-800 mb-3">⏱ Timing</p>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div><p className="text-xl font-bold text-primary-700">{ms(log.eval_duration_ms)}</p><p className="text-xs text-gray-500">Eval Duration</p></div>
              <div><p className="text-xl font-bold text-primary-800">{ms(log.total_duration_ms)}</p><p className="text-xs text-gray-500">Total</p></div>
            </div>
          </div>
          {log.status === 'failed' && log.error_message && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-700 mb-1">❌ Error</p>
              <p className="text-sm text-red-600 font-mono">{log.error_message}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">📤 Prompt</p>
            <pre className="bg-gray-900 text-green-300 text-xs rounded-xl p-4 overflow-x-auto whitespace-pre-wrap max-h-64">{log.prompt_text}</pre>
          </div>
          {log.response_text && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">📥 AI Response</p>
              <pre className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl p-4 overflow-x-auto whitespace-pre-wrap max-h-64">{log.response_text}</pre>
            </div>
          )}
          <div className="text-xs text-gray-400 space-y-0.5 border-t pt-3">
            <p>Created: {log.created_at?.slice(0, 19).replace('T', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AILogs() {
  const [logs, setLogs]           = useState([])
  const [stats, setStats]         = useState(null)
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState({ feature: '', status: '' })
  const [detailLog, setDetailLog] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const LIMIT = 20

  const load = () => {
    setLoading(true)
    const params = { page, limit: LIMIT }
    if (filter.feature) params.feature = filter.feature
    if (filter.status)  params.status  = filter.status
    getAiLogs(params)
      .then(r => { setLogs(r.data.data); setTotal(r.data.total); setStats(r.data.stats) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, filter])

  const openDetail = async id => {
    setDetailLoading(true)
    try {
      const r = await getAiLog(id)
      setDetailLog(r.data)
    } catch { setDetailLog(null) }
    finally { setDetailLoading(false) }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-primary-600" />
          AI Interaction Logs
        </h1>
        <p className="text-gray-500 text-sm mt-1">Every call made to the Ollama model — token usage, timing, prompts, and responses</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Calls"       value={fmt(stats.total_calls)}             icon={SparklesIcon}            color="bg-primary-700" />
          <StatCard label="Total Tokens"      value={fmt(stats.grand_total_tokens)}      icon={CpuChipIcon}             color="bg-primary-800" />
          <StatCard label="Prompt Tokens"     value={fmt(stats.total_prompt_tokens)}     icon={CpuChipIcon}             color="bg-primary-600" />
          <StatCard label="Completion Tokens" value={fmt(stats.total_completion_tokens)} icon={CpuChipIcon}             color="bg-primary-500" />
          <StatCard label="Avg Response"      value={ms(stats.avg_response_ms)}          icon={ClockIcon}               color="bg-emerald-600" />
          <StatCard label="Failed Calls"      value={fmt(stats.failed_calls)}            icon={ExclamationTriangleIcon} color="bg-red-600"    />
        </div>
      )}

      {stats && (
        <div className="card">
          <p className="text-sm font-semibold text-gray-700 mb-3">Calls by Feature</p>
          <div className="flex gap-4 flex-wrap">
            {[
              { key: 'suggestion_calls',       label: 'Question Suggestions', color: 'bg-primary-100 text-primary-700' },
              { key: 'individual_report_calls', label: 'Individual Reports',   color: 'bg-primary-200 text-primary-800' },
              { key: 'department_report_calls', label: 'Department Reports',   color: 'bg-primary-700 text-white' },
            ].map(f => (
              <div key={f.key} className={`px-4 py-2 rounded-xl ${f.color}`}>
                <p className="text-xl font-bold">{fmt(stats[f.key])}</p>
                <p className="text-xs font-medium">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        <select className="input w-52" value={filter.feature}
          onChange={e => { setFilter(f => ({ ...f, feature: e.target.value })); setPage(1) }}>
          <option value="">All Features</option>
          <option value="question_suggestion">Question Suggestion</option>
          <option value="individual_report">Individual Report</option>
          <option value="department_report">Department Report</option>
        </select>
        <select className="input w-40" value={filter.status}
          onChange={e => { setFilter(f => ({ ...f, status: e.target.value })); setPage(1) }}>
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <span className="text-sm text-gray-400">{total} records</span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading logs…</div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-16">
          <SparklesIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No AI interactions logged yet.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-medium">Feature</th>
                  <th className="px-4 py-3 font-medium">Triggered By</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium text-right">Prompt</th>
                  <th className="px-4 py-3 font-medium text-right">Completion</th>
                  <th className="px-4 py-3 font-medium text-right">Total Tokens</th>
                  <th className="px-4 py-3 font-medium text-right">Time</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => {
                  const feat = FEATURE_LABEL[log.feature] || { label: log.feature, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${feat.color}`}>{feat.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-xs">{log.triggered_by_name}</p>
                        <p className="text-gray-400 text-xs capitalize">{log.triggered_by_role}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{log.model_used || log.model_name}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">{fmt(log.prompt_tokens)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">{fmt(log.completion_tokens)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-primary-700 text-xs font-mono">{fmt(log.total_tokens)}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500 font-mono">{ms(log.total_duration_ms)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[log.status]}`}>{log.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {log.created_at?.slice(0, 16).replace('T', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openDetail(log.id)}
                          className="text-xs text-primary-600 hover:text-primary-800 hover:underline whitespace-nowrap">
                          View Detail
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <p className="text-xs text-gray-400">Page {page} of {totalPages} · {total} total records</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="btn-secondary text-xs px-3 py-1 disabled:opacity-40">← Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="btn-secondary text-xs px-3 py-1 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading detail…</p>
          </div>
        </div>
      )}
      {!detailLoading && detailLog && (
        <LogModal log={detailLog} onClose={() => setDetailLog(null)} />
      )}
    </div>
  )
}

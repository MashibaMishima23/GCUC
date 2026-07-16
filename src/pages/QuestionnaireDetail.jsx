import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getQuestionnaire, submitQuestionnaireForApproval, reviewQuestionnaire } from '../lib/mockApi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import ApprovalTimeline from '../components/ApprovalTimeline'
import {
  PaperAirplaneIcon, PencilIcon, CheckIcon,
  XMarkIcon, ArrowPathIcon, RocketLaunchIcon
} from '@heroicons/react/24/outline'

const STATUS_META = {
  draft:               { label: 'Draft',               color: 'bg-gray-100 text-gray-700',    banner: null },
  pending_dept:        { label: 'Pending Dept Review',  color: 'bg-yellow-100 text-yellow-700', banner: 'yellow' },
  dept_approved:       { label: 'Dept Approved',        color: 'bg-blue-100 text-blue-700',    banner: null },
  pending_vp:          { label: 'Pending VP Review',    color: 'bg-orange-100 text-orange-700', banner: 'orange' },
  vp_approved:         { label: 'VP Approved',          color: 'bg-indigo-100 text-indigo-700', banner: null },
  pending_president:   { label: 'Pending President',    color: 'bg-purple-100 text-purple-700', banner: 'purple' },
  fully_approved:      { label: 'Fully Approved ✅',    color: 'bg-green-100 text-green-700',  banner: 'green' },
  rejected:            { label: 'Rejected ❌',          color: 'bg-red-100 text-red-700',      banner: 'red' },
  revision_requested:  { label: 'Revision Requested 🔄',color: 'bg-amber-100 text-amber-700',  banner: 'amber' },
  archived:            { label: 'Archived',             color: 'bg-gray-100 text-gray-500',    banner: null },
}

const BANNER_STYLE = {
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  green:  'bg-green-50  border-green-200  text-green-800',
  red:    'bg-red-50    border-red-200    text-red-800',
  amber:  'bg-amber-50  border-amber-200  text-amber-800',
}

const LEVEL_LABEL = { dept: 'Department', vp: 'Vice President', president: 'President' }

function canActAt(role, status) {
  if (status === 'pending_dept'      && role === 'department_head') return 'dept'
  if (status === 'pending_vp'        && role === 'vp')              return 'vp'
  if (status === 'pending_president' && role === 'president')       return 'president'
  return null
}

function canSubmit(role, status) {
  return ['guidance','admin','staff'].includes(role) &&
    ['draft','revision_requested','rejected'].includes(status)
}

export default function QuestionnaireDetail() {
  const { id }       = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const [q, setQ]    = useState(null)
  const [loading, setLoading] = useState(true)

  const [modal, setModal]       = useState(null)
  const [comments, setComments] = useState('')
  const [saving, setSaving]     = useState(false)

  const load = () => {
    setLoading(true)
    getQuestionnaire(id)
      .then(r => setQ(r.data))
      .catch(() => toast.error('Failed to load questionnaire'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [id])

  const submitForApproval = async () => {
    try {
      await submitQuestionnaireForApproval(id)
      toast.success('Submitted for Department review')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const openReview = action => { setModal({ action }); setComments('') }
  const closeModal = () => { setModal(null); setComments('') }

  const submitReview = async () => {
    if (!comments.trim()) return toast.error('Comments are required')
    setSaving(true)
    try {
      await reviewQuestionnaire(id, { action: modal.action, comments })
      const labels = { approved: 'approved', rejected: 'rejected', revision_requested: 'returned for revision' }
      toast.success(`Questionnaire ${labels[modal.action]}`)
      closeModal()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>
  if (!q) return <div className="text-center py-12 text-gray-400">Questionnaire not found.</div>

  const sm = STATUS_META[q.status] || STATUS_META.draft
  const actingLevel = canActAt(user?.role, q.status)
  const canResubmit = canSubmit(user?.role, q.status)
  const isFullyApproved = q.status === 'fully_approved'

  const lastAction = [...(q.approval_history || [])].reverse()
    .find(h => ['rejected','revision_requested'].includes(h.action))

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="truncate">{q.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${sm.color}`}>
              {sm.label}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {q.evaluator_type} · {q.semester} Semester · S.Y. {q.school_year}
            {q.created_by_name && <span className="ml-2">· By <strong>{q.created_by_name}</strong></span>}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canResubmit && (
            <>
              <Link to={`/questionnaires/${id}/edit`} className="btn-secondary text-sm flex items-center gap-1">
                <PencilIcon className="w-4 h-4" /> Edit
              </Link>
              <button onClick={submitForApproval}
                className="btn-primary text-sm flex items-center gap-1">
                <PaperAirplaneIcon className="w-4 h-4" />
                {q.status === 'draft' ? 'Submit for Approval' : 'Resubmit for Approval'}
              </button>
            </>
          )}

          {actingLevel && (
            <>
              <button onClick={() => openReview('approved')}
                className="btn-success text-sm flex items-center gap-1">
                <CheckIcon className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => openReview('revision_requested')}
                className="btn-warning text-sm flex items-center gap-1">
                <ArrowPathIcon className="w-4 h-4" /> Request Revision
              </button>
              <button onClick={() => openReview('rejected')}
                className="btn-danger text-sm flex items-center gap-1">
                <XMarkIcon className="w-4 h-4" /> Reject
              </button>
            </>
          )}

          {isFullyApproved && (
            <span className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
              <RocketLaunchIcon className="w-4 h-4" />
              Ready to Deploy
            </span>
          )}
        </div>
      </div>

      {sm.banner && (
        <div className={`rounded-xl border p-4 ${BANNER_STYLE[sm.banner]}`}>
          {q.status === 'fully_approved' && (
            <p className="font-semibold">🎉 This questionnaire has been fully approved and can now be used in evaluation periods.</p>
          )}
          {q.status === 'rejected' && lastAction && (
            <>
              <p className="font-semibold">❌ Rejected at {LEVEL_LABEL[lastAction.level] || lastAction.level} level by {lastAction.actor_name}</p>
              <p className="text-sm mt-1">Reason: {lastAction.comments}</p>
            </>
          )}
          {q.status === 'revision_requested' && lastAction && (
            <>
              <p className="font-semibold">🔄 Revision requested at {LEVEL_LABEL[lastAction.level] || lastAction.level} level by {lastAction.actor_name}</p>
              <p className="text-sm mt-1">Instructions: {lastAction.comments}</p>
              {canResubmit && (
                <p className="text-sm mt-2 font-medium">Please edit the questionnaire and resubmit for approval.</p>
              )}
            </>
          )}
          {['pending_dept','pending_vp','pending_president'].includes(q.status) && (
            <p className="font-semibold">
              ⏳ Awaiting {LEVEL_LABEL[q.current_level] || q.current_level} review.
              {actingLevel && ' You can act on this questionnaire below.'}
            </p>
          )}
        </div>
      )}

      <ApprovalTimeline
        status={q.status}
        currentLevel={q.current_level}
        approvalHistory={q.approval_history || []}
      />

      {q.description && (
        <div className="card">
          <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
          <p className="text-gray-700">{q.description}</p>
        </div>
      )}

      {q.questions?.length > 0 && (() => {
        const counts = q.questions.reduce((acc, qu) => {
          const s = qu.source || 'manual'
          acc[s] = (acc[s] || 0) + 1
          return acc
        }, {})
        const cfg = {
          manual:       { label: 'Manual',       color: 'bg-gray-100 text-gray-600',     icon: '✏️' },
          ai_generated: { label: 'AI Generated', color: 'bg-purple-100 text-purple-700', icon: '🤖' },
          ai_edited:    { label: 'AI Edited',    color: 'bg-blue-100 text-blue-700',     icon: '🤖✏️' },
        }
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3 flex-wrap">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Question Sources</p>
            {Object.entries(counts).map(([src, n]) => (
              <span key={src} className={`text-xs px-2 py-1 rounded-full font-medium ${cfg[src]?.color || 'bg-gray-100 text-gray-600'}`}>
                {cfg[src]?.icon} {n} {cfg[src]?.label}
              </span>
            ))}
            <span className="text-xs text-gray-400 ml-auto">{q.questions.length} total</span>
          </div>
        )
      })()}

      <div className="card space-y-4">
        <h2>Questions ({q.questions?.length || 0})</h2>
        {(q.questions || []).map((question, i) => {
          const srcCfg = {
            manual:       { label: 'Manual',       color: 'bg-gray-100 text-gray-600',     icon: '✏️', border: 'border-gray-200 bg-gray-50' },
            ai_generated: { label: 'AI Generated', color: 'bg-purple-100 text-purple-700', icon: '🤖', border: 'border-purple-200 bg-purple-50/30' },
            ai_edited:    { label: 'AI Edited',    color: 'bg-blue-100 text-blue-700',     icon: '🤖✏️', border: 'border-blue-200 bg-blue-50/30' },
          }
          const src = question.source || 'manual'
          const c   = srcCfg[src] || srcCfg.manual
          return (
            <div key={question.id} className={`border rounded-lg p-4 ${c.border}`}>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <p className="text-gray-800 font-medium">{question.text}</p>
                  {src === 'ai_edited' && question.ai_original_text && (
                    <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2 text-blue-700">
                      <span className="font-semibold">Original AI text: </span>
                      <span className="italic">"{question.ai_original_text}"</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.color}`}>
                      {c.icon} {c.label}
                    </span>
                    <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      {question.type === 'rating' ? '⭐ Rating 1–5' : '📝 Open-ended'}
                    </span>
                    {question.category && (
                      <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                        {question.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {(!q.questions || q.questions.length === 0) && (
          <p className="text-gray-400 text-sm text-center py-4">No questions added yet.</p>
        )}
      </div>

      <Link to="/questionnaires" className="btn-secondary text-sm inline-block">← Back to Questionnaires</Link>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className={`font-semibold ${
              modal.action === 'approved'           ? 'text-green-700' :
              modal.action === 'revision_requested' ? 'text-amber-600' : 'text-red-700'
            }`}>
              {modal.action === 'approved'           ? `✅ Approve at ${LEVEL_LABEL[actingLevel]} Level` :
               modal.action === 'revision_requested' ? '🔄 Request Revision' :
                                                      '❌ Reject Questionnaire'}
            </h2>
            <div>
              <label className="label">
                {modal.action === 'approved' ? 'Approval Comments *' :
                 modal.action === 'revision_requested' ? 'Revision Instructions *' : 'Reason for Rejection *'}
              </label>
              <textarea className="input" rows={4} autoFocus
                placeholder="Add your comments here…"
                value={comments}
                onChange={e => setComments(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={closeModal} className="btn-secondary" disabled={saving}>Cancel</button>
              <button
                onClick={submitReview}
                disabled={saving || !comments.trim()}
                className={
                  modal.action === 'approved'           ? 'btn-success' :
                  modal.action === 'revision_requested' ? 'btn-warning' : 'btn-danger'
                }>
                {saving ? 'Submitting…' :
                  modal.action === 'approved'           ? 'Confirm Approval' :
                  modal.action === 'revision_requested' ? 'Send for Revision' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPendingApprovals, reviewQuestionnaire } from '../lib/mockApi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  CheckIcon, XMarkIcon, ArrowPathIcon,
  ClockIcon, ChevronDownIcon, ChevronUpIcon
} from '@heroicons/react/24/outline'
import ApprovalTimeline from '../components/ApprovalTimeline'

const STATUS_META = {
  draft:               { label: 'Draft',              color: 'bg-gray-100 text-gray-600' },
  pending_dept:        { label: 'Pending Dept Review', color: 'bg-amber-100 text-amber-700' },
  dept_approved:       { label: 'Dept Approved',       color: 'bg-primary-100 text-primary-700' },
  pending_vp:          { label: 'Pending VP Review',   color: 'bg-orange-100 text-orange-700' },
  vp_approved:         { label: 'VP Approved',         color: 'bg-primary-200 text-primary-800' },
  pending_president:   { label: 'Pending President',   color: 'bg-primary-800 text-white' },
  fully_approved:      { label: 'Fully Approved',      color: 'bg-emerald-100 text-emerald-700' },
  rejected:            { label: 'Rejected',            color: 'bg-red-100 text-red-700' },
  revision_requested:  { label: 'Revision Requested',  color: 'bg-amber-100 text-amber-700' },
  archived:            { label: 'Archived',            color: 'bg-gray-100 text-gray-500' },
}

const LEVEL_LABEL = {
  pending_dept:      'Department',
  pending_vp:        'Vice President',
  pending_president: 'President (Final)',
}

const actionConfig = {
  approved:           { label: 'Approve',          btnClass: 'btn-success',  icon: CheckIcon },
  revision_requested: { label: 'Request Revision', btnClass: 'btn-warning',  icon: ArrowPathIcon },
  rejected:           { label: 'Reject',           btnClass: 'btn-danger',   icon: XMarkIcon },
}

export default function ApprovalQueue() {
  const { user } = useAuth()
  const [pending, setPending]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState({})
  const [modal, setModal]       = useState(null)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getPendingApprovals()
      .then(r => setPending(r.data))
      .catch(() => toast.error('Failed to load approval queue'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleExpand = id =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const openModal = (id, action) => { setModal({ id, action }); setComments('') }
  const closeModal = () => { setModal(null); setComments('') }

  const submitDecision = async () => {
    if (!comments.trim()) return toast.error('Comments are required')
    setSubmitting(true)
    try {
      await reviewQuestionnaire(modal.id, { action: modal.action, comments })
      const labels = { approved: 'approved', rejected: 'rejected', revision_requested: 'returned for revision' }
      toast.success(`Questionnaire ${labels[modal.action]}`)
      closeModal()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Approval Queue</h1>
        <p className="text-gray-500 text-sm">
          Multi-level questionnaire approval: Department → Vice President → President
        </p>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-sm text-primary-900">
        <p className="font-semibold mb-1">📋 Approval Workflow</p>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">1. Department Review</span>
          <span className="text-primary-400">→</span>
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">2. VP Review</span>
          <span className="text-primary-400">→</span>
          <span className="bg-primary-800 text-white px-2 py-1 rounded-full font-medium">3. President Final</span>
          <span className="text-primary-400">→</span>
          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">✅ Fully Approved</span>
        </div>
        <p className="text-xs mt-2 text-primary-700">
          Your role ({user?.role?.replace('_',' ')}) can act on items shown below.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : pending.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-green-600 font-medium text-lg">✅ All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No questionnaires pending your review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map(item => {
            const sm = STATUS_META[item.status] || STATUS_META.draft
            const isExpanded = expanded[item.id]
            return (
              <div key={item.id} className="card space-y-0 p-0 overflow-hidden">
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link to={`/questionnaires/${item.id}`}
                          className="font-semibold text-gray-800 hover:text-primary-700 text-base">
                          {item.title}
                        </Link>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sm.color}`}>
                          {sm.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {item.semester} Semester · S.Y. {item.school_year}
                        {item.created_by_name && <span className="ml-2">· By <strong>{item.created_by_name}</strong></span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        Awaiting <strong className="ml-0.5">{LEVEL_LABEL[item.status] || 'Review'}</strong> · {item.question_count ?? 0} questions
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {Object.entries(actionConfig).map(([action, cfg]) => {
                        const Icon = cfg.icon
                        return (
                          <button key={action} onClick={() => openModal(item.id, action)}
                            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${cfg.btnClass}`}>
                            <Icon className="w-4 h-4" />
                            {cfg.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <button onClick={() => toggleExpand(item.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-700 transition-colors">
                    {isExpanded ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                    {isExpanded ? 'Hide approval history' : 'Show approval history'}
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                    <ApprovalTimeline
                      status={item.status}
                      currentLevel={item.current_level}
                      approvalHistory={item.approval_history || []}
                    />
                    <div className="mt-3 flex justify-end">
                      <Link to={`/questionnaires/${item.id}`} className="text-sm text-primary-700 hover:underline">
                        View full questionnaire →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className={
              modal.action === 'approved' ? 'text-green-700 font-semibold' :
              modal.action === 'revision_requested' ? 'text-amber-600 font-semibold' :
              'text-red-700 font-semibold'
            }>
              {modal.action === 'approved' ? '✅ Approve Questionnaire' :
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
                value={comments} onChange={e => setComments(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Comments are required and visible in approval history.</p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={closeModal} className="btn-secondary" disabled={submitting}>Cancel</button>
              <button onClick={submitDecision} disabled={submitting || !comments.trim()}
                className={
                  modal.action === 'approved' ? 'btn-success' :
                  modal.action === 'revision_requested' ? 'btn-warning' : 'btn-danger'
                }>
                {submitting ? 'Submitting…' :
                  modal.action === 'approved' ? 'Confirm Approval' :
                  modal.action === 'revision_requested' ? 'Send for Revision' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

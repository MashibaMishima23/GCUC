import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  CheckIcon, XMarkIcon, ArrowPathIcon, ClockIcon,
  ClipboardDocumentListIcon, ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import ApprovalTimeline from '../components/ApprovalTimeline'
import ReviewModal from '../components/ReviewModal'

const STATUS_META = {
  draft:               { label: 'Draft',              color: 'bg-gray-100 text-gray-600' },
  pending_dept:        { label: 'Pending Dept',        color: 'bg-amber-100 text-amber-700' },
  dept_approved:       { label: 'Dept Approved',       color: 'bg-primary-100 text-primary-700' },
  pending_vp:          { label: 'Pending VP',          color: 'bg-orange-100 text-orange-700' },
  vp_approved:         { label: 'VP Approved',         color: 'bg-primary-200 text-primary-800' },
  pending_president:   { label: 'Pending President',   color: 'bg-primary-800 text-white' },
  fully_approved:      { label: 'Fully Approved',      color: 'bg-emerald-100 text-emerald-700' },
  rejected:            { label: 'Rejected',            color: 'bg-red-100 text-red-700' },
  revision_requested:  { label: 'Revision Requested',  color: 'bg-amber-100 text-amber-700' },
}

const LEVEL_LABEL = {
  pending_dept:      'Department',
  pending_vp:        'Vice President',
  pending_president: 'President (Final)',
}

const SOURCE_CFG = {
  manual:       { label: 'Manual',       color: 'bg-gray-100 text-gray-600',      icon: '✏️' },
  ai_generated: { label: 'AI Generated', color: 'bg-primary-100 text-primary-700', icon: '🤖' },
  ai_edited:    { label: 'AI Edited',    color: 'bg-primary-200 text-primary-800', icon: '🤖✏️' },
}

const ACTION_STYLE = {
  approved:           { bg: 'bg-green-50 border-green-200',   text: 'text-green-700',  icon: '✅', label: 'Approved' },
  rejected:           { bg: 'bg-red-50 border-red-200',       text: 'text-red-700',    icon: '❌', label: 'Rejected' },
  revision_requested: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: '🔄', label: 'Revision Requested' },
  submitted:          { bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',   icon: '📤', label: 'Submitted' },
}

export default function ApprovalQueue() {
  const { user } = useAuth()
  const [pending, setPending]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [selected, setSelected]           = useState(null)
  const [fullDetail, setFullDetail]       = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab]         = useState('questions')
  const [modal, setModal]                 = useState(null)
  const [comments, setComments]           = useState('')
  const [submitting, setSubmitting]       = useState(false)

  const loadQueue = () => {
    setLoading(true)
    api.get('/questionnaires/approval/pending')
      .then(r => {
        setPending(r.data)
        if (r.data.length > 0) selectItem(r.data[0].id)
      })
      .catch(() => toast.error('Failed to load approval queue'))
      .finally(() => setLoading(false))
  }
  useEffect(loadQueue, [])

  const selectItem = async (id) => {
    setSelected(id)
    setActiveTab('questions')
    setDetailLoading(true)
    try {
      const r = await api.get(`/questionnaires/${id}`)
      setFullDetail(r.data)
    } catch {
      setFullDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const openModal  = (id, action) => { setModal({ id, action }); setComments('') }
  const closeModal = () => { setModal(null); setComments('') }

  const submitDecision = async () => {
    if (!comments.trim()) return toast.error('Comments are required')
    setSubmitting(true)
    try {
      await api.post(`/questionnaires/${modal.id}/review`, { action: modal.action, comments })
      const labels = { approved: 'approved', rejected: 'rejected', revision_requested: 'returned for revision' }
      toast.success(`Questionnaire ${labels[modal.action]}`)
      closeModal()
      setFullDetail(null)
      loadQueue()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSubmitting(false) }
  }

  const selectedItem = pending.find(p => p.id === selected)
  const questions    = fullDetail?.questions        || []
  const history      = fullDetail?.approval_history || selectedItem?.approval_history || []

  if (loading) return <div className="text-center py-16 text-gray-400">Loading…</div>

  if (pending.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Approval Queue</h1>
          <p className="text-gray-500 text-sm">Multi-level questionnaire approval: Department → Vice President → President</p>
        </div>
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-green-600 font-semibold text-lg">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No questionnaires pending your review.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1>Approval Queue</h1>
          <p className="text-gray-500 text-sm">
            Role: <strong className="capitalize">{user?.role?.replace('_',' ')}</strong> · {pending.length} item{pending.length !== 1 ? 's' : ''} pending
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          {[
            { label: '1. Department', color: 'bg-amber-100 text-amber-700' },
            { label: '2. VP Review',  color: 'bg-orange-100 text-orange-700' },
            { label: '3. President',  color: 'bg-primary-800 text-white' },
            { label: '✅ Deployed',   color: 'bg-emerald-100 text-emerald-700' },
          ].map((s, i, arr) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={`px-2.5 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
              {i < arr.length - 1 && <span className="text-gray-300">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex gap-4 items-start" style={{ minHeight: '72vh' }}>

        {/* Left: queue list */}
        <div className="w-64 flex-shrink-0 space-y-2">
          {pending.map(item => {
            const sm = STATUS_META[item.status] || STATUS_META.draft
            const isActive = item.id === selected
            return (
              <button key={item.id} onClick={() => selectItem(item.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-primary-50 border-primary-300 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                }`}>
                <p className={`text-sm font-semibold leading-snug line-clamp-2 mb-1 ${isActive ? 'text-primary-800' : 'text-gray-800'}`}>
                  {item.title}
                </p>
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sm.color}`}>{sm.label}</span>
                  <span className="text-xs text-gray-400">{item.question_count ?? 0}q</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  {LEVEL_LABEL[item.status] || 'Review'}
                </p>
              </button>
            )
          })}
        </div>

        {/* Right: detail panel */}
        {selectedItem && (
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-800 leading-tight">{selectedItem.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <span className="capitalize">{selectedItem.evaluator_type}</span> evaluation
                    · {selectedItem.semester} Semester · S.Y. {selectedItem.school_year}
                    {selectedItem.created_by_name && (
                      <span className="ml-1.5">· By <strong>{selectedItem.created_by_name}</strong></span>
                    )}
                  </p>
                  {fullDetail?.source_summary && (
                    <div className="flex gap-1.5 flex-wrap mt-1.5">
                      {Object.entries(fullDetail.source_summary).map(([src, n]) => {
                        const cfg = SOURCE_CFG[src] || SOURCE_CFG.manual
                        return (
                          <span key={src} className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                            {cfg.icon} {n} {cfg.label}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <button onClick={() => openModal(selectedItem.id, 'approved')}
                    className="btn-success flex items-center gap-1.5 text-sm">
                    <CheckIcon className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => openModal(selectedItem.id, 'revision_requested')}
                    className="btn-warning flex items-center gap-1.5 text-sm">
                    <ArrowPathIcon className="w-4 h-4" /> Revision
                  </button>
                  <button onClick={() => openModal(selectedItem.id, 'rejected')}
                    className="btn-danger flex items-center gap-1.5 text-sm">
                    <XMarkIcon className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>

              {/* Approval progress — always visible */}
              <div className="mt-4">
                <ApprovalTimeline
                  status={selectedItem.status}
                  currentLevel={selectedItem.current_level}
                  approvalHistory={history}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-white">
              {[
                { key: 'questions', label: 'Questions',        Icon: ClipboardDocumentListIcon, count: questions.length || selectedItem.question_count || 0 },
                { key: 'history',   label: 'Approval History', Icon: ChatBubbleLeftRightIcon,   count: history.length },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-700 bg-primary-50/40'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  <tab.Icon className="w-4 h-4" />
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* Questions */}
              {activeTab === 'questions' && (
                detailLoading ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
                    <p className="text-sm">Loading questions…</p>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-12 text-gray-300">
                    <ClipboardDocumentListIcon className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No questions found.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, i) => {
                      const src = q.source || 'manual'
                      const cfg = SOURCE_CFG[src] || SOURCE_CFG.manual
                      return (
                        <div key={q.id ?? i}
                          className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                          <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 font-medium leading-snug">{q.text}</p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                              <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                                {q.type === 'rating' ? '⭐ Rating 1–5' : '📝 Open-ended'}
                              </span>
                              {q.category && (
                                <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                  {q.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}

              {/* History */}
              {activeTab === 'history' && (
                history.length === 0 ? (
                  <div className="text-center py-12 text-gray-300">
                    <ChatBubbleLeftRightIcon className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No approval history yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...history].reverse().map((entry, i) => {
                      const style = ACTION_STYLE[entry.action] || ACTION_STYLE.submitted
                      const levelLabel = { dept:'Department', vp:'Vice President', president:'President' }[entry.level] || entry.level
                      return (
                        <div key={entry.id ?? i} className={`rounded-xl border p-4 flex gap-3 ${style.bg}`}>
                          <span className="text-lg flex-shrink-0">{style.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-xs font-semibold ${style.text}`}>{style.label}</span>
                              <span className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">{levelLabel}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-800">
                              {entry.actor_name}
                              <span className="text-gray-500 font-normal ml-1 text-xs capitalize">
                                ({entry.actor_role?.replace('_',' ')})
                              </span>
                            </p>
                            {entry.comments && (
                              <p className="text-sm text-gray-600 mt-1 italic">"{entry.comments}"</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {entry.acted_at?.slice(0,16).replace('T',' ')}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {modal && (
        <ReviewModal
          action={modal.action}
          actingLevel={null}
          comments={comments}
          onChange={setComments}
          onSubmit={submitDecision}
          onClose={closeModal}
          saving={submitting}
        />
      )}
    </div>
  )
}

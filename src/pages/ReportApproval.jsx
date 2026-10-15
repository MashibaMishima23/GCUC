import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPendingApprovalReports, reviewReport } from '../lib/mockApi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { CheckIcon, XMarkIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function ReportApproval() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading]  = useState(true)
  const [modal, setModal]      = useState(null)
  const [notes, setNotes]      = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getPendingApprovalReports()
      .then(r => setReports(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openModal = (id, action, title) => { setModal({ id, action, title }); setNotes('') }
  const closeModal = () => { setModal(null); setNotes('') }

  const submitReview = async () => {
    if (modal.action === 'rejected' && !notes.trim())
      return toast.error('Please provide a reason for rejection')
    setSubmitting(true)
    try {
      await reviewReport(modal.id, { action: modal.action, notes })
      toast.success(`Report ${modal.action}`)
      closeModal()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Report Approval Queue</h1>
        <p className="text-gray-500 text-sm">Review and approve narrative reports from the Guidance Office.</p>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex gap-3">
        <DocumentTextIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-primary-800">
            {user?.role === 'president' ? 'College President' : 'Vice President'} — Report Review
          </p>
          <p className="text-sm text-primary-700 mt-0.5">
            Approved reports are officially released. Rejected reports are returned to Guidance for revision.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-green-600 font-semibold text-lg">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No reports pending your review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => (
            <div key={r.id} className="card space-y-3">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.report_type === 'individual' ? 'bg-primary-100 text-primary-700' : 'bg-primary-700 text-white'
                    }`}>{r.report_type}</span>
                    {r.generated_by_ai === 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✍ Human-written</span>}
                    {r.generated_by_ai === 1 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">🤖 AI-assisted</span>}
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                      <ClockIcon className="w-3 h-3" /> Pending Approval
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800">
                    {r.report_type === 'individual' ? r.teacher_name : r.department_name}
                  </h3>
                  <p className="text-sm text-gray-500">{r.period_title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Avg: <strong>{parseFloat(r.average_score || 0).toFixed(2)}/5.00</strong>
                    {' '}· {r.total_evaluations} evaluations
                    {r.submitted_for_approval_at && ` · Submitted ${r.submitted_for_approval_at.slice(0,10)}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link to={`/reports/${r.id}`} className="btn-secondary text-sm">View Report</Link>
                  <button onClick={() => openModal(r.id, 'approved', r.report_type === 'individual' ? r.teacher_name : r.department_name)}
                    className="btn-success flex items-center gap-1.5 text-sm">
                    <CheckIcon className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => openModal(r.id, 'rejected', r.report_type === 'individual' ? r.teacher_name : r.department_name)}
                    className="btn-danger flex items-center gap-1.5 text-sm">
                    <XMarkIcon className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
              {r.narrative && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Narrative Preview</p>
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{r.narrative}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className={`font-semibold text-lg ${modal.action === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
              {modal.action === 'approved' ? '✅ Approve Report' : '❌ Reject Report'}
            </h2>
            <p className="text-sm text-gray-600">
              {modal.action === 'approved'
                ? `Approving "${modal.title}" will make it officially released.`
                : `Rejecting will return this to Guidance for revision.`}
            </p>
            <div>
              <label className="label">{modal.action === 'approved' ? 'Notes (optional)' : 'Reason *'}</label>
              <textarea className="input" rows={4} autoFocus
                placeholder={modal.action === 'approved' ? 'Optional notes…' : 'Explain what needs revision…'}
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={closeModal} className="btn-secondary" disabled={submitting}>Cancel</button>
              <button onClick={submitReview}
                disabled={submitting || (modal.action === 'rejected' && !notes.trim())}
                className={modal.action === 'approved' ? 'btn-success' : 'btn-danger'}>
                {submitting ? 'Submitting…' : modal.action === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

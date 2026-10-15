/**
 * ReviewModal — shared approval action modal used in both
 * ApprovalQueue and QuestionnaireDetail pages.
 *
 * Props:
 *   action       – 'approved' | 'revision_requested' | 'rejected'
 *   actingLevel  – 'dept' | 'vp' | 'president' | null (from QuestionnaireDetail)
 *   comments     – controlled textarea value
 *   onChange     – setter for comments
 *   onSubmit     – async handler
 *   onClose      – close handler
 *   saving       – boolean
 */

const LEVEL_LABEL = { dept: 'Department', vp: 'Vice President', president: 'President' }

export default function ReviewModal({ action, actingLevel, comments, onChange, onSubmit, onClose, saving }) {
  if (!action) return null

  const titles = {
    approved:           actingLevel
                          ? `✅ Approve at ${LEVEL_LABEL[actingLevel] || actingLevel} Level`
                          : '✅ Approve Questionnaire',
    revision_requested: '🔄 Request Revision',
    rejected:           '❌ Reject Questionnaire',
  }

  const placeholders = {
    approved:           'e.g. Questionnaire meets all evaluation standards and is approved for the next level…',
    revision_requested: 'e.g. Please revise question #3 to be more specific. Question #7 needs clearer language…',
    rejected:           'e.g. This questionnaire does not align with institutional evaluation guidelines…',
  }

  const labelText = {
    approved:           'Approval Comments *',
    revision_requested: 'Revision Instructions *',
    rejected:           'Reason for Rejection *',
  }

  const titleColor = {
    approved:           'text-green-700',
    revision_requested: 'text-amber-600',
    rejected:           'text-red-700',
  }

  const btnClass = {
    approved:           'btn-success',
    revision_requested: 'btn-warning',
    rejected:           'btn-danger',
  }

  const confirmLabel = {
    approved:           'Confirm Approval',
    revision_requested: 'Send for Revision',
    rejected:           'Confirm Rejection',
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">

        {/* Title */}
        <h2 className={`font-semibold text-lg ${titleColor[action]}`}>
          {titles[action]}
        </h2>

        {/* Context message */}
        {action === 'approved' && (
          <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800">
            {actingLevel === 'president'
              ? '🎉 Final approval — this questionnaire will be fully approved and ready for deployment.'
              : actingLevel
              ? `After approval, this will automatically be forwarded to the ${LEVEL_LABEL[actingLevel === 'dept' ? 'vp' : 'president']} for review.`
              : 'Approving will automatically forward this questionnaire to the next approver.'}
          </div>
        )}
        {action === 'revision_requested' && (
          <p className="text-sm text-gray-600">
            The questionnaire will be returned to the creator with your revision notes.
            They must edit and resubmit through the full approval process.
          </p>
        )}
        {action === 'rejected' && (
          <p className="text-sm text-gray-600">
            This will permanently stop the approval process. The creator will be notified with your reason.
          </p>
        )}

        {/* Comment textarea */}
        <div>
          <label className="label">{labelText[action]}</label>
          <textarea
            className="input"
            rows={4}
            autoFocus
            placeholder={placeholders[action]}
            value={comments}
            onChange={e => onChange(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            Comments are required and will be visible in the approval history.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="btn-secondary" disabled={saving}>
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={saving || !comments.trim()}
            className={btnClass[action]}>
            {saving ? 'Submitting…' : confirmLabel[action]}
          </button>
        </div>
      </div>
    </div>
  )
}

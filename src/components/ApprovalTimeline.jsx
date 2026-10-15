/**
 * ApprovalTimeline
 * Shows the 3-step approval chain with status indicators and history entries.
 *
 * Props:
 *   status          – current questionnaire status string
 *   currentLevel    – 'dept' | 'vp' | 'president' | null
 *   approvalHistory – array of approval log entries
 */

const LEVELS = [
  { key: 'dept',      label: 'Department',    sublabel: 'Department Head / Guidance' },
  { key: 'vp',        label: 'Vice President', sublabel: 'VP Review' },
  { key: 'president', label: 'President',      sublabel: 'Final Approval' },
]

const ACTION_STYLE = {
  approved:           { bg: 'bg-green-100',  text: 'text-green-700',  icon: '✅', label: 'Approved'  },
  rejected:           { bg: 'bg-red-100',    text: 'text-red-700',    icon: '❌', label: 'Rejected'  },
  revision_requested: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🔄', label: 'Revision Requested' },
  submitted:          { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '📤', label: 'Submitted' },
}

function levelStatus(levelKey, status, currentLevel, history) {
  // Find the last relevant action for this level
  const entries = (history || []).filter(h => h.level === levelKey)
  const last = entries[entries.length - 1]

  if (!last) {
    // Nothing done at this level yet
    if (currentLevel === levelKey) return 'pending'
    return 'waiting'
  }
  if (last.action === 'approved')           return 'approved'
  if (last.action === 'rejected')           return 'rejected'
  if (last.action === 'revision_requested') return 'revision'
  if (last.action === 'submitted')          return currentLevel === levelKey ? 'pending' : 'waiting'
  return 'waiting'
}

function LevelBadge({ state }) {
  const cfg = {
    approved: { bg: 'bg-green-500',  icon: '✓', ring: 'ring-green-200' },
    rejected: { bg: 'bg-red-500',    icon: '✗', ring: 'ring-red-200' },
    revision: { bg: 'bg-yellow-400', icon: '↺', ring: 'ring-yellow-200' },
    pending:  { bg: 'bg-blue-500 animate-pulse', icon: '…', ring: 'ring-blue-200' },
    waiting:  { bg: 'bg-gray-300',   icon: '○', ring: 'ring-gray-100' },
  }
  const c = cfg[state] || cfg.waiting
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ring-4 ${c.bg} ${c.ring} flex-shrink-0`}>
      {c.icon}
    </div>
  )
}

export default function ApprovalTimeline({ status, currentLevel, approvalHistory = [] }) {
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
        📋 Approval Progress
      </h3>

      {/* 3-step visual chain */}
      <div className="flex items-start gap-0">
        {LEVELS.map((lv, idx) => {
          const state = levelStatus(lv.key, status, currentLevel, approvalHistory)
          const isLast = idx === LEVELS.length - 1
          return (
            <div key={lv.key} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  <LevelBadge state={state} />
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-1 ${
                      state === 'approved' ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
                <div className="mt-2 text-center px-1">
                  <p className="text-xs font-semibold text-gray-700">{lv.label}</p>
                  <p className="text-xs text-gray-400">{lv.sublabel}</p>
                  <p className={`text-xs font-medium mt-0.5 ${
                    state === 'approved' ? 'text-green-600' :
                    state === 'rejected' ? 'text-red-600' :
                    state === 'revision' ? 'text-yellow-600' :
                    state === 'pending'  ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {state === 'approved' ? 'Approved' :
                     state === 'rejected' ? 'Rejected' :
                     state === 'revision' ? 'Revision Needed' :
                     state === 'pending'  ? 'Awaiting Review' : 'Waiting'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Full history log */}
      {approvalHistory.length > 0 && (
        <div className="border-t pt-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Approval History</p>
          {approvalHistory.map(entry => {
            const style = ACTION_STYLE[entry.action] || ACTION_STYLE.submitted
            const levelLabel = { dept:'Department', vp:'VP', president:'President' }[entry.level] || entry.level
            return (
              <div key={entry.id} className={`rounded-lg p-3 ${style.bg} flex gap-3`}>
                <span className="text-base flex-shrink-0">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold ${style.text}`}>
                      {style.label}
                    </span>
                    <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full text-gray-600">
                      {levelLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mt-0.5">
                    <strong>{entry.actor_name}</strong>
                    <span className="text-gray-500 ml-1 capitalize">({entry.actor_role?.replace('_',' ')})</span>
                    <span className="text-gray-400 ml-2">{entry.acted_at?.slice(0,16).replace('T',' ')}</span>
                  </p>
                  {entry.comments && (
                    <p className="text-xs text-gray-600 mt-1 italic">"{entry.comments}"</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { PlusIcon, PaperAirplaneIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

// All possible statuses in the new workflow
const ALL_STATUSES = [
  { value: '',                   label: 'All' },
  { value: 'draft',              label: 'Draft' },
  { value: 'pending_dept',       label: 'Pending Dept' },
  { value: 'dept_approved',      label: 'Dept Approved' },
  { value: 'pending_vp',         label: 'Pending VP' },
  { value: 'vp_approved',        label: 'VP Approved' },
  { value: 'pending_president',  label: 'Pending President' },
  { value: 'fully_approved',     label: 'Fully Approved' },
  { value: 'rejected',           label: 'Rejected' },
  { value: 'revision_requested', label: 'Revision Needed' },
]

const STATUS_BADGE = {
  draft:               'bg-gray-100 text-gray-600',
  pending_dept:        'bg-amber-100 text-amber-700',
  dept_approved:       'bg-primary-100 text-primary-700',
  pending_vp:          'bg-orange-100 text-orange-700',
  vp_approved:         'bg-primary-200 text-primary-800',
  pending_president:   'bg-primary-800 text-white',
  fully_approved:      'bg-emerald-100 text-emerald-700',
  rejected:            'bg-red-100 text-red-700',
  revision_requested:  'bg-amber-100 text-amber-700',
  archived:            'bg-gray-100 text-gray-500',
}

const STATUS_LABEL = {
  draft:               'Draft',
  pending_dept:        'Pending Dept',
  dept_approved:       'Dept Approved',
  pending_vp:          'Pending VP',
  vp_approved:         'VP Approved',
  pending_president:   'Pending President',
  fully_approved:      'Fully Approved ✅',
  rejected:            'Rejected ❌',
  revision_requested:  'Revision Needed 🔄',
  archived:            'Archived',
  // legacy
  pending_approval:    'Pending (legacy)',
  approved:            'Approved (legacy)',
}

// Determine what pipeline stage icon to show
const PIPELINE_ICON = {
  draft:               '📝',
  pending_dept:        '🏢',
  dept_approved:       '✓🏢',
  pending_vp:          '👔',
  vp_approved:         '✓👔',
  pending_president:   '🏛️',
  fully_approved:      '🎉',
  rejected:            '❌',
  revision_requested:  '🔄',
}

export default function Questionnaires() {
  const { user, can } = useAuth()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')
  const [search, setSearch]   = useState('')

  const load = () => {
    setLoading(true)
    const params = {}
    if (filter) params.status = filter
    // non-admin roles only see their own questionnaires by default
    if (!can('guidance','admin','president','vp')) params.my = '1'
    api.get('/questionnaires', { params })
      .then(r => setItems(r.data))
      .catch(() => toast.error('Failed to load questionnaires'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filter])

  const submitApproval = async id => {
    try {
      await api.post(`/questionnaires/${id}/submit-approval`)
      toast.success('Submitted for Department approval')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const canSubmitQ = q =>
    can('guidance','admin','staff') &&
    ['draft','revision_requested','rejected'].includes(q.status)

  const canEditQ = q =>
    can('guidance','admin','staff') &&
    ['draft','revision_requested','rejected'].includes(q.status)

  const filtered = search
    ? items.filter(q =>
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.created_by_name?.toLowerCase().includes(search.toLowerCase())
      )
    : items

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Questionnaires</h1>
          <p className="text-gray-500 text-sm">
            Manage evaluation questionnaires — requires 3-level approval before deployment
          </p>
        </div>
        {can('guidance','admin','staff') && (
          <Link to="/questionnaires/new" className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> New Questionnaire
          </Link>
        )}
      </div>

      {/* Approval pipeline legend */}
      {can('guidance','admin','staff','department_head','vp','president') && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-2 flex-wrap text-xs text-gray-600">
          <span className="font-medium text-gray-700 mr-1">Approval Chain:</span>
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Dept Review</span>
          <span>→</span>
          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">VP Review</span>
          <span>→</span>
          <span className="bg-primary-800 text-white px-2 py-0.5 rounded-full">President</span>
          <span>→</span>
          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Fully Approved</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative min-w-52 flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search title or creator…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ALL_STATUSES.map(s => (
            <button key={s.value} onClick={() => setFilter(s.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === s.value
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {search ? 'No questionnaires match your search.' : 'No questionnaires found.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => {
            const badge = STATUS_BADGE[q.status] || 'bg-gray-100 text-gray-600'
            const label = STATUS_LABEL[q.status] || q.status
            const icon  = PIPELINE_ICON[q.status] || '📄'

            return (
              <div key={q.id} className="card flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <Link to={`/questionnaires/${q.id}`}
                        className="font-semibold text-gray-800 hover:text-primary-700 truncate">
                        {q.title}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>
                        {label}
                      </span>
                      <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                        {q.evaluator_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {q.semester} Semester · S.Y. {q.school_year}
                      {q.created_by_name && <span className="ml-1">· {q.created_by_name}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`/questionnaires/${q.id}`} className="btn-secondary text-sm">View</Link>
                  {canEditQ(q) && (
                    <Link to={`/questionnaires/${q.id}/edit`} className="btn-secondary text-sm">Edit</Link>
                  )}
                  {canSubmitQ(q) && (
                    <button onClick={() => submitApproval(q.id)}
                      className="btn-primary text-sm flex items-center gap-1">
                      <PaperAirplaneIcon className="w-3.5 h-3.5" />
                      {q.status === 'draft' ? 'Submit' : 'Resubmit'}
                    </button>
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

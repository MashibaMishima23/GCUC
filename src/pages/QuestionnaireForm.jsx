import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getQuestionnaire, createQuestionnaire, updateQuestionnaire, aiSuggestQuestions
} from '../lib/mockApi'
import toast from 'react-hot-toast'
import {
  PlusIcon, TrashIcon, SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const CATEGORIES = [
  'Teaching Methods', 'Communication Skills', 'Subject Mastery',
  'Classroom Management', 'Student Support', 'Professionalism',
  'Assessment & Feedback', 'Other',
]

const SOURCE_CONFIG = {
  manual:       { label: 'Manual',       color: 'bg-gray-100 text-gray-600',      icon: '✏️' },
  ai_generated: { label: 'AI Generated', color: 'bg-primary-100 text-primary-700', icon: '🤖' },
  ai_edited:    { label: 'AI Edited',    color: 'bg-primary-200 text-primary-800', icon: '🤖✏️' },
}

function resolveSource(current, aiOriginal) {
  if (!aiOriginal) return 'manual'
  return current.trim() === aiOriginal.trim() ? 'ai_generated' : 'ai_edited'
}

const emptyQ = () => ({
  text: '',
  type: 'rating',
  category: 'Teaching Methods',
  source: 'manual',
  ai_original_text: null,
})

export default function QuestionnaireForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({
    title: '', description: '', evaluator_type: 'student',
    semester: '1st', school_year: '2025-2026',
  })
  const [questions, setQuestions] = useState([emptyQ()])
  const [saving, setSaving] = useState(false)

  const [aiPanel, setAiPanel] = useState(false)
  const [aiCategory, setAiCategory] = useState('Teaching Methods')
  const [aiCount, setAiCount] = useState(5)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState([])

  useEffect(() => {
    if (!isEdit) return
    getQuestionnaire(id).then(r => {
      const { title, description, evaluator_type, semester, school_year, questions: qs } = r.data
      setForm({ title, description: description || '', evaluator_type, semester, school_year })
      setQuestions(qs.length ? qs.map(q => ({
        ...q,
        source: q.source || 'manual',
        ai_original_text: q.ai_original_text || null,
      })) : [emptyQ()])
    })
  }, [id])

  const addManualQ = () => setQuestions(qs => [...qs, emptyQ()])
  const removeQ = i => setQuestions(qs => qs.filter((_, idx) => idx !== i))

  const updateQText = (i, newText) => {
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== i) return q
      const newSource = resolveSource(newText, q.ai_original_text)
      return { ...q, text: newText, source: newSource }
    }))
  }

  const updateQField = (i, k, v) => {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [k]: v } : q))
  }

  const fetchSuggestions = async () => {
    if (aiLoading) return
    setAiLoading(true)
    setAiSuggestions([])
    try {
      const r = await aiSuggestQuestions({
        evaluator_type: form.evaluator_type,
        category: aiCategory,
        semester: form.semester,
        school_year: form.school_year,
        count: aiCount,
      })
      setAiSuggestions(r.data.suggestions.map(s => ({ ...s, accepted: false })))
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI suggestion failed')
    } finally {
      setAiLoading(false)
    }
  }

  const acceptSuggestion = (suggestion) => {
    const newQ = {
      text: suggestion.text,
      type: suggestion.type || 'rating',
      category: suggestion.category,
      source: 'ai_generated',
      ai_original_text: suggestion.text,
    }
    setQuestions(qs => [...qs, newQ])
    setAiSuggestions(prev =>
      prev.map(s => s.text === suggestion.text ? { ...s, accepted: true } : s)
    )
    toast.success('Question added')
  }

  const acceptAll = () => {
    const unaccepted = aiSuggestions.filter(s => !s.accepted)
    if (!unaccepted.length) return
    const newQs = unaccepted.map(s => ({
      text: s.text,
      type: s.type || 'rating',
      category: s.category,
      source: 'ai_generated',
      ai_original_text: s.text,
    }))
    setQuestions(qs => [...qs, ...newQs])
    setAiSuggestions(prev => prev.map(s => ({ ...s, accepted: true })))
    toast.success(`${unaccepted.length} questions added`)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const empty = questions.filter(q => !q.text.trim())
    if (empty.length) return toast.error('All questions must have text')

    setSaving(true)
    try {
      const payload = {
        ...form,
        questions: questions.map(q => ({
          text: q.text,
          type: q.type,
          category: q.category,
          source: q.source || 'manual',
          ai_original_text: q.ai_original_text || null,
        })),
      }
      if (isEdit) {
        await updateQuestionnaire(id, payload)
        toast.success('Questionnaire updated')
        navigate(`/questionnaires/${id}`)
      } else {
        const r = await createQuestionnaire(payload)
        toast.success('Questionnaire created')
        navigate(`/questionnaires/${r.data.id}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const sourceCounts = questions.reduce((acc, q) => {
    acc[q.source] = (acc[q.source] || 0) + 1
    return acc
  }, {})

  const setField = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1>{isEdit ? 'Edit Questionnaire' : 'New Questionnaire'}</h1>
        <p className="text-gray-500 text-sm">Questionnaires require President/VP approval before use</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2>Basic Information</h2>
          <div>
            <label className="label">Title *</label>
            <input className="input"
              placeholder="e.g. Student Evaluation Form - 1st Sem 2025-2026"
              value={form.title} onChange={setField('title')} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} placeholder="Brief description..."
              value={form.description} onChange={setField('description')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Evaluator Type *</label>
              <select className="input" value={form.evaluator_type} onChange={setField('evaluator_type')}>
                <option value="student">Student</option>
                <option value="peer">Peer (Faculty)</option>
              </select>
            </div>
            <div>
              <label className="label">Semester *</label>
              <select className="input" value={form.semester} onChange={setField('semester')}>
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="summer">Summer</option>
              </select>
            </div>
            <div>
              <label className="label">School Year *</label>
              <input className="input" placeholder="2025-2026"
                value={form.school_year} onChange={setField('school_year')} required />
            </div>
          </div>
        </div>

        {/* AI Suggest Panel */}
        <div className="card border-primary-200 bg-primary-50 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-primary-600" />
              <h2 className="text-primary-800">AI Question Suggestions</h2>
            </div>
            <button type="button" onClick={() => setAiPanel(p => !p)}
              className="text-sm text-primary-700 hover:underline">
              {aiPanel ? 'Hide panel' : 'Open panel'}
            </button>
          </div>

          {aiPanel && (
            <div className="space-y-4">
              <p className="text-sm text-primary-700">
                Select a category and let the AI suggest evaluation questions. You can accept them as-is or edit them.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="label text-primary-800">Category</label>
                  <select className="input bg-white" value={aiCategory} onChange={e => setAiCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-primary-800">Count</label>
                  <select className="input bg-white" value={aiCount} onChange={e => setAiCount(Number(e.target.value))}>
                    {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
                  </select>
                </div>
              </div>

              <button type="button" onClick={fetchSuggestions} disabled={aiLoading}
                className="btn-primary flex items-center gap-2">
                {aiLoading
                  ? <><span className="animate-spin">⚙</span> Generating...</>
                  : <><SparklesIcon className="w-4 h-4" /> Generate Suggestions</>}
              </button>

              {aiSuggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary-800">
                      {aiSuggestions.length} suggestions for "{aiCategory}"
                    </p>
                    <button type="button" onClick={acceptAll}
                      className="text-sm text-primary-700 font-medium hover:underline">
                      Accept All Remaining
                    </button>
                  </div>
                  {aiSuggestions.map((s, i) => (
                    <div key={i}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        s.accepted
                          ? 'bg-emerald-50 border-emerald-200 opacity-60'
                          : 'bg-white border-primary-200 hover:border-primary-400'
                      }`}>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{s.text}</p>
                        <span className="text-xs text-primary-500 mt-0.5 block">🤖 AI · {s.category}</span>
                      </div>
                      {s.accepted ? (
                        <span className="text-emerald-600 text-xs font-medium flex items-center gap-1 flex-shrink-0">
                          <CheckCircleIcon className="w-4 h-4" /> Added
                        </span>
                      ) : (
                        <button type="button" onClick={() => acceptSuggestion(s)}
                          className="text-sm text-primary-700 font-medium border border-primary-300 px-2 py-1 rounded hover:bg-primary-50 flex-shrink-0">
                          + Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2>Questions ({questions.length})</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {Object.entries(sourceCounts).map(([src, count]) => {
                  const cfg = SOURCE_CONFIG[src] || SOURCE_CONFIG.manual
                  return (
                    <span key={src} className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                      {cfg.icon} {count} {cfg.label}
                    </span>
                  )
                })}
              </div>
            </div>
            <button type="button" onClick={addManualQ}
              className="btn-secondary text-sm flex items-center gap-1">
              <PlusIcon className="w-4 h-4" /> Add Manually
            </button>
          </div>

          {questions.map((q, i) => {
            const cfg = SOURCE_CONFIG[q.source] || SOURCE_CONFIG.manual
            const hasAiDiff = q.source === 'ai_edited' && q.ai_original_text

            return (
              <div key={i}
                className={`border rounded-lg p-4 space-y-3 ${
                  q.source === 'ai_generated' ? 'border-primary-200 bg-primary-50/40'
                  : q.source === 'ai_edited'  ? 'border-primary-300 bg-primary-100/30'
                  : 'border-gray-200 bg-gray-50'
                }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Q{i + 1}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQ(i)}
                      className="text-red-400 hover:text-red-600">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="label">Question Text *</label>
                  <input
                    className="input bg-white"
                    placeholder="e.g. How effectively does the teacher explain concepts?"
                    value={q.text}
                    onChange={e => updateQText(i, e.target.value)}
                    required
                  />
                </div>

                {hasAiDiff && (
                  <div className="text-xs bg-primary-50 border border-primary-200 rounded p-2 text-primary-700">
                    <span className="font-medium">Original AI text:</span>
                    <span className="ml-1 italic">"{q.ai_original_text}"</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Type</label>
                    <select className="input bg-white" value={q.type}
                      onChange={e => updateQField(i, 'type', e.target.value)}>
                      <option value="rating">Rating (1–5)</option>
                      <option value="open_ended">Open-ended</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select className="input bg-white" value={q.category}
                      onChange={e => updateQField(i, 'category', e.target.value)}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Questionnaire'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}

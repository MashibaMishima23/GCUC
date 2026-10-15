import { useEffect, useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { 
  DocumentTextIcon, CheckCircleIcon, 
  ChatBubbleLeftRightIcon, StarIcon 
} from '@heroicons/react/24/outline'

export default function ViewQuestionnaire() {
  const [questionnaire, setQuestionnaire] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('/questionnaires/fixed')
      .then(r => {
        if (r.data.success) {
          setQuestionnaire(r.data.questionnaire)
        }
      })
      .catch((err) => {
        if (err.response?.data?.code === 'NOT_FOUND') {
          toast.error('No questionnaire found. Please contact admin.')
        } else {
          toast.error('Failed to load questionnaire')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading questionnaire...</p>
        </div>
      </div>
    )
  }

  if (!questionnaire) {
    return (
      <div className="card text-center py-12">
        <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Questionnaire Found</h3>
        <p className="text-gray-500 text-sm">
          The default evaluation questionnaire has not been set up yet.
        </p>
        <p className="text-gray-400 text-xs mt-2">
          Please contact the system administrator.
        </p>
      </div>
    )
  }

  const ratingQuestions = questionnaire.questions.filter(q => q.type === 'rating')
  const openQuestions = questionnaire.questions.filter(q => q.type === 'open_ended')

  // Group rating questions by category
  const categorizedQuestions = ratingQuestions.reduce((acc, q) => {
    const cat = q.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(q)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card border-l-4 border-primary-600">
        <div className="flex items-start gap-4">
          <div className="bg-primary-100 p-3 rounded-lg">
            <DocumentTextIcon className="w-8 h-8 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-800">{questionnaire.title}</h1>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                <CheckCircleIcon className="w-3 h-3" />
                Active
              </span>
            </div>
            {questionnaire.description && (
              <p className="text-gray-600 text-sm mb-3">{questionnaire.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="font-medium text-gray-700">Evaluator Type:</span>
                <span className="capitalize">{questionnaire.evaluator_type || 'Student'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-gray-700">Semester:</span>
                <span>{questionnaire.semester || 'All'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-gray-700">School Year:</span>
                <span>{questionnaire.school_year || 'All'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-gray-700">Total Questions:</span>
                <span className="font-semibold text-primary-700">{questionnaire.questions.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">📋 Fixed Questionnaire System</p>
        <p>
          This is the official GCUC Teacher Evaluation Form used for all evaluations. 
          Students and staff will use this questionnaire when evaluating teachers.
        </p>
      </div>

      {/* Rating Questions by Category */}
      {Object.keys(categorizedQuestions).length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <StarIcon className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-800">Rating Questions</h2>
            <span className="text-sm text-gray-500">({ratingQuestions.length} questions)</span>
          </div>

          {Object.entries(categorizedQuestions).map(([category, questions]) => (
            <div key={category} className="card">
              <div className="mb-4 pb-3 border-b">
                <h3 className="font-semibold text-gray-800 text-lg">{category}</h3>
                <p className="text-xs text-gray-500 mt-1">{questions.length} question(s)</p>
              </div>
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold text-sm">{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800">{q.text}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">Rating Scale:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <span key={n} 
                              className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 bg-white text-xs text-gray-600">
                              {n}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 ml-2">
                          (1 = Poor, 5 = Excellent)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Open-Ended Questions */}
      {openQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-800">Open-Ended Questions</h2>
            <span className="text-sm text-gray-500">({openQuestions.length} questions)</span>
          </div>

          <div className="card space-y-4">
            {openQuestions.map((q, idx) => (
              <div key={q.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-semibold text-sm">{idx + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 mb-2">{q.text}</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 min-h-20">
                    <p className="text-gray-400 text-sm italic">
                      Students will type their response here...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="card bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-primary-600">{questionnaire.questions.length}</p>
            <p className="text-sm text-gray-600 mt-1">Total Questions</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-600">{ratingQuestions.length}</p>
            <p className="text-sm text-gray-600 mt-1">Rating Questions</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">{openQuestions.length}</p>
            <p className="text-sm text-gray-600 mt-1">Open-Ended Questions</p>
          </div>
        </div>
      </div>
    </div>
  )
}

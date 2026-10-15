import { useState, useEffect } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/24/outline'
import api from '../lib/api'
import toast from 'react-hot-toast'

function StarFilterButton({ stars, count, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
        isActive
          ? 'border-primary-500 bg-primary-50 shadow-md scale-105'
          : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow'
      }`}
    >
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`w-5 h-5 ${
              i < stars ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      <span className={`text-sm font-semibold ${isActive ? 'text-primary-700' : 'text-gray-700'}`}>
        ({count})
      </span>
    </button>
  )
}

function TeacherDetailModal({ teacher, periodId, onClose }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (teacher && periodId) {
      setLoading(true)
      api.get(`/reports/teacher-detail/${periodId}/${teacher.id}`)
        .then(r => setDetails(r.data))
        .catch(err => toast.error('Failed to load teacher details'))
        .finally(() => setLoading(false))
    }
  }, [teacher, periodId])

  if (!teacher) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{teacher.name}</h2>
            <p className="text-sm text-gray-500">{teacher.department_name || teacher.department}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3" />
            <p className="text-gray-400">Loading details...</p>
          </div>
        ) : details ? (
          <div className="p-6 space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overall Rating</p>
                  <div className="flex items-center gap-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-8 h-8 ${
                            i < details.teacher.stars ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-4xl font-bold text-gray-800">
                      {details.teacher.avg_score}
                    </span>
                    <span className="text-gray-500">/ 5.0</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Based on {details.teacher.total_evaluations} evaluations
                  </p>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Rating Distribution</h3>
              <div className="space-y-2">
                {details.distribution.slice().reverse().map(d => {
                  const total = details.distribution.reduce((sum, x) => sum + x.count, 0)
                  const percentage = total > 0 ? (d.count / total) * 100 : 0
                  return (
                    <div key={d.rating} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-8">{d.rating}★</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{d.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Category Scores */}
            {details.categories && details.categories.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Performance by Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {details.categories.map((cat, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700">{cat.category}</p>
                        <span className="text-lg font-bold text-gray-800">{cat.avg_score}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            parseFloat(cat.avg_score) >= 4.5 ? 'bg-green-500' :
                            parseFloat(cat.avg_score) >= 4.0 ? 'bg-blue-500' :
                            parseFloat(cat.avg_score) >= 3.5 ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${(parseFloat(cat.avg_score) / 5) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{cat.count} responses</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {details.comments && details.comments.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Student Comments ({details.comments.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {details.comments.map((comment, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-400">
                      <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium">{comment.category}</span>
                        {comment.subject_code && (
                          <>
                            <span>•</span>
                            <span>{comment.subject_code}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            No data available
          </div>
        )}
      </div>
    </div>
  )
}

export default function StarRatingFilter({ periodId, evaluatorType = 'student' }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedStar, setSelectedStar] = useState('all')
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [departments, setDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [filteredTeachers, setFilteredTeachers] = useState([])

  // Load departments
  useEffect(() => {
    api.get('/departments')
      .then(r => setDepartments(r.data || []))
      .catch(err => console.error('Failed to load departments:', err))
  }, [])

  const loadData = () => {
    if (!periodId) {
      setLoading(false)
      return
    }

    setLoading(true)
    api.get(`/reports/star-ratings/${periodId}`, {
      params: { star_filter: selectedStar }
    })
      .then(r => setData(r.data))
      .catch(err => {
        console.error('Star rating error:', err)
        toast.error('Failed to load ratings')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [periodId, selectedStar])

  // Filter teachers by department
  useEffect(() => {
    if (!data) return

    let filtered = data.teachers

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(t => 
        t.department_name === selectedDepartment || t.department === selectedDepartment
      )
    }

    setFilteredTeachers(filtered)
  }, [data, selectedDepartment])

  if (!periodId) {
    return (
      <div className="card text-center py-8 text-gray-400">
        <p>Select an evaluation period to view ratings</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
        <p className="text-gray-400">Loading ratings...</p>
      </div>
    )
  }

  if (!data || data.star_counts.all === 0) {
    return (
      <div className="card text-center py-8 text-gray-400">
        <p>No evaluation data available for this period</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Department Filter */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Filter by Department</h3>
          {selectedDepartment !== 'all' && (
            <button
              onClick={() => setSelectedDepartment('all')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear Filter
            </button>
          )}
        </div>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="input"
        >
          <option value="all">All Departments (Overall)</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
        {selectedDepartment !== 'all' && (
          <p className="text-sm text-gray-600 mt-2">
            Showing only teachers from <strong>{selectedDepartment}</strong>
          </p>
        )}
      </div>

      {/* Star Filter Buttons */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Filter by Rating</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedStar('all')}
            className={`px-4 py-3 rounded-lg border-2 transition-all ${
              selectedStar === 'all'
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-primary-300'
            }`}
          >
            <span className={`text-sm font-semibold ${selectedStar === 'all' ? 'text-primary-700' : 'text-gray-700'}`}>
              All Ratings ({filteredTeachers.length})
            </span>
          </button>

          {[5, 4, 3, 2, 1].map(star => {
            const count = filteredTeachers.filter(t => t.stars === star).length
            return (
              <StarFilterButton
                key={star}
                stars={star}
                count={count}
                isActive={selectedStar === String(star)}
                onClick={() => setSelectedStar(String(star))}
              />
            )
          })}
        </div>
      </div>

      {/* Teachers List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">
            {selectedStar === 'all' 
              ? selectedDepartment === 'all'
                ? `All Teachers (${filteredTeachers.length})`
                : `${selectedDepartment} - All Ratings (${filteredTeachers.length})`
              : selectedDepartment === 'all'
                ? `${selectedStar} Star Teachers (${filteredTeachers.filter(t => t.stars === parseInt(selectedStar)).length})`
                : `${selectedDepartment} - ${selectedStar} Stars (${filteredTeachers.filter(t => t.stars === parseInt(selectedStar)).length})`
            }
          </h3>
          {(selectedStar !== 'all' || selectedDepartment !== 'all') && (
            <button
              onClick={() => {
                setSelectedStar('all')
                setSelectedDepartment('all')
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No teachers found matching your filters
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers
              .filter(t => selectedStar === 'all' || t.stars === parseInt(selectedStar))
              .map(teacher => (
                <button
                  key={teacher.id}
                  onClick={() => setSelectedTeacher(teacher)}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-primary-400 hover:shadow-lg transition-all text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 mb-1">{teacher.name}</p>
                      <p className="text-xs text-gray-600">{teacher.department_name || teacher.department}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-5 h-5 text-yellow-400" />
                        <span className="text-lg font-bold text-gray-800">{teacher.avg_score}</span>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-3 h-3 ${
                              i < teacher.stars ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all ${
                        teacher.stars === 5 ? 'bg-green-500' :
                        teacher.stars === 4 ? 'bg-blue-500' :
                        teacher.stars === 3 ? 'bg-yellow-500' :
                        teacher.stars === 2 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(parseFloat(teacher.avg_score) / 5) * 100}%` }}
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    {teacher.total_evaluations} evaluations • {teacher.total_evaluators} students
                  </p>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Teacher Detail Modal */}
      {selectedTeacher && (
        <TeacherDetailModal
          teacher={selectedTeacher}
          periodId={periodId}
          onClose={() => setSelectedTeacher(null)}
        />
      )}
    </div>
  )
}

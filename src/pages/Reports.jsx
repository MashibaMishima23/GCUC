import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { ChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import StarRatingFilter from '../components/StarRatingFilter'

export default function Reports() {
  const { user } = useAuth()
  const [periods, setPeriods] = useState([])
  const [departments, setDepartments] = useState([])
  const [teachers, setTeachers] = useState([])
  const [filteredTeachers, setFilteredTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'stars'

  useEffect(() => {
    const loadData = async () => {
      try {
        const periodsRes = await api.get('/evaluations/periods')
        setPeriods(periodsRes.data || [])
      } catch (err) {
        console.error('Error loading periods:', err)
        setPeriods([])
      }

      try {
        const deptsRes = await api.get('/departments')
        setDepartments(deptsRes.data || [])
      } catch (err) {
        console.error('Error loading departments:', err)
        setDepartments([])
      }

      try {
        const usersRes = await api.get('/users', { params: { role: 'teacher' } })
        const teacherData = usersRes.data?.users || usersRes.data?.data || usersRes.data || []
        setTeachers(Array.isArray(teacherData) ? teacherData : [])
        setFilteredTeachers(Array.isArray(teacherData) ? teacherData : [])
      } catch (err) {
        console.error('Error loading teachers:', err)
        setTeachers([])
        setFilteredTeachers([])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // Filter teachers by department and search query
  useEffect(() => {
    let filtered = teachers

    // Filter by department
    if (selectedDepartment) {
      filtered = filtered.filter(t => t.department === selectedDepartment)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.name?.toLowerCase().includes(query) ||
        t.department?.toLowerCase().includes(query) ||
        t.email?.toLowerCase().includes(query)
      )
    }

    setFilteredTeachers(filtered)
  }, [selectedDepartment, searchQuery, teachers])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>View Reports</h1>
          <p className="text-gray-500 text-sm">
            View teacher performance scores, ratings, and student feedback
          </p>
        </div>
        <div className="card text-center py-8 text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>View Reports</h1>
          <p className="text-gray-500 text-sm">
            View teacher performance scores, ratings, and student feedback
          </p>
        </div>
        {selectedPeriod && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 List View
            </button>
            <button
              onClick={() => setViewMode('stars')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === 'stars'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⭐ Star Ratings
            </button>
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <div>
          <h2>Select Report Criteria</h2>
          <p className="text-sm text-gray-600">Choose evaluation period, filter by department, and search for a teacher</p>
        </div>
        
        {/* Evaluation Period */}
        <div>
          <label className="label">Evaluation Period *</label>
          <select 
            className="input" 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="">Select period...</option>
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.semester} {p.school_year})
              </option>
            ))}
          </select>
        </div>

        {/* Show Star Rating View or List View based on toggle */}
        {viewMode === 'stars' && selectedPeriod ? (
          <div className="pt-4">
            <p className="text-sm text-gray-600 mb-4">
              Click on any teacher card to view detailed ratings and comments
            </p>
          </div>
        ) : (
          <>
            {/* Department Filter */}
            <div>
              <label className="label">Filter by Department (Optional)</label>
              <select 
                className="input" 
                value={selectedDepartment} 
                onChange={(e) => {
                  setSelectedDepartment(e.target.value)
                  setSelectedTeacher('') // Reset teacher selection when department changes
                }}
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div>
              <label className="label">Search Teacher</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Search by name, department, or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedTeacher('') // Reset teacher selection when searching
                  }}
                />
              </div>
            </div>

            {/* Teacher List */}
            <div>
              <label className="label">
                Select Teacher * 
                {filteredTeachers.length > 0 && (
                  <span className="text-gray-400 font-normal ml-2">
                    ({filteredTeachers.length} {filteredTeachers.length === 1 ? 'teacher' : 'teachers'} found)
                  </span>
                )}
              </label>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredTeachers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No teachers found matching your criteria
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredTeachers.map(t => (
                      <label
                        key={t.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedTeacher === t.id.toString() ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="teacher"
                          value={t.id}
                          checked={selectedTeacher === t.id.toString()}
                          onChange={(e) => setSelectedTeacher(e.target.value)}
                          className="w-4 h-4 text-primary-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{t.name}</p>
                          <p className="text-sm text-gray-500">
                            {t.department || 'No Department'} {t.email && `• ${t.email}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* View Report Button */}
            {selectedPeriod && selectedTeacher && (
              <Link 
                to={`/reports/view?period=${selectedPeriod}&teacher=${selectedTeacher}`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <ChartBarIcon className="w-5 h-5" /> View Report
              </Link>
            )}
          </>
        )}
      </div>

      {/* Star Rating Filter View */}
      {viewMode === 'stars' && selectedPeriod && (
        <StarRatingFilter periodId={selectedPeriod} />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import api from '../lib/api'
import { BuildingOfficeIcon, UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

export default function DepartmentInfo() {
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingTeachers, setLoadingTeachers] = useState(false)

  useEffect(() => {
    // Load all departments
    api.get('/departments')
      .then(r => {
        setDepartments(r.data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load departments:', err)
        setLoading(false)
      })
  }, [])

  const handleDepartmentChange = async (deptId) => {
    setSelectedDept(deptId)
    if (!deptId) {
      setTeachers([])
      return
    }

    setLoadingTeachers(true)
    try {
      // Get teachers with their subject assignments for this department
      const response = await api.get(`/departments/${deptId}/teachers-subjects`)
      setTeachers(response.data)
    } catch (err) {
      console.error('Failed to load teachers:', err)
      setTeachers([])
    } finally {
      setLoadingTeachers(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3" />
        <p className="text-gray-400">Loading departments...</p>
      </div>
    )
  }

  const selectedDeptInfo = departments.find(d => d.id === parseInt(selectedDept))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2">
          <BuildingOfficeIcon className="w-7 h-7 text-primary-600" />
          Department Information
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          View teachers and their subject assignments by department
        </p>
      </div>

      {/* Department Selector */}
      <div className="card">
        <label className="label">Select Department</label>
        <select 
          className="input max-w-md"
          value={selectedDept}
          onChange={(e) => handleDepartmentChange(e.target.value)}
        >
          <option value="">-- Choose a department --</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Department Info Card */}
      {selectedDeptInfo && (
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary-900">{selectedDeptInfo.name}</h2>
              {selectedDeptInfo.code && (
                <p className="text-sm text-primary-600 mt-1">Code: {selectedDeptInfo.code}</p>
              )}
            </div>
            {selectedDeptInfo.head_name && (
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase">Department Head</p>
                <p className="text-sm font-semibold text-gray-800">{selectedDeptInfo.head_name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teachers List */}
      {selectedDept && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <UserGroupIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Teachers & Subject Assignments</h3>
          </div>

          {loadingTeachers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Loading teachers...</p>
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <UserGroupIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No teachers found in this department</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teachers.map((teacher) => (
                <div 
                  key={teacher.teacher_id} 
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">{teacher.teacher_name}</h4>
                      <p className="text-sm text-gray-500">{teacher.email}</p>
                    </div>
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                      {teacher.subject_count} {teacher.subject_count === 1 ? 'subject' : 'subjects'}
                    </span>
                  </div>

                  {/* Subject List */}
                  {teacher.subjects && teacher.subjects.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-600 uppercase">Subjects Handled:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {teacher.subjects.map((subject, idx) => (
                          <div 
                            key={idx}
                            className="flex items-start gap-2 bg-white rounded p-2 border border-gray-200"
                          >
                            <AcademicCapIcon className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-800 truncate">
                                {subject.code}
                              </p>
                              <p className="text-xs text-gray-600">{subject.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {subject.semester} • S.Y. {subject.school_year}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No subjects assigned</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedDept && (
        <div className="card text-center py-12 text-gray-400">
          <BuildingOfficeIcon className="w-16 h-16 mx-auto mb-3 opacity-20" />
          <p>Select a department to view teachers and their subject assignments</p>
        </div>
      )}
    </div>
  )
}

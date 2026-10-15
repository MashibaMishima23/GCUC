import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import {
  UsersIcon, ClipboardDocumentListIcon, DocumentTextIcon,
  CheckBadgeIcon, CalendarIcon, ChartBarIcon,
  BuildingOfficeIcon, UserGroupIcon, BookOpenIcon,
  RectangleGroupIcon, AcademicCapIcon
} from '@heroicons/react/24/outline'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'
import StarRatingFilter from '../components/StarRatingFilter'

function StatCard({ label, value, icon: Icon, color, to }) {
  const content = (
    <div className={`card flex items-center gap-4 hover:shadow-md transition-shadow ${to ? 'cursor-pointer' : 'cursor-default'}`}>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

export default function Dashboard() {
  const { user, can } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolledSubjects, setEnrolledSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [teacherScores, setTeacherScores] = useState(null)
  const [loadingScores, setLoadingScores] = useState(false)
  const [selectedPeriodForStars, setSelectedPeriodForStars] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get('/dashboard/stats')
      .then(r => {
        console.log('Dashboard stats loaded:', r.data)
        setStats(r.data)
      })
      .catch(err => {
        console.error('Dashboard stats error:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  // Load enrolled subjects for students
  useEffect(() => {
    if (user?.role === 'student') {
      console.log('[Dashboard] Loading enrolled subjects for student:', user.id)
      setLoadingSubjects(true)
      api.get('/dashboard/my-subjects')
        .then(r => {
          console.log('[Dashboard] Enrolled subjects response:', r.data)
          setEnrolledSubjects(r.data.enrolled_subjects || [])
        })
        .catch(err => {
          console.error('[Dashboard] Failed to load enrolled subjects:', err)
          console.error('[Dashboard] Error response:', err.response?.data)
        })
        .finally(() => setLoadingSubjects(false))
    }
  }, [user])

  // Load evaluation scores for teachers
  useEffect(() => {
    if (user?.role === 'teacher') {
      console.log('[Dashboard] Loading evaluation scores for teacher:', user.id)
      setLoadingScores(true)
      api.get('/dashboard/my-evaluation-scores')
        .then(r => {
          console.log('[Dashboard] Evaluation scores response:', r.data)
          setTeacherScores(r.data)
        })
        .catch(err => {
          console.error('[Dashboard] Failed to load evaluation scores:', err)
        })
        .finally(() => setLoadingScores(false))
    }
  }, [user])

  const isDeptHead = user?.role === 'department_head'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-3" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Welcome, {user?.name} 👋</h1>
        <p className="text-gray-500 mt-1 capitalize">
          {user?.role?.replace('_',' ')} · {user?.department || 'GCUC'}
        </p>
      </div>

      {/* ── Department Head Dashboard ──────────────────────────────── */}
      {isDeptHead && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Students"    value={stats?.total_students ?? 0}    icon={UserGroupIcon}      color="bg-primary-600"  to="/dept-students" />
          <StatCard label="Total Teachers"    value={stats?.total_teachers ?? 0}    icon={UsersIcon}          color="bg-primary-700"  to="/assignments" />
          <StatCard label="Total Subjects"    value={stats?.total_subjects ?? 0}    icon={BookOpenIcon}       color="bg-primary-800" />
          <StatCard label="Total Blocks"      value={stats?.total_blocks ?? 0}      icon={RectangleGroupIcon} color="bg-primary-500"  to="/blocks" />
          <StatCard label="Total Evaluations" value={stats?.total_evaluations ?? 0} icon={ChartBarIcon}       color="bg-primary-400" />
        </div>
      )}

      {/* ── Admin / Guidance Dashboard ─────────────── */}
      {can('guidance','admin','staff') && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users"     value={(stats?.total_teachers ?? 0) + (stats?.total_students ?? 0) + (stats?.total_dept_heads ?? 0)}  icon={UsersIcon}       color="bg-primary-600" />
            <StatCard label="Departments"     value={stats?.total_departments ?? 0}   icon={BuildingOfficeIcon}  color="bg-primary-700" />
            <StatCard label="Subjects"        value={stats?.total_evaluation_forms ?? 0}  icon={BookOpenIcon}  color="bg-primary-800" />
            <StatCard label="Active Periods"  value={stats?.active_periods?.length ?? 0}  icon={CalendarIcon}  color="bg-red-700" />
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link to="/department-info" className="btn-primary text-sm text-center">Department Info</Link>
              <Link to="/periods" className="btn-secondary text-sm text-center">Manage Periods</Link>
              <Link to="/reports" className="btn-secondary text-sm text-center">View Reports</Link>
            </div>
          </div>

          {/* Top Performing Teachers by Department with Overall Ranking */}
          {stats?.top_teachers && stats.top_teachers.length > 0 && (
            <div className="card">
              <h2 className="mb-4">🏆 Top Performing Teachers</h2>
              
              {/* Overall Top 3 with Graphs */}
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-gray-800 mb-4">🥇 Overall Top Performers</h3>
                <div className="space-y-3">
                  {stats.top_teachers.slice(0, 3).map((teacher, index) => {
                    const score = parseFloat(teacher.avg_score)
                    const percentage = (score / 5) * 100
                    const getRankIcon = (rank) => {
                      if (rank === 0) return '🥇'
                      if (rank === 1) return '🥈'
                      if (rank === 2) return '🥉'
                      return ''
                    }
                    const getBarColor = (rank) => {
                      if (rank === 0) return 'bg-yellow-500'
                      if (rank === 1) return 'bg-gray-400'
                      if (rank === 2) return 'bg-orange-600'
                      return 'bg-primary-500'
                    }
                    
                    return (
                      <div key={teacher.id} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{getRankIcon(index)}</span>
                            <div>
                              <p className="font-bold text-gray-800">{teacher.name}</p>
                              <p className="text-sm text-gray-600">{teacher.department_name || teacher.department}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-800">{score.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">out of 5.00</p>
                          </div>
                        </div>
                        {/* Score Bar Graph */}
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-600 w-20">Score:</span>
                            <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getBarColor(index)} transition-all duration-500 flex items-center justify-end pr-2`}
                                style={{ width: `${percentage}%` }}
                              >
                                <span className="text-xs font-bold text-white">{score.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 ml-20">
                            {teacher.evaluation_count} evaluations from {teacher.student_count} students
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* By Department Ranking */}
              <h3 className="font-semibold text-gray-800 mb-3">📊 By Department</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.top_teachers.map((teacher, index) => {
                  const score = parseFloat(teacher.avg_score)
                  const percentage = (score / 5) * 100
                  const getScoreColor = (s) => {
                    if (s >= 4.5) return 'bg-green-500'
                    if (s >= 4.0) return 'bg-blue-500'
                    if (s >= 3.5) return 'bg-yellow-500'
                    return 'bg-gray-500'
                  }
                  
                  return (
                    <div key={teacher.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 mb-1">{teacher.name}</p>
                          <p className="text-xs text-gray-600">{teacher.department_name || teacher.department}</p>
                        </div>
                        <span className={`${getScoreColor(score)} text-white px-2 py-1 rounded-full font-bold text-sm flex-shrink-0 ml-2`}>
                          {score.toFixed(2)}
                        </span>
                      </div>
                      {/* Mini Bar Graph */}
                      <div className="mb-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getScoreColor(score)} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Rank #{index + 1} • {teacher.evaluation_count} evals • {teacher.student_count} students
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Active periods ─────────────────────────────────────────── */}
      {stats?.active_periods && stats.active_periods.length > 0 && (
        <div className="card">
          <h2 className="mb-4">🟢 Active Evaluation Periods</h2>
          <div className="space-y-3">
            {stats.active_periods.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{p.title}</p>
                  <p className="text-sm text-gray-500">{p.semester} Semester · S.Y. {p.school_year}</p>
                  <p className="text-xs text-gray-400">{p.start_date?.slice(0,10)} to {p.end_date?.slice(0,10)}</p>
                </div>
                <div className="flex gap-2">
                  {can('guidance','admin','staff') && (
                    <button
                      onClick={() => setSelectedPeriodForStars(p.id)}
                      className={`btn-secondary text-sm ${selectedPeriodForStars === p.id ? 'bg-primary-100 border-primary-400' : ''}`}
                    >
                      ⭐ View Ratings
                    </button>
                  )}
                  <Link to="/periods" className="btn-primary text-sm">
                    {can('guidance','admin') ? 'View Evaluations' : 'Go Evaluate'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Star Rating Filter (Guidance/Admin only) ────────────────── */}
      {can('guidance','admin','staff') && selectedPeriodForStars && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">⭐ Teacher Ratings by Stars</h2>
            <button
              onClick={() => setSelectedPeriodForStars(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Hide Ratings
            </button>
          </div>
          <StarRatingFilter periodId={selectedPeriodForStars} />
        </div>
      )}

      {/* ── Quick actions for other roles ──────────────────────────────────────────── */}
      {!can('guidance','admin','staff') && !isDeptHead && (
        <>
          <div className="card">
            <h2 className="mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              {can('student') && (
                <Link to="/periods" className="btn-primary text-sm">Start Evaluation</Link>
              )}
              {can('teacher') && (
                <Link to="/periods" className="btn-primary text-sm">Peer Evaluation</Link>
              )}
            </div>
          </div>

          {/* ── Teacher Evaluation Scores ────────────────────────────────────────────── */}
          {can('teacher') && (
            <>
              {loadingScores ? (
                <div className="card">
                  <div className="text-center py-8 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
                    <p className="text-sm">Loading your evaluation scores...</p>
                  </div>
                </div>
              ) : teacherScores ? (
                <>
                  {/* Student Evaluations Section */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="flex items-center gap-2">
                        🎓 Student Evaluations
                      </h2>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary-700">
                          {teacherScores.student_evaluations.overall_avg}
                        </p>
                        <p className="text-xs text-gray-500">Overall Average</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-700">
                          {teacherScores.student_evaluations.total_evaluations}
                        </p>
                        <p className="text-sm text-gray-600">Total Evaluations</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-700">
                          {teacherScores.student_evaluations.total_evaluators}
                        </p>
                        <p className="text-sm text-gray-600">Students Evaluated</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-purple-700">
                          {teacherScores.student_evaluations.periods.length}
                        </p>
                        <p className="text-sm text-gray-600">Completed Periods</p>
                      </div>
                    </div>

                    {teacherScores.student_evaluations.periods.length > 0 ? (
                      <>
                        <h3 className="font-semibold text-gray-700 mb-3">Score Trends by Period</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={teacherScores.student_evaluations.periods.slice().reverse()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="semester" 
                              tick={{ fontSize: 11 }}
                              label={{ value: 'Evaluation Period', position: 'insideBottom', offset: -5, fontSize: 12 }}
                            />
                            <YAxis 
                              domain={[0, 5]} 
                              tick={{ fontSize: 11 }}
                              label={{ value: 'Average Score', angle: -90, position: 'insideLeft', fontSize: 12 }}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload
                                  return (
                                    <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                                      <p className="font-semibold text-gray-800">{data.period_title}</p>
                                      <p className="text-sm text-gray-600">{data.semester} {data.school_year}</p>
                                      <p className="text-lg font-bold text-primary-700 mt-1">
                                        Score: {data.avg_score} / 5.0
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {data.evaluation_count} evaluations from {data.evaluator_count} students
                                      </p>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="avg_score" 
                              stroke="#1d4ed8" 
                              strokeWidth={3}
                              dot={{ fill: '#1d4ed8', r: 5 }}
                              activeDot={{ r: 7 }}
                              name="Average Score"
                            />
                          </LineChart>
                        </ResponsiveContainer>

                        <div className="mt-6">
                          <h3 className="font-semibold text-gray-700 mb-3">Recent Evaluation Periods</h3>
                          <div className="space-y-2">
                            {teacherScores.student_evaluations.periods.slice(0, 5).map((period, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">{period.period_title}</p>
                                  <p className="text-xs text-gray-500">{period.semester} {period.school_year}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-center">
                                    <p className="text-lg font-bold text-primary-700">{period.avg_score}</p>
                                    <p className="text-xs text-gray-500">Score</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-700">{period.evaluator_count}</p>
                                    <p className="text-xs text-gray-500">Students</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <ChartBarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No student evaluation data available yet.</p>
                        <p className="text-sm mt-1">Scores will appear after evaluation periods are completed.</p>
                      </div>
                    )}
                  </div>

                  {/* Peer Evaluations Section */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="flex items-center gap-2">
                        👥 Peer Evaluations
                      </h2>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-purple-700">
                          {teacherScores.peer_evaluations.overall_avg}
                        </p>
                        <p className="text-xs text-gray-500">Overall Average</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-purple-700">
                          {teacherScores.peer_evaluations.total_evaluations}
                        </p>
                        <p className="text-sm text-gray-600">Total Evaluations</p>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-indigo-700">
                          {teacherScores.peer_evaluations.total_evaluators}
                        </p>
                        <p className="text-sm text-gray-600">Peers Evaluated</p>
                      </div>
                      <div className="bg-pink-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-pink-700">
                          {teacherScores.peer_evaluations.periods.length}
                        </p>
                        <p className="text-sm text-gray-600">Completed Periods</p>
                      </div>
                    </div>

                    {teacherScores.peer_evaluations.periods.length > 0 ? (
                      <>
                        <h3 className="font-semibold text-gray-700 mb-3">Score Trends by Period</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={teacherScores.peer_evaluations.periods.slice().reverse()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="semester" 
                              tick={{ fontSize: 11 }}
                              label={{ value: 'Evaluation Period', position: 'insideBottom', offset: -5, fontSize: 12 }}
                            />
                            <YAxis 
                              domain={[0, 5]} 
                              tick={{ fontSize: 11 }}
                              label={{ value: 'Average Score', angle: -90, position: 'insideLeft', fontSize: 12 }}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload
                                  return (
                                    <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                                      <p className="font-semibold text-gray-800">{data.period_title}</p>
                                      <p className="text-sm text-gray-600">{data.semester} {data.school_year}</p>
                                      <p className="text-lg font-bold text-purple-700 mt-1">
                                        Score: {data.avg_score} / 5.0
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {data.evaluation_count} evaluations from {data.evaluator_count} peers
                                      </p>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="avg_score" 
                              stroke="#9333ea" 
                              strokeWidth={3}
                              dot={{ fill: '#9333ea', r: 5 }}
                              activeDot={{ r: 7 }}
                              name="Average Score"
                            />
                          </LineChart>
                        </ResponsiveContainer>

                        <div className="mt-6">
                          <h3 className="font-semibold text-gray-700 mb-3">Recent Evaluation Periods</h3>
                          <div className="space-y-2">
                            {teacherScores.peer_evaluations.periods.slice(0, 5).map((period, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">{period.period_title}</p>
                                  <p className="text-xs text-gray-500">{period.semester} {period.school_year}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-center">
                                    <p className="text-lg font-bold text-purple-700">{period.avg_score}</p>
                                    <p className="text-xs text-gray-500">Score</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-700">{period.evaluator_count}</p>
                                    <p className="text-xs text-gray-500">Peers</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <ChartBarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No peer evaluation data available yet.</p>
                        <p className="text-sm mt-1">Scores will appear after evaluation periods are completed.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </>
          )}

          {/* ── Student Enrolled Subjects ────────────────────────────────────────────── */}
          {can('student') && (
            <div className="card">
              <h2 className="mb-4">📚 My Enrolled Subjects</h2>
              {loadingSubjects ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
                  <p className="text-sm">Loading your subjects...</p>
                </div>
              ) : enrolledSubjects.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <BookOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No enrolled subjects found for this semester.</p>
                  <p className="text-sm mt-1">Please contact your department head if this is incorrect.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrolledSubjects.map(subject => (
                    <div key={subject.id} className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-4 border border-primary-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold text-primary-700 bg-white px-2 py-0.5 rounded-full">
                          {subject.code}
                        </span>
                        {subject.units && (
                          <span className="text-xs text-gray-600">
                            {subject.units} {subject.units === 1 ? 'unit' : 'units'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">
                        {subject.name}
                      </h3>
                      {subject.teacher_name && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-2 pt-2 border-t border-primary-100">
                          <UsersIcon className="w-3 h-3" />
                          <span className="truncate">{subject.teacher_name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

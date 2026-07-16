import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../lib/mockApi'
import { useAuth } from '../context/AuthContext'
import {
  UsersIcon, ClipboardDocumentListIcon, DocumentTextIcon,
  CheckBadgeIcon, CalendarIcon, ChartBarIcon,
  BuildingOfficeIcon, UserGroupIcon, BookOpenIcon,
  RectangleGroupIcon
} from '@heroicons/react/24/outline'

function StatCard({ label, value, icon: Icon, color, to }) {
  const card = (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to} className="block">{card}</Link> : card
}

export default function Dashboard() {
  const { user, can } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getDashboardStats(user?.role).then(r => setStats(r.data)).catch(() => {})
  }, [user?.role])

  const isDeptHead = user?.role === 'department_head'

  return (
    <div className="space-y-6">
      <div>
        <h1>Welcome, {user?.name} 👋</h1>
        <p className="text-gray-500 mt-1 capitalize">
          {user?.role?.replace('_',' ')} · {user?.department || 'GCUC'}
        </p>
      </div>

      {/* ── Department Head Dashboard ──────────────────────────────── */}
      {isDeptHead && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Students"    value={stats.total_students}    icon={UserGroupIcon}      color="bg-primary-600"  to="/dept-students" />
          <StatCard label="Total Teachers"    value={stats.total_teachers}    icon={UsersIcon}          color="bg-primary-700"  to="/assignments" />
          <StatCard label="Total Subjects"    value={stats.total_subjects}    icon={BookOpenIcon}       color="bg-primary-800" />
          <StatCard label="Total Blocks"      value={stats.total_blocks}      icon={RectangleGroupIcon} color="bg-primary-500"  to="/blocks" />
          <StatCard label="Total Evaluations" value={stats.total_evaluations} icon={ChartBarIcon}       color="bg-primary-400" />
        </div>
      )}

      {/* ── Admin / Guidance / President / VP Dashboard ─────────────── */}
      {can('guidance','admin','president','vp','staff') && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Departments"       value={stats.total_departments}      icon={BuildingOfficeIcon}        color="bg-primary-800"  to="/departments" />
          <StatCard label="Department Heads"        value={stats.total_dept_heads}       icon={UsersIcon}                 color="bg-primary-700"  to="/users" />
          <StatCard label="Total Teachers"          value={stats.total_teachers}         icon={UsersIcon}                 color="bg-primary-600"  to="/users" />
          <StatCard label="Total Students"          value={stats.total_students}         icon={UserGroupIcon}             color="bg-primary-500"  to="/users" />
          <StatCard label="Evaluation Forms"        value={stats.total_evaluation_forms} icon={ClipboardDocumentListIcon} color="bg-primary-400"  to="/questionnaires" />
          <StatCard label="Evaluations Submitted"   value={stats.total_evaluations}      icon={ChartBarIcon}              color="bg-emerald-600" />
          <StatCard label="Pending Approvals"       value={stats.pending_approvals}      icon={CheckBadgeIcon}            color="bg-amber-500" to={can('president','vp','department_head') ? '/approvals' : undefined} />
          <StatCard label="Reports Generated"       value={stats.total_reports}          icon={DocumentTextIcon}          color="bg-primary-700"  to="/reports" />
          <StatCard label="Active Periods"          value={stats.active_periods?.length ?? 0} icon={CalendarIcon}         color="bg-red-700"      to="/periods" />
        </div>
      )}

      {/* ── AI usage (admin/president/vp) ──────────────────────────── */}
      {can('guidance','admin','president','vp') && stats?.ai_stats && (
        <div className="card border-primary-200 bg-primary-50/40">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-primary-600 text-lg">🤖</span>
            <h2 className="text-primary-800">AI Usage Summary</h2>
            <a href="/ai-logs" className="ml-auto text-xs text-primary-600 hover:underline">View all logs →</a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: 'Total Calls',  value: Number(stats.ai_stats.total_calls || 0).toLocaleString() },
              { label: 'Total Tokens', value: Number(stats.ai_stats.grand_total_tokens || 0).toLocaleString() },
              { label: 'Avg Response', value: `${Math.round(stats.ai_stats.avg_response_ms || 0)} ms` },
              { label: 'Failed Calls', value: Number(stats.ai_stats.failed_calls || 0).toLocaleString() },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-3 border border-primary-100">
                <p className="text-xl font-bold text-primary-700">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Active periods ─────────────────────────────────────────── */}
      {stats?.active_periods?.length > 0 && (
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
                <Link to="/periods" className="btn-primary text-sm">Go Evaluate</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick actions ──────────────────────────────────────────── */}
      <div className="card">
        <h2 className="mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {can('guidance','admin') && (
            <>
              <Link to="/users" className="btn-primary text-sm">Manage Users</Link>
              <Link to="/departments" className="btn-secondary text-sm">Manage Departments</Link>
            </>
          )}
          {can('guidance','admin','staff') && (
            <>
              <Link to="/questionnaires/new" className="btn-primary text-sm">+ New Questionnaire</Link>
              <Link to="/periods" className="btn-secondary text-sm">Manage Periods</Link>
            </>
          )}
          {can('president','vp') && (
            <Link to="/approvals" className="btn-primary text-sm">Review Pending Approvals</Link>
          )}
          {isDeptHead && (
            <>
              <Link to="/approvals" className="btn-primary text-sm">Review Approvals</Link>
              <Link to="/dept-students" className="btn-secondary text-sm">Manage Students</Link>
              <Link to="/blocks" className="btn-secondary text-sm">Manage Blocks</Link>
              <Link to="/assignments" className="btn-secondary text-sm">Teacher Assignments</Link>
              <Link to="/enrollments" className="btn-secondary text-sm">View Enrollments</Link>
            </>
          )}
          {can('student','teacher','staff') && (
            <Link to="/periods" className="btn-primary text-sm">Start Evaluation</Link>
          )}
          {can('teacher') && (
            <Link to="/my-evaluations" className="btn-secondary text-sm">View My Results</Link>
          )}
          {can('guidance','admin','staff','president','vp') && (
            <Link to="/reports" className="btn-secondary text-sm">View Reports</Link>
          )}
        </div>
      </div>
    </div>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'

// Pages
import Login           from './pages/Login'
import Register        from './pages/Register'
import Dashboard       from './pages/Dashboard'
import Profile         from './pages/Profile'
import EvaluationPeriods from './pages/EvaluationPeriods'
import EvaluateTeacher from './pages/EvaluateTeacher'
import Reports         from './pages/Reports'
import ReportDetail    from './pages/ReportDetail'
import Users           from './pages/Users'
import MyEvaluations   from './pages/MyEvaluations'
import NotFound        from './pages/NotFound'
import Departments     from './pages/Departments'
import DepartmentInfo  from './pages/DepartmentInfo'
import Subjects        from './pages/Subjects'
import Blocks          from './pages/Blocks'
import BlockTeacherAssignments from './pages/BlockTeacherAssignments'
import DeptStudents    from './pages/DeptStudents'
import TeacherAssignments from './pages/TeacherAssignments'
import Enrollments     from './pages/Enrollments'
import ArchiveSettings from './pages/ArchiveSettings'

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto" />
          <p className="text-gray-400 text-sm mt-3">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

// Admin redirects to Users instead of Dashboard
function DashboardOrRedirect() {
  const { user } = useAuth()
  if (user?.role === 'admin') return <Navigate to="/users" replace />
  return <Dashboard />
}

const ADMIN_ROLES = ['guidance','admin']
// Note: DEPT_HEAD_ROLES removed — dept-head routes now use ['department_head'] directly

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          {/* Admin goes to Users, others see Dashboard */}
          <Route index element={<DashboardOrRedirect />} />
          
          {/* Profile - available to all authenticated users */}
          <Route path="profile" element={<Profile />} />

          {/* Approvals — DISABLED (no questionnaire approval needed) */}
          {/* <Route path="approvals" element={<ApprovalQueue />} /> */}

          {/* Evaluations */}
          <Route path="periods" element={<EvaluationPeriods />} />
          <Route path="evaluate/:periodId/:teacherId" element={<EvaluateTeacher />} />
          <Route path="my-evaluations"
            element={<RequireAuth roles={['teacher']}><MyEvaluations /></RequireAuth>} />

          <Route path="reports" element={<RequireAuth roles={['guidance','staff']}><Reports /></RequireAuth>} />
          <Route path="reports/view" element={<RequireAuth roles={['guidance','staff']}><ReportDetail /></RequireAuth>} />
          <Route path="reports/:id" element={<RequireAuth roles={['guidance','staff']}><ReportDetail /></RequireAuth>} />

          <Route path="users"
            element={<RequireAuth roles={['admin']}><Users /></RequireAuth>} />

          {/* Admin Only – Department Management */}
          <Route path="departments"
            element={<RequireAuth roles={['admin']}><Departments /></RequireAuth>} />

          {/* Guidance/Staff – Department Information (Read-only) */}
          <Route path="department-info"
            element={<RequireAuth roles={['guidance','admin','staff']}><DepartmentInfo /></RequireAuth>} />

          {/* Admin Only – Subject Management */}
          <Route path="subjects"
            element={<RequireAuth roles={['admin']}><Subjects /></RequireAuth>} />

          {/* Block / Section Management — admin and dept_head */}
          <Route path="blocks"
            element={<RequireAuth roles={['admin', 'department_head']}><Blocks /></RequireAuth>} />

          {/* Block-specific Teacher Assignments — admin only */}
          <Route path="block-teachers"
            element={<RequireAuth roles={ADMIN_ROLES}><BlockTeacherAssignments /></RequireAuth>} />

          {/* Department Head – Student Management */}
          <Route path="dept-students"
            element={<RequireAuth roles={['department_head']}><DeptStudents /></RequireAuth>} />

          {/* Teacher–Subject Assignments — dept_head only */}
          <Route path="assignments"
            element={<RequireAuth roles={['department_head']}><TeacherAssignments /></RequireAuth>} />

          {/* Admin Only – Enrollment Management */}
          <Route path="enrollments"
            element={<RequireAuth roles={['admin']}><Enrollments /></RequireAuth>} />

          {/* Admin Only – Archive Management */}
          <Route path="archive"
            element={<RequireAuth roles={['admin']}><ArchiveSettings /></RequireAuth>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}

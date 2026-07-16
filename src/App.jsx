import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'

import Login              from './pages/Login'
import Register           from './pages/Register'
import Dashboard          from './pages/Dashboard'
import Questionnaires     from './pages/Questionnaires'
import QuestionnaireForm  from './pages/QuestionnaireForm'
import QuestionnaireDetail from './pages/QuestionnaireDetail'
import ApprovalQueue      from './pages/ApprovalQueue'
import EvaluationPeriods  from './pages/EvaluationPeriods'
import EvaluateTeacher    from './pages/EvaluateTeacher'
import Reports            from './pages/Reports'
import ReportDetail       from './pages/ReportDetail'
import Users              from './pages/Users'
import MyEvaluations      from './pages/MyEvaluations'
import AILogs             from './pages/AILogs'
import NotFound           from './pages/NotFound'
import Departments        from './pages/Departments'
import Subjects           from './pages/Subjects'
import Blocks             from './pages/Blocks'
import DeptStudents       from './pages/DeptStudents'
import TeacherAssignments from './pages/TeacherAssignments'
import Enrollments        from './pages/Enrollments'

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

const ADMIN_ROLES = ['guidance', 'admin']
const MGMT_ROLES  = ['guidance', 'admin', 'president', 'vp']

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Dashboard />} />

          <Route path="questionnaires" element={<Questionnaires />} />
          <Route path="questionnaires/new"
            element={<RequireAuth roles={['guidance','admin','staff']}><QuestionnaireForm /></RequireAuth>} />
          <Route path="questionnaires/:id" element={<QuestionnaireDetail />} />
          <Route path="questionnaires/:id/edit"
            element={<RequireAuth roles={['guidance','admin','staff']}><QuestionnaireForm /></RequireAuth>} />

          <Route path="approvals"
            element={<RequireAuth roles={['president','vp','department_head']}><ApprovalQueue /></RequireAuth>} />

          <Route path="periods" element={<EvaluationPeriods />} />
          <Route path="evaluate/:periodId/:teacherId" element={<EvaluateTeacher />} />
          <Route path="my-evaluations"
            element={<RequireAuth roles={['teacher']}><MyEvaluations /></RequireAuth>} />

          <Route path="reports" element={<Reports />} />
          <Route path="reports/:id" element={<ReportDetail />} />

          <Route path="ai-logs"
            element={<RequireAuth roles={['guidance','admin','president','vp']}><AILogs /></RequireAuth>} />

          <Route path="users"
            element={<RequireAuth roles={[...MGMT_ROLES,'department_head']}><Users /></RequireAuth>} />

          <Route path="departments"
            element={<RequireAuth roles={ADMIN_ROLES}><Departments /></RequireAuth>} />

          <Route path="subjects"
            element={<RequireAuth roles={ADMIN_ROLES}><Subjects /></RequireAuth>} />

          <Route path="blocks"
            element={<RequireAuth roles={['department_head']}><Blocks /></RequireAuth>} />

          <Route path="dept-students"
            element={<RequireAuth roles={['department_head']}><DeptStudents /></RequireAuth>} />

          <Route path="assignments"
            element={<RequireAuth roles={['department_head']}><TeacherAssignments /></RequireAuth>} />

          <Route path="enrollments"
            element={<RequireAuth roles={['department_head']}><Enrollments /></RequireAuth>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}

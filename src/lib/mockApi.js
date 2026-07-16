// ─────────────────────────────────────────────────────────────────────────────
// Mock API — replaces all axios/backend calls with in-memory data operations.
// All functions return a promise that resolves with { data: ... }
// to match the real axios response shape used throughout the app.
// ─────────────────────────────────────────────────────────────────────────────
import {
  MOCK_USERS, MOCK_DEMO_ACCOUNTS, MOCK_DEPARTMENTS, MOCK_SUBJECTS,
  MOCK_BLOCKS, MOCK_ASSIGNMENTS, MOCK_QUESTIONNAIRES, MOCK_PERIODS,
  MOCK_EVALUATIONS, MOCK_MY_RESULTS, MOCK_REPORTS, MOCK_NOTIFICATIONS,
  MOCK_AI_LOGS, MOCK_ENROLLMENTS, MOCK_PERIOD_TEACHERS,
  MOCK_STATS, MOCK_DEPT_HEAD_STATS,
} from '../data/mockData'

// In-memory mutable stores (start from mock data, modified during session)
let users          = [...MOCK_USERS]
let departments    = [...MOCK_DEPARTMENTS]
let subjects       = [...MOCK_SUBJECTS]
let blocks         = [...MOCK_BLOCKS]
let assignments    = [...MOCK_ASSIGNMENTS]
let questionnaires = [...MOCK_QUESTIONNAIRES]
let periods        = [...MOCK_PERIODS]
let evaluations    = [...MOCK_EVALUATIONS]
let reports        = [...MOCK_REPORTS]
let notifications  = [...MOCK_NOTIFICATIONS]
let aiLogs         = [...MOCK_AI_LOGS]
let enrollments    = [...MOCK_ENROLLMENTS]
let nextId         = 100

const delay = (ms = 120) => new Promise(r => setTimeout(r, ms))
const ok    = (data)     => ({ data })
const err   = (msg, status = 400) => { const e = new Error(msg); e.response = { data: { message: msg }, status }; throw e }

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  await delay()
  const acct = MOCK_DEMO_ACCOUNTS.find(a => a.email === email && a.password === password)
  if (!acct) err('Invalid email or password', 401)
  const user = users.find(u => u.id === acct.userId)
  if (!user) err('User not found', 401)
  if (!user.is_active) err('Account is inactive', 401)
  const token = `mock-token-${user.id}-${Date.now()}`
  return ok({ token, user })
}

export async function getMe() {
  await delay()
  const token = localStorage.getItem('token')
  if (!token || !token.startsWith('mock-token-')) err('Unauthorized', 401)
  const parts  = token.split('-')
  const userId = parseInt(parts[2])
  const user   = users.find(u => u.id === userId)
  if (!user) err('User not found', 401)
  return ok(user)
}

export async function register(form) {
  await delay()
  if (users.find(u => u.email === form.email)) err('Email already registered')
  const newUser = { id: ++nextId, ...form, is_active: 1, department_name: form.department || 'GCUC', department_id: null }
  users.push(newUser)
  return ok({ message: 'Registered successfully' })
}

// ── Users ─────────────────────────────────────────────────────────────────────
export async function getUsers(params = {}) {
  await delay()
  let list = [...users]
  if (params.role)          list = list.filter(u => u.role === params.role)
  if (params.department_id) list = list.filter(u => u.department_id == params.department_id)
  if (params.status === 'active')   list = list.filter(u => u.is_active === 1)
  if (params.status === 'inactive') list = list.filter(u => u.is_active === 0)
  if (params.search) {
    const s = params.search.toLowerCase()
    list = list.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.student_employee_id||'').includes(s))
  }
  if (params.sort === 'email') list.sort((a,b) => a.email.localeCompare(b.email))
  else list.sort((a,b) => a.name.localeCompare(b.name))
  if (params.order === 'desc') list.reverse()
  const page  = parseInt(params.page  || 1)
  const limit = parseInt(params.limit || 20)
  const total = list.length
  const data  = list.slice((page - 1) * limit, page * limit)
  return ok({ data, total, page, limit })
}

export async function getUser(id) {
  await delay()
  const user = users.find(u => u.id == id)
  if (!user) err('User not found', 404)
  return ok(user)
}

export async function createUser(form) {
  await delay()
  if (users.find(u => u.email === form.email)) err('Email already exists')
  const dept = departments.find(d => d.id == form.department_id)
  const newUser = { id: ++nextId, ...form, department_name: dept?.name || '', is_active: 1 }
  users.push(newUser)
  return ok(newUser)
}

export async function updateUser(id, form) {
  await delay()
  const idx = users.findIndex(u => u.id == id)
  if (idx < 0) err('User not found', 404)
  const dept = departments.find(d => d.id == (form.department_id || users[idx].department_id))
  users[idx] = { ...users[idx], ...form, department_name: dept?.name || users[idx].department_name }
  return ok(users[idx])
}

export async function deleteUser(id) {
  await delay()
  const idx = users.findIndex(u => u.id == id)
  if (idx < 0) err('User not found', 404)
  users[idx].is_active = 0
  return ok({ message: 'User deactivated' })
}

// ── Departments ───────────────────────────────────────────────────────────────
export async function getDepartments() {
  await delay(); return ok([...departments])
}
export async function createDepartment(form) {
  await delay()
  const newD = { id: ++nextId, ...form, department_head_name: null }
  if (form.department_head_id) {
    const u = users.find(x => x.id == form.department_head_id)
    newD.department_head_name = u?.name || null
  }
  departments.push(newD); return ok(newD)
}
export async function updateDepartment(id, form) {
  await delay()
  const idx = departments.findIndex(d => d.id == id)
  if (idx < 0) err('Department not found', 404)
  const u = users.find(x => x.id == form.department_head_id)
  departments[idx] = { ...departments[idx], ...form, department_head_name: u?.name || departments[idx].department_head_name }
  return ok(departments[idx])
}
export async function deleteDepartment(id) {
  await delay()
  const idx = departments.findIndex(d => d.id == id)
  if (idx < 0) err('Department not found', 404)
  departments.splice(idx, 1); return ok({ message: 'Deleted' })
}

// ── Subjects ──────────────────────────────────────────────────────────────────
export async function getSubjects(params = {}) {
  await delay()
  let list = [...subjects]
  if (params.department_id) list = list.filter(s => s.department_id == params.department_id)
  if (params.semester)      list = list.filter(s => s.semester === params.semester)
  if (params.search) { const q = params.search.toLowerCase(); list = list.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) }
  return ok(list)
}
export async function createSubject(form) {
  await delay()
  const dept = departments.find(d => d.id == form.department_id)
  const newS = { id: ++nextId, ...form, department_name: dept?.name || '' }
  subjects.push(newS); return ok(newS)
}
export async function updateSubject(id, form) {
  await delay()
  const idx = subjects.findIndex(s => s.id == id)
  if (idx < 0) err('Subject not found', 404)
  const dept = departments.find(d => d.id == form.department_id)
  subjects[idx] = { ...subjects[idx], ...form, department_name: dept?.name || subjects[idx].department_name }
  return ok(subjects[idx])
}
export async function deleteSubject(id) {
  await delay()
  const idx = subjects.findIndex(s => s.id == id)
  if (idx < 0) err('Subject not found', 404)
  subjects.splice(idx, 1); return ok({ message: 'Deleted' })
}

// ── Blocks ────────────────────────────────────────────────────────────────────
export async function getBlocks(params = {}) {
  await delay()
  let list = [...blocks]
  if (params.semester)      list = list.filter(b => b.semester === params.semester)
  if (params.search)        { const q = params.search.toLowerCase(); list = list.filter(b => b.block_name.toLowerCase().includes(q)) }
  if (params.department_id) list = list.filter(b => b.department_id == params.department_id)
  return ok(list)
}
export async function getBlock(id) {
  await delay()
  const b = blocks.find(x => x.id == id)
  if (!b) err('Block not found', 404)
  return ok({ ...b, students: b.students || [], teachers: b.teachers || [] })
}
export async function createBlock(form) {
  await delay()
  const dept = departments.find(d => d.id == form.department_id)
  const newB = { id: ++nextId, ...form, department_name: dept?.name || '', student_count: 0, teacher_count: 0, students: [], teachers: [] }
  blocks.push(newB); return ok(newB)
}
export async function updateBlock(id, form) {
  await delay()
  const idx = blocks.findIndex(b => b.id == id)
  if (idx < 0) err('Block not found', 404)
  blocks[idx] = { ...blocks[idx], ...form }; return ok(blocks[idx])
}
export async function deleteBlock(id) {
  await delay()
  const idx = blocks.findIndex(b => b.id == id)
  if (idx < 0) err('Block not found', 404)
  blocks.splice(idx, 1); return ok({ message: 'Deleted' })
}
export async function assignStudentsToBlock(blockId, studentIds) {
  await delay()
  const idx = blocks.findIndex(b => b.id == blockId)
  if (idx < 0) err('Block not found', 404)
  blocks[idx].students = studentIds.map(id => users.find(u => u.id === id)).filter(Boolean)
  blocks[idx].student_count = studentIds.length
  return ok({ message: 'Students assigned' })
}
export async function assignTeachersToBlock(blockId, teacherIds) {
  await delay()
  const idx = blocks.findIndex(b => b.id == blockId)
  if (idx < 0) err('Block not found', 404)
  blocks[idx].teachers = teacherIds.map(id => users.find(u => u.id === id)).filter(Boolean)
  blocks[idx].teacher_count = teacherIds.length
  return ok({ message: 'Teachers assigned' })
}

// ── Assignments ───────────────────────────────────────────────────────────────
export async function getAssignments() {
  await delay(); return ok([...assignments])
}
export async function createAssignment(form) {
  await delay()
  const teacher = users.find(u => u.id == form.teacher_id)
  const subject = subjects.find(s => s.id == form.subject_id)
  if (!teacher || !subject) err('Teacher or subject not found', 404)
  if (assignments.find(a => a.teacher_id == form.teacher_id && a.subject_id == form.subject_id))
    err('This assignment already exists')
  const newA = { id: ++nextId, teacher_id: parseInt(form.teacher_id), teacher_name: teacher.name, subject_id: parseInt(form.subject_id), subject_name: subject.name, subject_code: subject.code, department_name: subject.department_name }
  assignments.push(newA); return ok(newA)
}
export async function deleteAssignment(id) {
  await delay()
  const idx = assignments.findIndex(a => a.id == id)
  if (idx < 0) err('Assignment not found', 404)
  assignments.splice(idx, 1); return ok({ message: 'Deleted' })
}

// ── Questionnaires ────────────────────────────────────────────────────────────
export async function getQuestionnaires(params = {}) {
  await delay()
  let list = [...questionnaires]
  if (params.status) list = list.filter(q => q.status === params.status)
  if (params.search) { const s = params.search.toLowerCase(); list = list.filter(q => q.title.toLowerCase().includes(s)) }
  return ok(list)
}
export async function getQuestionnaire(id) {
  await delay()
  const q = questionnaires.find(x => x.id == id)
  if (!q) err('Questionnaire not found', 404)
  return ok(q)
}
export async function createQuestionnaire(form) {
  await delay()
  const newQ = { id: ++nextId, ...form, status: 'draft', created_by: 2, created_by_name: 'Guidance Office', current_level: null, approval_history: [], question_count: form.questions?.length || 0 }
  questionnaires.push(newQ); return ok(newQ)
}
export async function updateQuestionnaire(id, form) {
  await delay()
  const idx = questionnaires.findIndex(q => q.id == id)
  if (idx < 0) err('Questionnaire not found', 404)
  questionnaires[idx] = { ...questionnaires[idx], ...form, question_count: form.questions?.length || questionnaires[idx].question_count }
  return ok(questionnaires[idx])
}
export async function submitQuestionnaireForApproval(id) {
  await delay()
  const idx = questionnaires.findIndex(q => q.id == id)
  if (idx < 0) err('Questionnaire not found', 404)
  if (!['draft','revision_requested','rejected'].includes(questionnaires[idx].status)) err('Cannot submit at current status')
  questionnaires[idx].status = 'pending_dept'
  questionnaires[idx].current_level = 'dept'
  const histEntry = { id: ++nextId, level: 'dept', action: 'submitted', actor_name: 'Current User', actor_role: 'guidance', comments: 'Submitted for approval', acted_at: new Date().toISOString() }
  questionnaires[idx].approval_history = [...(questionnaires[idx].approval_history || []), histEntry]
  return ok({ message: 'Submitted for Department approval' })
}
export async function reviewQuestionnaire(id, { action, comments }) {
  await delay()
  const idx = questionnaires.findIndex(q => q.id == id)
  if (idx < 0) err('Questionnaire not found', 404)
  const q = questionnaires[idx]
  const levelMap = { pending_dept: 'dept', pending_vp: 'vp', pending_president: 'president' }
  const level = levelMap[q.status]
  if (!level) err('No pending approval at current stage')
  const histEntry = { id: ++nextId, level, action, actor_name: 'Current Reviewer', actor_role: level === 'dept' ? 'department_head' : level, comments, acted_at: new Date().toISOString() }
  questionnaires[idx].approval_history = [...(q.approval_history || []), histEntry]
  if (action === 'approved') {
    const next = { dept: 'pending_vp', vp: 'pending_president', president: 'fully_approved' }
    questionnaires[idx].status = next[level]
    questionnaires[idx].current_level = level === 'president' ? null : { dept: 'vp', vp: 'president' }[level]
  } else if (action === 'rejected') {
    questionnaires[idx].status = 'rejected'; questionnaires[idx].current_level = null
  } else {
    questionnaires[idx].status = 'revision_requested'; questionnaires[idx].current_level = null
  }
  return ok({ message: 'Review submitted' })
}
export async function getPendingApprovals() {
  await delay()
  const pending = questionnaires.filter(q => ['pending_dept','pending_vp','pending_president'].includes(q.status))
  return ok(pending)
}
export async function aiSuggestQuestions(form) {
  await delay(800)
  const suggestions = [
    { text: `How effectively does the teacher explain ${form.category} concepts?`, type: 'rating', category: form.category },
    { text: `Does the teacher use varied strategies to address different learning styles in ${form.category}?`, type: 'rating', category: form.category },
    { text: `Rate the teacher's preparation and organization related to ${form.category}.`, type: 'rating', category: form.category },
    { text: `How well does the teacher address student concerns in the area of ${form.category}?`, type: 'rating', category: form.category },
    { text: `Does the teacher effectively integrate ${form.category} practices in class?`, type: 'rating', category: form.category },
    { text: `Please share any additional comments about the teacher's ${form.category}.`, type: 'open_ended', category: form.category },
    { text: `How consistent is the teacher in demonstrating good ${form.category}?`, type: 'rating', category: form.category },
  ]
  return ok({ suggestions: suggestions.slice(0, form.count || 5) })
}

// ── Evaluation Periods ────────────────────────────────────────────────────────
export async function getEvaluationPeriods() {
  await delay(); return ok([...periods])
}
export async function createEvaluationPeriod(form) {
  await delay()
  const q = questionnaires.find(x => x.id == form.questionnaire_id)
  const newP = { id: ++nextId, ...form, questionnaire_title: q?.title || '', is_active: 1, evaluator_type: q?.evaluator_type || 'student' }
  periods.push(newP); return ok(newP)
}
export async function getPeriodTeachers(periodId) {
  await delay()
  return ok(MOCK_PERIOD_TEACHERS[periodId] || [])
}

// ── Evaluations ───────────────────────────────────────────────────────────────
export async function submitEvaluation(form) {
  await delay(500)
  const newEval = { id: ++nextId, ...form, submitted_at: new Date().toISOString() }
  evaluations.push(newEval)
  // Mark teacher list entry as evaluated
  if (MOCK_PERIOD_TEACHERS[form.period_id]) {
    MOCK_PERIOD_TEACHERS[form.period_id] = MOCK_PERIOD_TEACHERS[form.period_id].map(t =>
      t.id === form.teacher_id && (!t.subject_id || t.subject_id === form.subject_id)
        ? { ...t, already_evaluated: true } : t
    )
  }
  return ok({ message: 'Evaluation submitted successfully' })
}
export async function getMyEvaluationResults() {
  await delay(); return ok([...MOCK_MY_RESULTS])
}

// ── Reports ───────────────────────────────────────────────────────────────────
export async function getReports() {
  await delay(); return ok([...reports])
}
export async function getReport(id) {
  await delay()
  const r = reports.find(x => x.id == id)
  if (!r) err('Report not found', 404)
  return ok(r)
}
export async function getMyReports() {
  await delay()
  return ok(reports.filter(r => r.report_type === 'individual').map(r => ({ ...r })))
}
export async function generateIndividualReport(form) {
  await delay(1200)
  const teacher = users.find(u => u.id == form.teacher_id)
  const period  = periods.find(p => p.id == form.period_id)
  const existing = reports.find(r => r.report_type === 'individual' && r.teacher_id == form.teacher_id && r.period_id == form.period_id)
  if (existing) err('Report already generated for this teacher and period')
  const avgScore = (3.8 + Math.random() * 1.2).toFixed(2)
  const newR = { id: ++nextId, report_type: 'individual', teacher_id: parseInt(form.teacher_id), teacher_name: teacher?.name || 'Unknown Teacher', department: teacher?.department || '', department_name: teacher?.department || '', period_id: parseInt(form.period_id), period_title: period?.title || '', average_score: avgScore, total_evaluations: Math.floor(30 + Math.random() * 40), school_year: period?.school_year || '2024-2025', semester: period?.semester || '1st', generated_at: new Date().toISOString(), narrative: `${teacher?.name} has demonstrated strong performance during this evaluation period with an average score of ${avgScore}/5.00. Students report positive learning experiences and effective instructional delivery. The faculty member shows dedication to student success and professional growth.`, strengths: 'Strong subject matter expertise\nEngaging and clear instruction delivery\nGood rapport with students', weaknesses: 'Could improve feedback turnaround time\nMore interactive activities recommended', recommendations: 'Continue current teaching practices\nExplore innovative assessment methods\nAttend professional development workshops' }
  reports.push(newR); return ok(newR)
}
export async function generateDepartmentReport(form) {
  await delay(1500)
  const dept   = departments.find(d => d.id == form.department_id)
  const period = periods.find(p => p.id == form.period_id)
  const avgScore = (3.7 + Math.random() * 1.0).toFixed(2)
  const newR = { id: ++nextId, report_type: 'department', teacher_id: null, teacher_name: null, department_name: dept?.name || 'Unknown', department: dept?.name || '', period_id: parseInt(form.period_id), period_title: period?.title || '', average_score: avgScore, total_evaluations: Math.floor(100 + Math.random() * 100), school_year: period?.school_year || '2024-2025', semester: period?.semester || '1st', generated_at: new Date().toISOString(), narrative: `The ${dept?.name} Department received an overall average rating of ${avgScore}/5.00 for this evaluation period. Faculty across the department demonstrated consistent professional performance and commitment to student development.`, strengths: 'Consistent performance across faculty members\nStrong department culture of excellence\nHigh student satisfaction ratings', weaknesses: 'Some variation in teaching quality across sections\nRoom for improvement in assessment practices', recommendations: 'Foster peer mentoring among faculty\nImplement standardized evaluation feedback templates\nConduct regular faculty development sessions' }
  reports.push(newR); return ok(newR)
}

// ── Notifications ─────────────────────────────────────────────────────────────
export async function getNotifications() {
  await delay()
  return ok({ data: [...notifications], unread_count: notifications.filter(n => !n.is_read).length })
}
export async function markNotificationRead(id) {
  await delay()
  const idx = notifications.findIndex(n => n.id == id)
  if (idx >= 0) notifications[idx].is_read = 1
  return ok({ message: 'Marked as read' })
}
export async function markAllNotificationsRead() {
  await delay()
  notifications = notifications.map(n => ({ ...n, is_read: 1 })); return ok({ message: 'All marked as read' })
}

// ── AI Logs ───────────────────────────────────────────────────────────────────
export async function getAiLogs(params = {}) {
  await delay()
  let list = [...aiLogs]
  if (params.feature) list = list.filter(l => l.feature === params.feature)
  if (params.status)  list = list.filter(l => l.status  === params.status)
  const LIMIT = parseInt(params.limit || 20)
  const page  = parseInt(params.page  || 1)
  const total = list.length
  const data  = list.slice((page - 1) * LIMIT, page * LIMIT)
  const stats = { total_calls: aiLogs.length, grand_total_tokens: aiLogs.reduce((s,l) => s + (l.total_tokens||0), 0), total_prompt_tokens: aiLogs.reduce((s,l) => s + (l.prompt_tokens||0), 0), total_completion_tokens: aiLogs.reduce((s,l) => s + (l.completion_tokens||0), 0), avg_response_ms: Math.round(aiLogs.reduce((s,l) => s + (l.total_ms||0), 0) / aiLogs.length), failed_calls: aiLogs.filter(l => l.status === 'failed').length, suggestion_calls: aiLogs.filter(l => l.feature === 'question_suggestion').length, individual_report_calls: aiLogs.filter(l => l.feature === 'individual_report').length, department_report_calls: aiLogs.filter(l => l.feature === 'department_report').length }
  return ok({ data, total, stats })
}
export async function getAiLog(id) {
  await delay()
  const log = aiLogs.find(l => l.id == id)
  if (!log) err('Log not found', 404)
  return ok(log)
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export async function getDashboardStats(userRole) {
  await delay()
  if (userRole === 'department_head') return ok(MOCK_DEPT_HEAD_STATS)
  return ok(MOCK_STATS)
}

// ── Enrollments ───────────────────────────────────────────────────────────────
export async function getEnrollments(params = {}) {
  await delay()
  let list = [...enrollments]
  if (params.search) { const s = params.search.toLowerCase(); list = list.filter(e => e.student_name.toLowerCase().includes(s) || (e.student_employee_id||'').includes(s)) }
  if (params.subject_id) list = list.filter(e => subjects.find(s => s.id == params.subject_id)?.name === e.subject_name)
  if (params.semester)   list = list.filter(e => e.semester === params.semester)
  return ok(list)
}

// ── Enrollment mutations ──────────────────────────────────────────────────────
export async function enrollStudent(form) {
  await delay()
  const existing = enrollments.find(e =>
    e.student_id == form.student_id &&
    e.subject_id == form.subject_id &&
    e.semester === form.semester &&
    e.school_year === form.school_year
  )
  if (existing) err('Student is already enrolled in this subject for this period')
  const student = users.find(u => u.id == form.student_id)
  const subject = subjects.find(s => s.id == form.subject_id)
  if (!student || !subject) err('Student or subject not found', 404)
  const newE = {
    student_name: student.name,
    student_employee_id: student.student_employee_id || '',
    student_no: student.student_employee_id || '',
    student_id: parseInt(form.student_id),
    subject_id: parseInt(form.subject_id),
    subject_name: subject.name,
    subject_code: subject.code,
    semester: form.semester,
    school_year: form.school_year,
    year_block: student.year_block || '',
    department_name: subject.department_name,
  }
  enrollments.push(newE)
  return ok({ message: 'Student enrolled successfully' })
}

export async function bulkEnrollBlock(form) {
  await delay(400)
  const block = blocks.find(b => b.id == form.block_id)
  if (!block) err('Block not found', 404)
  return ok({ message: `Bulk enrollment completed for block ${block.block_name}` })
}

export async function unenrollStudent(data) {
  await delay()
  const idx = enrollments.findIndex(e =>
    e.student_id == data.student_id &&
    e.subject_id == data.subject_id &&
    e.semester === data.semester &&
    e.school_year === data.school_year
  )
  if (idx >= 0) enrollments.splice(idx, 1)
  return ok({ message: 'Student unenrolled' })
}

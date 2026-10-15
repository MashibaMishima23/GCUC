import * as mock from './mockApi'
import { getMockStarRatings, getMockTeacherRatingDetails } from './mockRatings'

let archiveHistory = []
let archiveFiles = []

const result = data => ({ data })
const currentUser = () => {
	try { return JSON.parse(localStorage.getItem('user') || 'null') }
	catch { return null }
}

async function getTeacherEvaluationScores() {
	const response = await mock.getReports()
	const teacherId = currentUser()?.id
	const studentReports = response.data.filter(report =>
		report.report_type === 'individual' && report.teacher_id === teacherId
	)
	const summarize = reports => ({
		overall_avg: reports.length
			? (reports.reduce((sum, report) => sum + Number(report.average_score || 0), 0) / reports.length).toFixed(2)
			: '0.00',
		total_evaluations: reports.reduce((sum, report) => sum + Number(report.total_evaluations || 0), 0),
		total_evaluators: reports.reduce((sum, report) => sum + Number(report.total_evaluations || 0), 0),
		periods: reports.map(report => ({
			period_title: report.period_title,
			semester: report.semester,
			school_year: report.school_year,
			avg_score: report.average_score,
			evaluation_count: report.total_evaluations,
			evaluator_count: report.total_evaluations,
		})),
	})

	return result({
		student_evaluations: summarize(studentReports),
		peer_evaluations: summarize([]),
	})
}

async function request(method, url, body, config = {}) {
	const path = url.split('?')[0].replace(/^\/+|\/+$/g, '')
	const parts = path.split('/')
	const params = config.params || {}
	const id = parts[1]
	const periodId = parts[2]

	if (path === 'auth/login' && method === 'POST') return mock.login(body.email, body.password)
	if (path === 'auth/me' && method === 'GET') {
		const response = await mock.getMe()
		return result({ user: response.data })
	}
	if (path === 'auth/register' && method === 'POST') return mock.register(body)
	if (path === 'auth/change-password' && method === 'PATCH') return result({ message: 'Password changed' })

	if (path === 'users' && method === 'GET') return mock.getUsers(params)
	if (path === 'users' && method === 'POST') return mock.createUser(body)
	if (parts[0] === 'users' && parts[1] === 'export-credentials' && method === 'GET') {
		const response = await mock.getUsers({ ...params, status: 'active', page: 1, limit: 5000 })
		return result(response.data.data.map(user => ({ ...user, id_number: user.student_employee_id, password: 'password123', login_url: window.location.origin })))
	}
	if (parts[0] === 'users' && parts[2] === 'permanent' && method === 'DELETE') return mock.permanentlyDeleteUser(id)
	if (parts[0] === 'users' && parts[2] === 'archive' && method === 'PATCH') return mock.updateUser(id, body)
	if (parts[0] === 'users' && parts[1] && method === 'GET') return mock.getUser(id)
	if (parts[0] === 'users' && parts[1] && method === 'PATCH') return mock.updateUser(id, body)
	if (parts[0] === 'users' && parts[1] && method === 'DELETE') return mock.deleteUser(id)

	if (path === 'departments' && method === 'GET') return mock.getDepartments()
	if (path === 'departments' && method === 'POST') return mock.createDepartment(body)
	if (parts[0] === 'departments' && parts[2] === 'impact' && method === 'GET') {
		const [users, subjects] = await Promise.all([mock.getUsers({ limit: 5000 }), mock.getSubjects()])
		const departmentUsers = users.data.data.filter(user => user.department_id == id)
		return result({
			student_count: departmentUsers.filter(user => user.role === 'student').length,
			teacher_count: departmentUsers.filter(user => ['teacher', 'department_head'].includes(user.role)).length,
			subject_count: subjects.data.filter(subject => subject.department_id == id).length,
			block_count: (await mock.getBlocks({ department_id: id })).data.length,
		})
	}
	if (parts[0] === 'departments' && parts[2] === 'teachers-subjects' && method === 'GET') {
		const [users, subjects] = await Promise.all([mock.getUsers({ role: 'teacher', limit: 5000 }), mock.getSubjects({ department_id: id })])
		return result({ teachers: users.data.data.filter(user => user.department_id == id), subjects: subjects.data })
	}
	if (parts[0] === 'departments' && parts[1] && method === 'PATCH') return mock.updateDepartment(id, body)
	if (parts[0] === 'departments' && parts[1] && method === 'DELETE') return mock.deleteDepartment(id)

	if (path === 'subjects' && method === 'GET') return mock.getSubjects(params)
	if (path === 'subjects' && method === 'POST') return mock.createSubject(body)
	if (parts[0] === 'subjects' && parts[1] && method === 'PATCH') return mock.updateSubject(id, body)
	if (parts[0] === 'subjects' && parts[1] && method === 'DELETE') return mock.deleteSubject(id)

	if (path === 'blocks' && method === 'GET') return mock.getBlocks(params)
	if (path === 'blocks' && method === 'POST') return mock.createBlock(body)
	if (parts[0] === 'blocks' && parts[2] === 'students' && method === 'POST') return mock.assignStudentsToBlock(id, body.student_ids || [])
	if (parts[0] === 'blocks' && parts[1] && method === 'GET') return mock.getBlock(id)
	if (parts[0] === 'blocks' && parts[1] && method === 'PATCH') return mock.updateBlock(id, body)
	if (parts[0] === 'blocks' && parts[1] && method === 'DELETE') return mock.deleteBlock(id)

	if (path === 'assignments' && method === 'GET') return mock.getAssignments()
	if (path === 'assignments' && method === 'POST') return mock.createAssignment(body)
	if (parts[0] === 'assignments' && parts[1] && method === 'DELETE') return mock.deleteAssignment(id)
	if (parts[0] === 'assignments' && parts[1] === 'subjects' && parts[3] === 'teachers' && method === 'GET') {
		const response = await mock.getAssignments()
		return result(response.data.filter(assignment => assignment.subject_id == parts[2]))
	}

	if (path === 'block-assignments' && method === 'GET') return result([])
	if (path === 'block-assignments' && method === 'POST') return result({ ...body, id: Date.now() })
	if (parts[0] === 'block-assignments' && parts[1] && method === 'DELETE') return result({ message: 'Assignment removed' })

	if (path === 'questionnaires/fixed' && method === 'GET') {
		const response = await mock.getQuestionnaires({ status: 'fully_approved' })
		return response
	}
	if (path === 'questionnaires/approval/pending' && method === 'GET') return mock.getPendingApprovals()
	if (path === 'questionnaires' && method === 'GET') return mock.getQuestionnaires(params)
	if (path === 'questionnaires' && method === 'POST') return mock.createQuestionnaire(body)
	if (path === 'questionnaires/ai-suggest' && method === 'POST') return mock.aiSuggestQuestions(body)
	if (parts[0] === 'questionnaires' && parts[2] === 'submit-approval' && method === 'POST') return mock.submitQuestionnaireForApproval(id)
	if (parts[0] === 'questionnaires' && parts[2] === 'review' && method === 'POST') return mock.reviewQuestionnaire(id, body)
	if (parts[0] === 'questionnaires' && parts[1] && method === 'GET') return mock.getQuestionnaire(id)
	if (parts[0] === 'questionnaires' && parts[1] && method === 'PATCH') return mock.updateQuestionnaire(id, body)

	if (path === 'evaluations/periods' && method === 'GET') return mock.getEvaluationPeriods(params)
	if (path === 'evaluations/periods' && method === 'POST') return mock.createEvaluationPeriod(body)
	if (parts[0] === 'evaluations' && parts[1] === 'periods' && parts[3] === 'teachers' && method === 'GET') return mock.getPeriodTeachers(periodId)
	if (parts[0] === 'evaluations' && parts[1] === 'periods' && parts[3] === 'schedules' && method === 'GET') return result([])
	if (parts[0] === 'evaluations' && parts[1] === 'periods' && parts[3] === 'progress' && method === 'GET') return mock.getPeriodProgress(periodId)
	if (parts[0] === 'evaluations' && parts[1] === 'periods' && parts[3] === 'status' && method === 'GET') return mock.getPeriodTeacherStatus(periodId)
	if (parts[0] === 'evaluations' && parts[1] === 'periods' && parts[3] === 'toggle' && method === 'PATCH') return mock.toggleEvaluationPeriod(periodId)
	if (parts[0] === 'evaluations' && parts[1] === 'periods' && parts[3] === 'schedules' && method === 'PUT') return result({ message: 'Schedules updated' })
	if (parts[0] === 'evaluations' && parts[1] === 'periods' && periodId && method === 'PUT') return mock.updateEvaluationPeriod(periodId, body)
	if (parts[0] === 'evaluations' && parts[1] === 'my-results' && parts[3] === 'details' && method === 'GET') return mock.getMyEvaluationResults()
	if (path === 'evaluations/submit' && method === 'POST') return mock.submitEvaluation(body)

	if (path === 'reports' && method === 'GET') return mock.getReports()
	if (path === 'reports/save' && method === 'POST') return mock.saveReport(body)
	if (path === 'reports/ai-draft' && method === 'POST') return result({ narrative: 'Mock-generated report draft for UI testing.', strengths: '', weaknesses: '', recommendations: '' })
	if (path === 'reports/analyze-comments' && method === 'POST') return result({ analysis: 'Mock comment analysis for UI testing.' })
	if (parts[0] === 'reports' && parts[1] === 'evaluation-data' && method === 'GET') {
		const response = await mock.getReports()
		const report = response.data.find(item => item.period_id == parts[2] && item.teacher_id == parts[3])
		return result(report || {})
	}
	if (parts[0] === 'reports' && parts[1] === 'teacher-detail' && method === 'GET') return result(getMockTeacherRatingDetails(parts[2], parts[3]))
	if (parts[0] === 'reports' && parts[1] === 'star-ratings' && method === 'GET') return result(getMockStarRatings(parts[2], params.star_filter))
	if (parts[0] === 'reports' && parts[1] && method === 'GET') return mock.getReport(id)

	if (path === 'notifications' && method === 'GET') return mock.getNotifications()
	if (path === 'notifications/read-all' && method === 'PATCH') return mock.markAllNotificationsRead()
	if (parts[0] === 'notifications' && parts[2] === 'read' && method === 'PATCH') return mock.markNotificationRead(id)

	if (path === 'dashboard/stats' && method === 'GET') return mock.getDashboardStats(currentUser()?.role)
	if (path === 'dashboard/my-subjects' && method === 'GET') return result([])
	if (path === 'dashboard/my-evaluation-scores' && method === 'GET') return getTeacherEvaluationScores()

	if (path === 'enrollments' && method === 'GET') return mock.getEnrollments(params)
	if (path === 'enrollments' && method === 'POST') return mock.enrollStudent(body)
	if (path === 'enrollments' && method === 'DELETE') return mock.unenrollStudent(config.data || {})
	if (path === 'enrollments/bulk-block' && method === 'POST') return mock.bulkEnrollBlock(body)

	if (path === 'imports/template' && method === 'GET') return result('id_number,name,email,role,department,year_block')
	if (path === 'imports/users' && method === 'POST') return result({ message: 'Mock import completed', total_rows: 0, users_created: 0, skipped_existing: 0, errors: [] })
	if (path === 'imports/subjects' && method === 'POST') return result({ message: 'Mock import completed', total_rows: 0, subjects_created: 0, errors: [] })
	if (path === 'imports/enrollment' && method === 'POST') return mock.bulkImportEnrollments(body)

	if (path === 'archive/history' && method === 'GET') return result([...archiveHistory])
	if (path === 'archive/files' && method === 'GET') return result([...archiveFiles])
	if (path === 'archive/summary' && method === 'GET') {
		const [userResponse, subjectResponse, periodResponse, enrollmentResponse, assignmentResponse] = await Promise.all([
			mock.getUsers({ status: 'active', limit: 5000 }),
			mock.getSubjects({ semester: params.semester }),
			mock.getEvaluationPeriods(),
			mock.getEnrollments({ semester: params.semester }),
			mock.getAssignments(),
		])
		const eligibleUsers = userResponse.data.data.filter(user => !['guidance', 'admin'].includes(user.role))
		const usersByRole = role => eligibleUsers.filter(user => user.role === role).length
		const periodsForYear = periodResponse.data.filter(period => period.semester === params.semester && period.school_year === params.school_year)
		const enrollmentsForYear = enrollmentResponse.data.filter(enrollment => enrollment.school_year === params.school_year)
		return result({
			semester: params.semester,
			school_year: params.school_year,
			users: {
				students: usersByRole('student'),
				teachers: usersByRole('teacher'),
				dept_heads: usersByRole('department_head'),
				staff: usersByRole('staff'),
				total: eligibleUsers.length,
				preserved: 'Guidance and Admin accounts will NOT be archived',
			},
			subjects: subjectResponse.data.filter(subject => subject.school_year === params.school_year).length,
			enrollments: enrollmentsForYear.length,
			evaluation_periods: periodsForYear.length,
			evaluations: (await mock.getPeriodProgress(periodsForYear[0]?.id)).data.total_submissions || 0,
			teacher_assignments: assignmentResponse.data.length,
		})
	}
	if (parts[0] === 'archive' && parts[1] === 'download' && method === 'GET') return result(JSON.stringify({ archive: parts[2], demo: true }, null, 2))
	if (path === 'archive/execute' && method === 'POST') {
		const filename = `archive-${Date.now()}.json`
		archiveFiles = [{ filename, created_at: new Date().toISOString(), size: 0 }, ...archiveFiles]
		archiveHistory = [{ filename, ...body, created_at: new Date().toISOString() }, ...archiveHistory]
		return result({ message: 'Demo archive created', filename, users_archived: 0, subjects_archived: 0 })
	}

	return result({})
}

const api = {
	get: (url, config) => request('GET', url, undefined, config),
	post: (url, body, config) => request('POST', url, body, config),
	put: (url, body, config) => request('PUT', url, body, config),
	patch: (url, body, config) => request('PATCH', url, body, config),
	delete: (url, config) => request('DELETE', url, undefined, config),
}

export default api

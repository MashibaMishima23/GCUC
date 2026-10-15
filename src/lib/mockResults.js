import {
  MOCK_EVALUATIONS, MOCK_PERIODS, MOCK_QUESTIONNAIRES, MOCK_SUBJECTS, MOCK_USERS,
} from '../data/mockData'

export const MOCK_EVALUATIONS_WITH_SUBJECT_SAMPLES = [
  ...MOCK_EVALUATIONS,
  { id: 4, period_id: 3, period_title: '2nd Semester 2023-2024 Student Evaluation', teacher_id: 10, teacher_name: 'Prof. Carlos Dela Cruz', subject_id: 1, subject_name: 'Introduction to Computing', student_id: 21, avg_score: 4.15, semester: '2nd', school_year: '2023-2024', evaluator_type: 'student', submitted_at: '2024-03-21T10:00:00' },
  { id: 5, period_id: 3, period_title: '2nd Semester 2023-2024 Student Evaluation', teacher_id: 10, teacher_name: 'Prof. Carlos Dela Cruz', subject_id: 1, subject_name: 'Introduction to Computing', student_id: 22, avg_score: 4.30, semester: '2nd', school_year: '2023-2024', evaluator_type: 'student', submitted_at: '2024-03-22T10:00:00' },
  { id: 6, period_id: 3, period_title: '2nd Semester 2023-2024 Student Evaluation', teacher_id: 10, teacher_name: 'Prof. Carlos Dela Cruz', subject_id: 2, subject_name: 'Data Structures and Algorithms', student_id: 23, avg_score: 4.75, semester: '2nd', school_year: '2023-2024', evaluator_type: 'student', submitted_at: '2024-03-23T10:00:00' },
  { id: 7, period_id: 1, period_title: '1st Semester 2025-2026 Student Evaluation', teacher_id: 10, teacher_name: 'Prof. Carlos Dela Cruz', subject_id: 2, subject_name: 'Data Structures and Algorithms', student_id: 21, avg_score: 4.50, semester: '1st', school_year: '2025-2026', evaluator_type: 'student', submitted_at: '2026-07-02T10:00:00' },
]

export function getMockTeacherEvaluationDetails(periodId, teacherId) {
  const period = MOCK_PERIODS.find(item => item.id == periodId)
  const teacher = MOCK_USERS.find(item => item.id == teacherId)
  if (!period || !teacher) return null

  const evaluations = MOCK_EVALUATIONS_WITH_SUBJECT_SAMPLES.filter(item =>
    item.period_id == periodId && item.teacher_id == teacherId
  )
  const scores = evaluations.map(item => Number(item.avg_score)).filter(Number.isFinite)
  const overallAverage = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
  const subjectGroups = new Map()

  evaluations.forEach(evaluation => {
    const subject = MOCK_SUBJECTS.find(item => item.id == evaluation.subject_id)
    const key = evaluation.subject_id ?? 'peer'
    const group = subjectGroups.get(key) || { subject, scores: [] }
    group.scores.push(Number(evaluation.avg_score))
    subjectGroups.set(key, group)
  })

  const questionnaire = MOCK_QUESTIONNAIRES.find(item => item.id == period.questionnaire_id)
  const ratingQuestions = (questionnaire?.questions || []).filter(question => question.type === 'rating')

  return {
    period: {
      id: period.id,
      title: period.title,
      semester: period.semester,
      school_year: period.school_year,
      start_date: period.start_date,
      end_date: period.end_date,
    },
    stats: {
      total_evaluations: evaluations.length,
      overall_avg: overallAverage.toFixed(2),
      lowest_rating: scores.length ? Math.min(...scores) : 0,
      highest_rating: scores.length ? Math.max(...scores) : 0,
    },
    question_scores: ratingQuestions.map(question => ({
      question: question.text,
      avg_score: overallAverage.toFixed(2),
      response_count: evaluations.length,
    })),
    comments: [],
    by_subject: [...subjectGroups.values()].map(({ subject, scores: subjectScores }) => ({
      subject: subject?.name || 'Peer Evaluation',
      code: subject?.code || '',
      evaluations: subjectScores.length,
      avg_score: (subjectScores.reduce((sum, score) => sum + score, 0) / subjectScores.length).toFixed(2),
    })),
  }
}
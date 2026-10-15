import { MOCK_EVALUATIONS, MOCK_PERIODS, MOCK_QUESTIONNAIRES, MOCK_USERS } from '../data/mockData'

function getStars(score) {
  if (score >= 4.5) return 5
  if (score >= 3.5) return 4
  if (score >= 2.5) return 3
  if (score >= 1.5) return 2
  return 1
}

function getPeriodTeacherEvaluations(periodId, teacherId) {
  return MOCK_EVALUATIONS.filter(evaluation =>
    evaluation.period_id == periodId && (teacherId == null || evaluation.teacher_id == teacherId)
  )
}

export function getMockStarRatings(periodId, starFilter = 'all') {
  const teacherIds = [...new Set(getPeriodTeacherEvaluations(periodId).map(evaluation => evaluation.teacher_id))]
  const teachers = teacherIds.map(teacherId => {
    const teacher = MOCK_USERS.find(user => user.id === teacherId)
    const teacherEvaluations = getPeriodTeacherEvaluations(periodId, teacherId)
    const average = teacherEvaluations.reduce((sum, evaluation) => sum + Number(evaluation.avg_score || 0), 0) / teacherEvaluations.length

    return {
      id: teacher.id,
      name: teacher.name,
      department: teacher.department,
      department_name: teacher.department_name || teacher.department,
      email: teacher.email,
      avg_score: average.toFixed(2),
      stars: getStars(average),
      total_evaluations: teacherEvaluations.length,
      total_evaluators: new Set(teacherEvaluations.map(evaluation => evaluation.student_id)).size,
    }
  }).sort((first, second) => Number(second.avg_score) - Number(first.avg_score) || first.name.localeCompare(second.name))

  const starCounts = Object.fromEntries([5, 4, 3, 2, 1].map(stars => [
    stars,
    teachers.filter(teacher => teacher.stars === stars).length,
  ]))
  starCounts.all = teachers.length

  return {
    teachers: starFilter && starFilter !== 'all'
      ? teachers.filter(teacher => teacher.stars === Number(starFilter))
      : teachers,
    star_counts: starCounts,
    period_id: Number(periodId),
  }
}

export function getMockTeacherRatingDetails(periodId, teacherId) {
  const teacher = MOCK_USERS.find(user => user.id == teacherId)
  if (!teacher) return null

  const teacherEvaluations = getPeriodTeacherEvaluations(periodId, teacherId)
  const average = teacherEvaluations.length
    ? teacherEvaluations.reduce((sum, evaluation) => sum + Number(evaluation.avg_score || 0), 0) / teacherEvaluations.length
    : 0
  const answerCount = teacherEvaluations.length * 100
  const lowerRating = Math.floor(average)
  const upperRating = Math.min(5, Math.ceil(average))
  const upperCount = lowerRating === upperRating ? 0 : Math.round((average - lowerRating) * answerCount)
  const lowerCount = answerCount - upperCount
  const period = MOCK_PERIODS.find(item => item.id == periodId)
  const questionnaire = MOCK_QUESTIONNAIRES.find(item => item.id == period?.questionnaire_id)
  const categories = [...new Set((questionnaire?.questions || [])
    .filter(question => question.type === 'rating')
    .map(question => question.category || 'General'))]

  return {
    teacher: {
      id: teacher.id,
      name: teacher.name,
      department: teacher.department,
      department_name: teacher.department_name || teacher.department,
      email: teacher.email,
      avg_score: average.toFixed(2),
      stars: getStars(average),
      total_evaluations: teacherEvaluations.length,
    },
    comments: [],
    distribution: [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: rating === lowerRating ? lowerCount : rating === upperRating ? upperCount : 0,
    })),
    categories: categories.map(category => ({ category, avg_score: average.toFixed(2), count: answerCount })),
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// GCUC Evaluation System — Mock Data
// All database operations are replaced with these in-memory arrays.
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_DEPARTMENTS = [
  { id: 1, name: 'Information Technology', code: 'IT', description: 'Bachelor of Science in Information Technology', department_head_id: 4, department_head_name: 'Dr. Maria Santos' },
  { id: 2, name: 'Business Administration', code: 'BA', description: 'Bachelor of Science in Business Administration', department_head_id: 5, department_head_name: 'Prof. Jose Reyes' },
  { id: 3, name: 'Education', code: 'ED', description: 'Bachelor of Secondary and Elementary Education', department_head_id: 6, department_head_name: 'Dr. Ana Cruz' },
  { id: 4, name: 'Nursing', code: 'NR', description: 'Bachelor of Science in Nursing', department_head_id: 7, department_head_name: 'Dr. Lourdes Tan' },
  { id: 5, name: 'Criminology', code: 'CR', description: 'Bachelor of Science in Criminology', department_head_id: 8, department_head_name: 'Capt. Ricardo Gomez' },
]

export const MOCK_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@gcuc.edu.ph', role: 'admin', department: 'GCUC', department_name: 'GCUC', department_id: null, student_employee_id: 'ADM-001', employee_id: 'ADM-001', is_active: 1 },
  { id: 2, name: 'Guidance Office', email: 'guidance@gcuc.edu.ph', role: 'guidance', department: 'GCUC', department_name: 'GCUC', department_id: null, student_employee_id: 'GID-001', employee_id: 'GID-001', is_active: 1 },
  { id: 3, name: 'Dr. President Lim', email: 'president@gcuc.edu.ph', role: 'president', department: 'GCUC', department_name: 'GCUC', department_id: null, student_employee_id: 'PRES-001', employee_id: 'PRES-001', is_active: 1 },
  { id: 9, name: 'VP Fernandez', email: 'vp@gcuc.edu.ph', role: 'vp', department: 'GCUC', department_name: 'GCUC', department_id: null, student_employee_id: 'VP-001', employee_id: 'VP-001', is_active: 1 },
  { id: 4, name: 'Dr. Maria Santos', email: 'msantos@gcuc.edu.ph', role: 'department_head', department: 'Information Technology', department_name: 'Information Technology', department_id: 1, student_employee_id: 'EMP-101', employee_id: 'EMP-101', is_active: 1 },
  { id: 5, name: 'Prof. Jose Reyes', email: 'jreyes@gcuc.edu.ph', role: 'department_head', department: 'Business Administration', department_name: 'Business Administration', department_id: 2, student_employee_id: 'EMP-102', employee_id: 'EMP-102', is_active: 1 },
  { id: 6, name: 'Dr. Ana Cruz', email: 'acruz@gcuc.edu.ph', role: 'department_head', department: 'Education', department_name: 'Education', department_id: 3, student_employee_id: 'EMP-103', employee_id: 'EMP-103', is_active: 1 },
  { id: 7, name: 'Dr. Lourdes Tan', email: 'ltan@gcuc.edu.ph', role: 'department_head', department: 'Nursing', department_name: 'Nursing', department_id: 4, student_employee_id: 'EMP-104', employee_id: 'EMP-104', is_active: 1 },
  { id: 8, name: 'Capt. Ricardo Gomez', email: 'rgomez@gcuc.edu.ph', role: 'department_head', department: 'Criminology', department_name: 'Criminology', department_id: 5, student_employee_id: 'EMP-105', employee_id: 'EMP-105', is_active: 1 },
  { id: 10, name: 'Prof. Carlos Dela Cruz', email: 'cdelacruz@gcuc.edu.ph', role: 'teacher', department: 'Information Technology', department_name: 'Information Technology', department_id: 1, student_employee_id: 'EMP-201', employee_id: 'EMP-201', is_active: 1 },
  { id: 11, name: 'Ms. Rowena Bautista', email: 'rbautista@gcuc.edu.ph', role: 'teacher', department: 'Information Technology', department_name: 'Information Technology', department_id: 1, student_employee_id: 'EMP-202', employee_id: 'EMP-202', is_active: 1 },
  { id: 12, name: 'Mr. Albert Navarro', email: 'anavarro@gcuc.edu.ph', role: 'teacher', department: 'Business Administration', department_name: 'Business Administration', department_id: 2, student_employee_id: 'EMP-203', employee_id: 'EMP-203', is_active: 1 },
  { id: 13, name: 'Dr. Elena Villanueva', email: 'evillanueva@gcuc.edu.ph', role: 'teacher', department: 'Education', department_name: 'Education', department_id: 3, student_employee_id: 'EMP-204', employee_id: 'EMP-204', is_active: 1 },
  { id: 14, name: 'Prof. Ramon Ocampo', email: 'rocampo@gcuc.edu.ph', role: 'teacher', department: 'Nursing', department_name: 'Nursing', department_id: 4, student_employee_id: 'EMP-205', employee_id: 'EMP-205', is_active: 1 },
  { id: 15, name: 'Staff Member 1', email: 'staff1@gcuc.edu.ph', role: 'staff', department: 'GCUC', department_name: 'GCUC', department_id: null, student_employee_id: 'STF-001', employee_id: 'STF-001', is_active: 1 },
  { id: 20, name: 'Juan Dela Cruz', email: 'jdelacruz@gcuc.edu.ph', role: 'student', department: 'Information Technology', department_name: 'Information Technology', department_id: 1, student_employee_id: '2021-00101', student_id: '2021-00101', year_block: 'BSIT-3A', has_evaluated: false, evaluations_submitted: 0, is_active: 1 },
  { id: 21, name: 'Maria Garcia', email: 'mgarcia@gcuc.edu.ph', role: 'student', department: 'Information Technology', department_name: 'Information Technology', department_id: 1, student_employee_id: '2021-00102', student_id: '2021-00102', year_block: 'BSIT-3A', has_evaluated: false, evaluations_submitted: 0, is_active: 1 },
  { id: 22, name: 'Pedro Santos', email: 'psantos@gcuc.edu.ph', role: 'student', department: 'Business Administration', department_name: 'Business Administration', department_id: 2, student_employee_id: '2022-00201', student_id: '2022-00201', year_block: 'BSBA-2B', has_evaluated: true, evaluations_submitted: 2, is_active: 1 },
  { id: 23, name: 'Ana Reyes', email: 'areyes@gcuc.edu.ph', role: 'student', department: 'Education', department_name: 'Education', department_id: 3, student_employee_id: '2020-00301', student_id: '2020-00301', year_block: 'BSED-4A', has_evaluated: false, evaluations_submitted: 0, is_active: 1 },
  { id: 24, name: 'Carlo Mendoza', email: 'cmendoza@gcuc.edu.ph', role: 'student', department: 'Nursing', department_name: 'Nursing', department_id: 4, student_employee_id: '2023-00401', student_id: '2023-00401', year_block: 'BSN-1A', has_evaluated: true, evaluations_submitted: 1, is_active: 1 },
  { id: 25, name: 'Liza Torres', email: 'ltorres@gcuc.edu.ph', role: 'student', department: 'Information Technology', department_name: 'Information Technology', department_id: 1, student_employee_id: '2021-00103', student_id: '2021-00103', year_block: 'BSIT-3B', has_evaluated: false, evaluations_submitted: 0, is_active: 0 },
]

export const MOCK_DEMO_ACCOUNTS = [
  { email: 'admin@gcuc.edu.ph',    password: 'password123', userId: 1 },
  { email: 'guidance@gcuc.edu.ph', password: 'password123', userId: 2 },
  { email: 'president@gcuc.edu.ph',password: 'password123', userId: 3 },
  { email: 'vp@gcuc.edu.ph',       password: 'password123', userId: 9 },
  { email: 'msantos@gcuc.edu.ph',  password: 'password123', userId: 4 },
  { email: 'cdelacruz@gcuc.edu.ph',password: 'password123', userId: 10 },
  { email: 'jdelacruz@gcuc.edu.ph',password: 'password123', userId: 20 },
  { email: 'staff1@gcuc.edu.ph',   password: 'password123', userId: 15 },
]

export const MOCK_SUBJECTS = [
  { id: 1, code: 'IT101', name: 'Introduction to Computing', department_id: 1, department_name: 'Information Technology', semester: '1st', school_year: '2024-2025' },
  { id: 2, code: 'IT201', name: 'Data Structures and Algorithms', department_id: 1, department_name: 'Information Technology', semester: '1st', school_year: '2024-2025' },
  { id: 3, code: 'IT301', name: 'Systems Analysis and Design', department_id: 1, department_name: 'Information Technology', semester: '2nd', school_year: '2024-2025' },
  { id: 4, code: 'BA101', name: 'Principles of Management', department_id: 2, department_name: 'Business Administration', semester: '1st', school_year: '2024-2025' },
  { id: 5, code: 'BA201', name: 'Financial Accounting', department_id: 2, department_name: 'Business Administration', semester: '2nd', school_year: '2024-2025' },
  { id: 6, code: 'ED101', name: 'Foundations of Education', department_id: 3, department_name: 'Education', semester: '1st', school_year: '2024-2025' },
  { id: 7, code: 'NR101', name: 'Anatomy and Physiology', department_id: 4, department_name: 'Nursing', semester: '1st', school_year: '2024-2025' },
  { id: 8, code: 'CR101', name: 'Introduction to Criminology', department_id: 5, department_name: 'Criminology', semester: '1st', school_year: '2024-2025' },
]

export const MOCK_BLOCKS = [
  { id: 1, block_name: 'BSIT-3A', semester: '1st', academic_year: '2024-2025', department_id: 1, department_name: 'Information Technology', student_count: 35, teacher_count: 4, students: [], teachers: [] },
  { id: 2, block_name: 'BSIT-3B', semester: '1st', academic_year: '2024-2025', department_id: 1, department_name: 'Information Technology', student_count: 32, teacher_count: 3, students: [], teachers: [] },
  { id: 3, block_name: 'BSBA-2B', semester: '1st', academic_year: '2024-2025', department_id: 2, department_name: 'Business Administration', student_count: 40, teacher_count: 5, students: [], teachers: [] },
  { id: 4, block_name: 'BSED-4A', semester: '2nd', academic_year: '2024-2025', department_id: 3, department_name: 'Education', student_count: 28, teacher_count: 4, students: [], teachers: [] },
  { id: 5, block_name: 'BSN-1A', semester: '1st', academic_year: '2024-2025', department_id: 4, department_name: 'Nursing', student_count: 45, teacher_count: 6, students: [], teachers: [] },
]

export const MOCK_ASSIGNMENTS = [
  { id: 1, teacher_id: 10, teacher_name: 'Prof. Carlos Dela Cruz', subject_id: 1, subject_name: 'Introduction to Computing', subject_code: 'IT101', department_name: 'Information Technology' },
  { id: 2, teacher_id: 10, teacher_name: 'Prof. Carlos Dela Cruz', subject_id: 2, subject_name: 'Data Structures and Algorithms', subject_code: 'IT201', department_name: 'Information Technology' },
  { id: 3, teacher_id: 11, teacher_name: 'Ms. Rowena Bautista', subject_id: 3, subject_name: 'Systems Analysis and Design', subject_code: 'IT301', department_name: 'Information Technology' },
  { id: 4, teacher_id: 12, teacher_name: 'Mr. Albert Navarro', subject_id: 4, subject_name: 'Principles of Management', subject_code: 'BA101', department_name: 'Business Administration' },
  { id: 5, teacher_id: 13, teacher_name: 'Dr. Elena Villanueva', subject_id: 6, subject_name: 'Foundations of Education', subject_code: 'ED101', department_name: 'Education' },
]

export const MOCK_QUESTIONS_SET = [
  { id: 1, text: 'How effectively does the teacher explain concepts and ideas?', type: 'rating', category: 'Teaching Methods', source: 'manual' },
  { id: 2, text: 'Does the teacher use varied and engaging teaching strategies?', type: 'rating', category: 'Teaching Methods', source: 'ai_generated' },
  { id: 3, text: 'How clearly does the teacher communicate learning objectives?', type: 'rating', category: 'Communication Skills', source: 'manual' },
  { id: 4, text: 'Is the teacher approachable and responsive to student questions?', type: 'rating', category: 'Communication Skills', source: 'ai_generated' },
  { id: 5, text: 'Does the teacher demonstrate mastery of the subject matter?', type: 'rating', category: 'Subject Mastery', source: 'manual' },
  { id: 6, text: 'How well does the teacher manage classroom time and activities?', type: 'rating', category: 'Classroom Management', source: 'manual' },
  { id: 7, text: 'Does the teacher provide constructive feedback on student work?', type: 'rating', category: 'Assessment & Feedback', source: 'ai_generated' },
  { id: 8, text: 'Please share any additional feedback or suggestions for improvement.', type: 'open_ended', category: 'Other', source: 'manual' },
]

export const MOCK_QUESTIONNAIRES = [
  {
    id: 1, title: 'Student Evaluation Form — 1st Semester 2024-2025', description: 'Standard student evaluation of teacher performance', evaluator_type: 'student', semester: '1st', school_year: '2024-2025', status: 'fully_approved', created_by: 2, created_by_name: 'Guidance Office', current_level: null, question_count: 8,
    questions: MOCK_QUESTIONS_SET,
    approval_history: [
      { id: 1, level: 'dept', action: 'approved', actor_name: 'Dr. Maria Santos', actor_role: 'department_head', comments: 'Questions are well-structured and appropriate.', acted_at: '2024-08-10T09:00:00' },
      { id: 2, level: 'vp', action: 'approved', actor_name: 'VP Fernandez', actor_role: 'vp', comments: 'Approved at VP level. Good alignment with institutional standards.', acted_at: '2024-08-12T14:00:00' },
      { id: 3, level: 'president', action: 'approved', actor_name: 'Dr. President Lim', actor_role: 'president', comments: 'Final approval granted. Deploy for 1st semester.', acted_at: '2024-08-14T10:00:00' },
    ],
    source_summary: { manual: 4, ai_generated: 3 },
  },
  {
    id: 2, title: 'Peer Evaluation Form — Faculty 2024-2025', description: 'Faculty peer evaluation questionnaire', evaluator_type: 'peer', semester: '1st', school_year: '2024-2025', status: 'pending_vp', created_by: 2, created_by_name: 'Guidance Office', current_level: 'vp', question_count: 6,
    questions: MOCK_QUESTIONS_SET.slice(0, 6),
    approval_history: [
      { id: 4, level: 'dept', action: 'approved', actor_name: 'Dr. Maria Santos', actor_role: 'department_head', comments: 'Looks good for peer review.', acted_at: '2024-09-01T11:00:00' },
    ],
    source_summary: { manual: 3, ai_generated: 2, ai_edited: 1 },
  },
  {
    id: 3, title: 'Student Evaluation Form — 2nd Semester 2024-2025', description: 'Second semester student evaluation', evaluator_type: 'student', semester: '2nd', school_year: '2024-2025', status: 'draft', created_by: 15, created_by_name: 'Staff Member 1', current_level: null, question_count: 5,
    questions: MOCK_QUESTIONS_SET.slice(0, 5),
    approval_history: [],
    source_summary: { manual: 5 },
  },
  {
    id: 4, title: 'Mid-Year Faculty Evaluation', description: 'Mid-year evaluation form', evaluator_type: 'student', semester: '1st', school_year: '2024-2025', status: 'revision_requested', created_by: 2, created_by_name: 'Guidance Office', current_level: null, question_count: 7,
    questions: MOCK_QUESTIONS_SET.slice(0, 7),
    approval_history: [
      { id: 5, level: 'dept', action: 'revision_requested', actor_name: 'Dr. Maria Santos', actor_role: 'department_head', comments: 'Please revise question #3 — it needs to be more specific about instructional delivery.', acted_at: '2024-09-05T10:00:00' },
    ],
    source_summary: { manual: 4, ai_generated: 3 },
  },
]

export const MOCK_PERIODS = [
  {
    id: 1, title: '1st Semester 2025-2026 Student Evaluation', questionnaire_id: 1, questionnaire_title: 'Student Evaluation Form — 1st Semester 2024-2025', semester: '1st', school_year: '2025-2026', start_date: '2026-06-01', end_date: '2027-05-31', is_active: 1, evaluator_type: 'student',
  },
  {
    id: 2, title: 'Peer Evaluation — Faculty 2025-2026', questionnaire_id: 2, questionnaire_title: 'Peer Evaluation Form — Faculty 2024-2025', semester: '1st', school_year: '2025-2026', start_date: '2026-06-15', end_date: '2027-05-31', is_active: 1, evaluator_type: 'peer',
  },
  {
    id: 3, title: '2nd Semester 2023-2024 Student Evaluation', questionnaire_id: 1, questionnaire_title: 'Student Evaluation Form — 1st Semester 2024-2025', semester: '2nd', school_year: '2023-2024', start_date: '2024-01-15', end_date: '2024-05-31', is_active: 0, evaluator_type: 'student',
  },
]

export const MOCK_EVALUATIONS = [
  { id: 1, period_id: 1, period_title: '1st Semester 2025-2026 Student Evaluation', teacher_id: 10, teacher_name: 'Prof. Carlos Dela Cruz', subject_id: 1, subject_name: 'Introduction to Computing', student_id: 20, avg_score: 4.25, semester: '1st', school_year: '2025-2026', evaluator_type: 'student', submitted_at: '2026-07-01T10:00:00' },
  { id: 2, period_id: 1, period_title: '1st Semester 2025-2026 Student Evaluation', teacher_id: 11, teacher_name: 'Ms. Rowena Bautista', subject_id: 3, subject_name: 'Systems Analysis and Design', student_id: 20, avg_score: 3.87, semester: '1st', school_year: '2025-2026', evaluator_type: 'student', submitted_at: '2026-07-01T10:30:00' },
  { id: 3, period_id: 3, period_title: '2nd Semester 2023-2024 Student Evaluation', teacher_id: 10, teacher_name: 'Prof. Carlos Dela Cruz', subject_id: 2, subject_name: 'Data Structures and Algorithms', student_id: 20, avg_score: 4.50, semester: '2nd', school_year: '2023-2024', evaluator_type: 'student', submitted_at: '2024-03-20T09:00:00' },
]

export const MOCK_MY_RESULTS = [
  { id: 1, period_id: 1, period_title: '1st Semester 2025-2026 Student Evaluation', subject_name: 'Introduction to Computing', semester: '1st', school_year: '2025-2026', avg_score: 4.25, evaluator_type: 'student', submitted_at: '2026-07-01' },
  { id: 2, period_id: 3, period_title: '2nd Semester 2023-2024 Student Evaluation', subject_name: 'Data Structures and Algorithms', semester: '2nd', school_year: '2023-2024', avg_score: 4.50, evaluator_type: 'student', submitted_at: '2024-05-10' },
]

export const MOCK_REPORTS = [
  {
    id: 1, report_type: 'individual', teacher_id: 10, teacher_name: 'Prof. Carlos Dela Cruz', department: 'Information Technology', department_name: 'Information Technology', period_id: 1, period_title: '1st Semester 2025-2026 Student Evaluation', average_score: 4.25, total_evaluations: 52, school_year: '2025-2026', semester: '1st', generated_at: '2026-07-10T08:00:00',
    narrative: 'Prof. Carlos Dela Cruz has demonstrated consistent excellence in the delivery of Information Technology subjects during the 1st Semester of Academic Year 2024-2025. Based on student evaluations from IT101 and IT201, the faculty member received an overall average rating of 4.25 out of 5.00, placing performance at the Very Satisfactory level.\n\nStudents particularly commended Prof. Dela Cruz for his ability to simplify complex programming concepts and relate them to real-world applications. The structured approach to teaching and the use of visual aids significantly contributed to student comprehension.\n\nOverall, the faculty demonstrates strong professional competence and a genuine commitment to student learning.',
    strengths: 'Clear and engaging explanation of technical concepts\nExcellent command of the subject matter\nUse of real-world examples to illustrate abstract ideas\nConsistent availability for student consultation',
    weaknesses: 'Occasional pacing issues — advanced topics sometimes covered too quickly\nLimited use of interactive activities during lectures\nFeedback on student assignments could be more detailed',
    recommendations: 'Incorporate more hands-on activities and pair programming exercises\nProvide written feedback alongside grades for major projects\nConsider flipped classroom techniques for advanced modules',
  },
  {
    id: 2, report_type: 'department', teacher_id: null, teacher_name: null, department_name: 'Information Technology', department: 'Information Technology', period_id: 1, period_title: '1st Semester 2025-2026 Student Evaluation', average_score: 4.06, total_evaluations: 180, school_year: '2025-2026', semester: '1st', generated_at: '2026-07-10T09:00:00',
    narrative: 'The Information Technology Department received an overall average rating of 4.06 out of 5.00 for the 1st Semester of Academic Year 2024-2025. A total of 180 student evaluations were collected across all IT subjects and faculty members.\n\nThe department shows strong performance across teaching methodology and subject mastery dimensions. Faculty are commended for adapting to the demands of contemporary IT curriculum and maintaining relevance in their course delivery.\n\nThe department is encouraged to continue collaborative practices and pursue pedagogical innovation to sustain and improve performance outcomes.',
    strengths: 'High subject matter competency across all faculty members\nStrong student-faculty rapport observed in evaluation comments\nConsistently updated course materials reflecting current IT trends',
    weaknesses: 'Variation in teaching quality between junior and senior faculty\nInconsistent classroom management practices observed in practical labs\nFeedback mechanisms need to be standardized across all sections',
    recommendations: 'Implement peer mentoring program pairing junior and senior faculty\nConduct department-wide workshops on active learning strategies\nStandardize assessment rubrics and feedback templates',
  },
  {
    id: 3, report_type: 'individual', teacher_id: 10, teacher_name: 'Prof. Carlos Dela Cruz', department: 'Information Technology', department_name: 'Information Technology', period_id: 3, period_title: '2nd Semester 2023-2024 Student Evaluation', average_score: 4.50, total_evaluations: 48, school_year: '2023-2024', semester: '2nd', generated_at: '2024-06-15T10:00:00',
    narrative: 'Prof. Carlos Dela Cruz achieved an outstanding performance rating of 4.50 out of 5.00 in the 2nd Semester of AY 2023-2024, placing the faculty at the Outstanding performance level. Students consistently praised the professor\'s expertise in Data Structures and dedication to student success.',
    strengths: 'Outstanding clarity of instruction\nExcellent integration of theory and practice\nHighly responsive to student needs',
    weaknesses: 'Minor improvements needed in assessment variety',
    recommendations: 'Continue current teaching practices\nConsider mentoring newer faculty members',
  },
]

export const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'questionnaire_fully_approved', message: 'Student Evaluation Form — 1st Semester 2024-2025 has been fully approved by the President and is ready for deployment.', questionnaire_id: 1, is_read: 0, created_at: '2024-08-14T10:05:00' },
  { id: 2, type: 'approval_submitted', message: 'Peer Evaluation Form — Faculty 2024-2025 has been submitted for approval and is pending Department Head review.', questionnaire_id: 2, is_read: 0, created_at: '2024-08-28T09:00:00' },
  { id: 3, type: 'questionnaire_level_approved', message: 'Peer Evaluation Form has been approved at the Department level and forwarded to the Vice President for review.', questionnaire_id: 2, is_read: 1, created_at: '2024-09-01T11:05:00' },
  { id: 4, type: 'revision_requested', message: 'Mid-Year Faculty Evaluation has been returned for revision. Please review the department head\'s notes and resubmit.', questionnaire_id: 4, is_read: 1, created_at: '2024-09-05T10:05:00' },
]

export const MOCK_AI_LOGS = [
  { id: 1, uuid: 'ai-log-001', feature: 'question_suggestion', status: 'success', model_name: 'llama3', model_used: 'llama3', triggered_by_name: 'Guidance Office', triggered_by_role: 'guidance', prompt_tokens: 512, completion_tokens: 384, total_tokens: 896, prompt_eval_ms: 450, generation_ms: 3200, total_ms: 3650, created_at: '2024-08-08T14:30:00', questionnaire_id: 1, prompt_text: 'Generate 5 student evaluation questions for the category: Teaching Methods...', response_text: '1. How effectively does the teacher explain concepts...' },
  { id: 2, uuid: 'ai-log-002', feature: 'individual_report', status: 'success', model_name: 'llama3', model_used: 'llama3', triggered_by_name: 'Guidance Office', triggered_by_role: 'guidance', prompt_tokens: 1024, completion_tokens: 756, total_tokens: 1780, prompt_eval_ms: 820, generation_ms: 12400, total_ms: 13220, created_at: '2024-11-01T08:05:00', teacher_id: 10, period_id: 1, prompt_text: 'Generate a narrative evaluation report for Prof. Carlos Dela Cruz...', response_text: 'Prof. Carlos Dela Cruz has demonstrated...' },
  { id: 3, uuid: 'ai-log-003', feature: 'department_report', status: 'success', model_name: 'llama3', model_used: 'llama3', triggered_by_name: 'Guidance Office', triggered_by_role: 'guidance', prompt_tokens: 2048, completion_tokens: 1200, total_tokens: 3248, prompt_eval_ms: 1500, generation_ms: 18500, total_ms: 20000, created_at: '2024-11-02T09:05:00', department_id: 1, period_id: 1, prompt_text: 'Generate a department-level evaluation report for Information Technology...', response_text: 'The Information Technology Department received...' },
  { id: 4, uuid: 'ai-log-004', feature: 'question_suggestion', status: 'failed', model_name: 'llama3', model_used: 'llama3', triggered_by_name: 'Staff Member 1', triggered_by_role: 'staff', prompt_tokens: 256, completion_tokens: 0, total_tokens: 256, prompt_eval_ms: 200, generation_ms: 0, total_ms: 5200, created_at: '2024-09-10T16:00:00', error_message: 'Connection refused: Ollama service not running on localhost:11434', prompt_text: 'Generate questions for category: Classroom Management...', response_text: null },
]

export const MOCK_ENROLLMENTS = [
  { student_name: 'Juan Dela Cruz', student_employee_id: '2021-00101', student_no: '2021-00101', subject_name: 'Introduction to Computing', subject_code: 'IT101', semester: '1st', school_year: '2024-2025', department_name: 'Information Technology' },
  { student_name: 'Juan Dela Cruz', student_employee_id: '2021-00101', student_no: '2021-00101', subject_name: 'Data Structures and Algorithms', subject_code: 'IT201', semester: '1st', school_year: '2024-2025', department_name: 'Information Technology' },
  { student_name: 'Maria Garcia', student_employee_id: '2021-00102', student_no: '2021-00102', subject_name: 'Introduction to Computing', subject_code: 'IT101', semester: '1st', school_year: '2024-2025', department_name: 'Information Technology' },
  { student_name: 'Pedro Santos', student_employee_id: '2022-00201', student_no: '2022-00201', subject_name: 'Principles of Management', subject_code: 'BA101', semester: '1st', school_year: '2024-2025', department_name: 'Business Administration' },
  { student_name: 'Ana Reyes', student_employee_id: '2020-00301', student_no: '2020-00301', subject_name: 'Foundations of Education', subject_code: 'ED101', semester: '1st', school_year: '2024-2025', department_name: 'Education' },
  { student_name: 'Carlo Mendoza', student_employee_id: '2023-00401', student_no: '2023-00401', subject_name: 'Anatomy and Physiology', subject_code: 'NR101', semester: '1st', school_year: '2024-2025', department_name: 'Nursing' },
]

export const MOCK_PERIOD_TEACHERS = {
  1: [
    { id: 10, name: 'Prof. Carlos Dela Cruz', department: 'Information Technology', subject_id: 1, subject_name: 'Introduction to Computing', subject_code: 'IT101', already_evaluated: false },
    { id: 10, name: 'Prof. Carlos Dela Cruz', department: 'Information Technology', subject_id: 2, subject_name: 'Data Structures and Algorithms', subject_code: 'IT201', already_evaluated: false },
    { id: 11, name: 'Ms. Rowena Bautista', department: 'Information Technology', subject_id: 3, subject_name: 'Systems Analysis and Design', subject_code: 'IT301', already_evaluated: false },
  ],
  2: [
    { id: 11, name: 'Ms. Rowena Bautista', department: 'Information Technology', already_evaluated: false },
    { id: 12, name: 'Mr. Albert Navarro', department: 'Business Administration', already_evaluated: false },
  ],
}

export const MOCK_STATS = {
  total_departments: 5,
  total_dept_heads: 5,
  total_teachers: 5,
  total_students: 6,
  total_evaluation_forms: 4,
  total_evaluations: 180,
  pending_approvals: 1,
  total_reports: 3,
  total_blocks: 5,
  total_subjects: 8,
  active_periods: [
    { id: 1, title: '1st Semester 2025-2026 Student Evaluation', semester: '1st', school_year: '2025-2026', start_date: '2026-06-01', end_date: '2027-05-31' },
  ],
  ai_stats: {
    total_calls: 4,
    grand_total_tokens: 6180,
    avg_response_ms: 12290,
    failed_calls: 1,
  },
}

export const MOCK_DEPT_HEAD_STATS = {
  total_students: 6,
  total_teachers: 2,
  total_subjects: 3,
  total_blocks: 2,
  total_evaluations: 52,
}

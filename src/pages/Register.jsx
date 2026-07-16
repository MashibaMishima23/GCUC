import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../lib/mockApi'
import toast from 'react-hot-toast'
import { AcademicCapIcon } from '@heroicons/react/24/outline'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'student', department:'', year_block:'', student_id:'', employee_id:'' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Registered successfully! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #2e6da4 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AcademicCapIcon className="w-14 h-14 text-amber-400 mx-auto mb-3" />
          <h1 className="text-white text-3xl font-bold">GCUC</h1>
          <p className="text-primary-200 mt-1">Create your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Juan Dela Cruz" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@gcuc.edu.ph" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={set('role')}>
                <option value="student">Student</option>
                <option value="teacher">Teacher / Faculty</option>
                <option value="staff">Staff</option>
                <option value="department_head">Department Head</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" placeholder="e.g. Information Technology" value={form.department} onChange={set('department')} />
            </div>
            {form.role === 'student' && (
              <>
                <div>
                  <label className="label">Year & Block</label>
                  <input className="input" placeholder="e.g. 3A" value={form.year_block} onChange={set('year_block')} />
                </div>
                <div>
                  <label className="label">Student ID</label>
                  <input className="input" placeholder="e.g. 2021-00123" value={form.student_id} onChange={set('student_id')} />
                </div>
              </>
            )}
            {(form.role === 'teacher' || form.role === 'staff') && (
              <div>
                <label className="label">Employee ID</label>
                <input className="input" placeholder="e.g. EMP-001" value={form.employee_id} onChange={set('employee_id')} />
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 font-medium hover:text-primary-800 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

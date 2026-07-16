import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { AcademicCapIcon } from '@heroicons/react/24/outline'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #2e6da4 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AcademicCapIcon className="w-14 h-14 text-amber-400 mx-auto mb-3" />
          <h1 className="text-white text-3xl font-bold">GCUC</h1>
          <p className="text-primary-200 mt-1">AI-Assisted Teacher Evaluation System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Sign In</h2>

          {/* Demo accounts hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 text-xs text-blue-800">
            <p className="font-semibold mb-1">🎭 Demo Accounts (password: <code>password123</code>)</p>
            <div className="grid grid-cols-2 gap-0.5">
              <span>guidance@gcuc.edu.ph</span><span className="text-blue-500">Guidance</span>
              <span>president@gcuc.edu.ph</span><span className="text-blue-500">President</span>
              <span>vp@gcuc.edu.ph</span><span className="text-blue-500">Vice President</span>
              <span>msantos@gcuc.edu.ph</span><span className="text-blue-500">Dept Head</span>
              <span>cdelacruz@gcuc.edu.ph</span><span className="text-blue-500">Teacher</span>
              <span>jdelacruz@gcuc.edu.ph</span><span className="text-blue-500">Student</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input" placeholder="you@gcuc.edu.ph"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-700 font-medium hover:text-primary-800 hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  UserIcon, EnvelopeIcon, KeyIcon, BriefcaseIcon,
  BuildingOfficeIcon, CheckCircleIcon, XMarkIcon
} from '@heroicons/react/24/outline'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('info') // 'info' | 'password'
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      return toast.error('All password fields are required')
    }
    
    if (passwordForm.new_password.length < 8) {
      return toast.error('New password must be at least 8 characters')
    }
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error('New passwords do not match')
    }
    
    if (passwordForm.current_password === passwordForm.new_password) {
      return toast.error('New password must be different from current password')
    }
    
    setChangingPassword(true)
    try {
      const response = await api.patch('/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      })
      
      toast.success(response.data?.message || 'Password changed successfully!')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      
      // Refresh user data to update is_default_password status
      if (refreshUser) {
        await refreshUser()
      }
      
    } catch (err) {
      console.error('Password change error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to change password'
      toast.error(errorMsg)
    } finally {
      setChangingPassword(false)
    }
  }

  const isDefaultPassword = user?.is_default_password === 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>My Profile</h1>
        <p className="text-gray-500 text-sm">Manage your account settings and security</p>
      </div>

      {/* Warning banner for default password */}
      {isDefaultPassword && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <KeyIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900">Action Required: Change Your Password</h3>
              <p className="text-sm text-amber-700 mt-1">
                You are currently using the default password (<code className="bg-amber-100 px-1 py-0.5 rounded">GCUC@2025</code>). 
                For security reasons, please change it immediately.
              </p>
              <button
                onClick={() => setActiveTab('password')}
                className="mt-2 text-sm font-medium text-amber-900 hover:text-amber-700 underline"
              >
                Change Password Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'info'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserIcon className="w-4 h-4 inline-block mr-2" />
            Account Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'password'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <KeyIcon className="w-4 h-4 inline-block mr-2" />
            Change Password
            {isDefaultPassword && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Required
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Account Information Tab */}
      {activeTab === 'info' && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Account Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                <UserIcon className="w-4 h-4" />
                Full Name
              </label>
              <div className="input bg-gray-50 cursor-not-allowed">
                {user?.name || '—'}
              </div>
            </div>

            {/* ID Number */}
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                <KeyIcon className="w-4 h-4" />
                ID Number
              </label>
              <div className="input bg-gray-50 cursor-not-allowed font-mono text-sm">
                {user?.student_employee_id || user?.employee_id || user?.student_id || '—'}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                <EnvelopeIcon className="w-4 h-4" />
                Email Address
              </label>
              <div className="input bg-gray-50 cursor-not-allowed">
                {user?.email || '—'}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                <BriefcaseIcon className="w-4 h-4" />
                Role
              </label>
              <div className="input bg-gray-50 cursor-not-allowed capitalize">
                {user?.role?.replace('_', ' ') || '—'}
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                <BuildingOfficeIcon className="w-4 h-4" />
                Department
              </label>
              <div className="input bg-gray-50 cursor-not-allowed">
                {user?.department || user?.department_name || '—'}
              </div>
            </div>

            {/* Year & Block (students only) */}
            {user?.role === 'student' && (
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                  <CheckCircleIcon className="w-4 h-4" />
                  Year & Block
                </label>
                <div className="input bg-gray-50 cursor-not-allowed">
                  {user?.year_block || '—'}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              <strong>Note:</strong> To update your account information, please contact the Guidance Office or your Department Head.
            </p>
          </div>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
            <KeyIcon className="w-5 h-5" />
            Change Password
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-5 max-w-lg">
            {/* Current Password */}
            <div>
              <label className="label">Current Password *</label>
              <input
                type="password"
                className="input"
                placeholder="Enter your current password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                required
                autoComplete="current-password"
              />
              {isDefaultPassword && (
                <p className="text-xs text-gray-500 mt-1">
                  Your current password is: <code className="bg-gray-100 px-1 py-0.5 rounded">GCUC@2025</code>
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="label">New Password *</label>
              <input
                type="password"
                className="input"
                placeholder="Enter new password (min. 8 characters)"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 8 characters. Use a mix of letters, numbers, and symbols for better security.
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="label">Confirm New Password *</label>
              <input
                type="password"
                className="input"
                placeholder="Re-enter new password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            {/* Password strength indicator */}
            {passwordForm.new_password && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900 mb-1">Password Strength:</p>
                <div className="space-y-1 text-xs text-blue-700">
                  <div className="flex items-center gap-2">
                    {passwordForm.new_password.length >= 8 ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <XMarkIcon className="w-4 h-4 text-gray-400" />
                    )}
                    At least 8 characters
                  </div>
                  <div className="flex items-center gap-2">
                    {/[A-Z]/.test(passwordForm.new_password) ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <XMarkIcon className="w-4 h-4 text-gray-400" />
                    )}
                    Contains uppercase letter
                  </div>
                  <div className="flex items-center gap-2">
                    {/[0-9]/.test(passwordForm.new_password) ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <XMarkIcon className="w-4 h-4 text-gray-400" />
                    )}
                    Contains number
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordForm.new_password === passwordForm.confirm_password && passwordForm.confirm_password ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <XMarkIcon className="w-4 h-4 text-gray-400" />
                    )}
                    Passwords match
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={changingPassword}
                className="btn-primary flex items-center gap-2"
              >
                {changingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Changing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    Change Password
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })}
                className="btn-secondary"
                disabled={changingPassword}
              >
                Clear
              </button>
            </div>
          </form>

          {/* Security Tips */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Password Security Tips:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                Use a unique password that you don't use for other accounts
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                Avoid using personal information like birthdays or names
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                Never share your password with anyone, including staff
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                Change your password regularly (every 3-6 months recommended)
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  ArchiveBoxIcon, ExclamationTriangleIcon, 
  CheckCircleIcon, ClockIcon, UserGroupIcon,
  BookOpenIcon, AcademicCapIcon, ChartBarIcon,
  ArrowDownTrayIcon, DocumentTextIcon
} from '@heroicons/react/24/outline'

const SEMESTERS = ['1st', '2nd', 'summer']

function StatCard({ icon: Icon, label, value, color = 'bg-blue-50 text-blue-700' }) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-8 h-8 flex-shrink-0" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm font-medium">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function ArchiveSettings() {
  const [semester, setSemester] = useState('1st')
  const [schoolYear, setSchoolYear] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(null)
  const [confirmText, setConfirmText] = useState('')
  const [archiving, setArchiving] = useState(false)
  const [history, setHistory] = useState([])
  const [archiveFiles, setArchiveFiles] = useState([])
  const [archiveResult, setArchiveResult] = useState(null)

  useEffect(() => {
    // Set current school year as default
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const defaultYear = currentMonth >= 6 
      ? `${currentYear}-${currentYear + 1}` 
      : `${currentYear - 1}-${currentYear}`
    setSchoolYear(defaultYear)

    // Load archive history
    loadHistory()
    loadArchiveFiles()
  }, [])

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/archive/history')
      setHistory(data)
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  const loadArchiveFiles = async () => {
    try {
      const { data } = await api.get('/archive/files')
      setArchiveFiles(data)
    } catch (err) {
      console.error('Failed to load archive files:', err)
    }
  }

  const loadSummary = async () => {
    if (!semester || !schoolYear) {
      return toast.error('Please select both semester and school year')
    }

    setLoading(true)
    setSummary(null)
    try {
      const { data } = await api.get('/archive/summary', {
        params: { semester, school_year: schoolYear }
      })
      setSummary(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load summary')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownload = async (filename) => {
    try {
      const response = await api.get(`/archive/download/${filename}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Archive file downloaded')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed')
    }
  }

  const handleArchive = async () => {
    if (confirmText !== 'ARCHIVE') {
      return toast.error('Please type ARCHIVE to confirm')
    }

    if (!confirm(
      `⚠️ FINAL WARNING\n\n` +
      `This will PERMANENTLY archive:\n` +
      `• ${summary.users.total} users (students, teachers, dept heads, staff)\n` +
      `• ${summary.subjects} subjects\n` +
      `• ${summary.enrollments} enrollments\n` +
      `• ${summary.evaluations} evaluations\n\n` +
      `Data will be exported to a JSON file before archival.\n` +
      `Guidance and Admin accounts will be preserved.\n\n` +
      `Are you absolutely sure?`
    )) return

    setArchiving(true)
    setArchiveResult(null)
    try {
      const { data } = await api.post('/archive/execute', {
        semester,
        school_year: schoolYear,
        confirm_text: confirmText
      })

      toast.success(data.message)
      setArchiveResult(data)
      setSummary(null)
      setConfirmText('')
      loadHistory()
      loadArchiveFiles()
      
      // Show detailed results with download link
      setTimeout(() => {
        toast.success(
          `✓ Exported ${formatFileSize(data.export_size)} • ${data.users_archived} users, ` +
          `${data.subjects_archived} subjects archived. Download available in Archive Files section.`,
          { duration: 8000 }
        )
      }, 500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Archive failed')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2">
          <ArchiveBoxIcon className="w-8 h-8 text-primary-600" />
          Archive Management
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Archive semester/year data to maintain system performance. Guidance and Admin accounts are always preserved.
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">⚠️ Archive Process</h3>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li><strong>Step 1:</strong> All data will be <strong>exported to a JSON file</strong> for backup and recovery</li>
              <li><strong>Step 2:</strong> Users will be deactivated and semester data will be archived/deleted</li>
              <li><strong>Guidance and Admin accounts will NOT be affected</strong></li>
              <li>Export files can be downloaded and stored in cloud storage (Google Drive, Dropbox, etc.)</li>
              <li>Only archive data when semester/year is completely finished</li>
              <li>Ensure all reports have been generated before archiving</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Selection Form */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Select Period to Archive</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Semester *</label>
            <select 
              className="input" 
              value={semester} 
              onChange={e => setSemester(e.target.value)}
            >
              {SEMESTERS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">School Year *</label>
            <input 
              type="text" 
              className="input" 
              placeholder="2024-2025"
              value={schoolYear}
              onChange={e => setSchoolYear(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={loadSummary}
              disabled={loading || !semester || !schoolYear}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Preview Archive'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Display */}
      {summary && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard 
              icon={UserGroupIcon} 
              label="Total Users" 
              value={summary.users.total}
              color="bg-blue-50 text-blue-700"
            />
            <StatCard 
              icon={BookOpenIcon} 
              label="Subjects" 
              value={summary.subjects}
              color="bg-purple-50 text-purple-700"
            />
            <StatCard 
              icon={AcademicCapIcon} 
              label="Enrollments" 
              value={summary.enrollments}
              color="bg-green-50 text-green-700"
            />
            <StatCard 
              icon={ClockIcon} 
              label="Evaluation Periods" 
              value={summary.evaluation_periods}
              color="bg-amber-50 text-amber-700"
            />
            <StatCard 
              icon={ChartBarIcon} 
              label="Evaluations" 
              value={summary.evaluations}
              color="bg-pink-50 text-pink-700"
            />
            <StatCard 
              icon={CheckCircleIcon} 
              label="Teacher Assignments" 
              value={summary.teacher_assignments}
              color="bg-indigo-50 text-indigo-700"
            />
          </div>

          {/* User Breakdown */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Users to be Archived</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-700">{summary.users.students}</p>
                <p className="text-xs text-gray-600">Students</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-700">{summary.users.teachers}</p>
                <p className="text-xs text-gray-600">Teachers</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-700">{summary.users.dept_heads}</p>
                <p className="text-xs text-gray-600">Dept Heads</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-700">{summary.users.staff}</p>
                <p className="text-xs text-gray-600">Staff</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              <p className="font-medium">✓ {summary.users.preserved}</p>
            </div>
          </div>

          {/* Confirmation */}
          <div className="card bg-red-50 border-2 border-red-300">
            <h3 className="font-semibold text-red-900 mb-3">Confirm Archive Operation</h3>
            <p className="text-sm text-red-800 mb-4">
              To proceed with archiving <strong>{summary.semester} {summary.school_year}</strong>, 
              type <strong className="font-mono bg-red-100 px-2 py-0.5 rounded">ARCHIVE</strong> below:
            </p>
            <input 
              type="text"
              className="input mb-4"
              placeholder="Type ARCHIVE to confirm"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value.toUpperCase())}
            />
            <div className="flex gap-3">
              <button
                onClick={handleArchive}
                disabled={confirmText !== 'ARCHIVE' || archiving}
                className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {archiving ? 'Archiving...' : `Archive ${summary.semester} ${summary.school_year}`}
              </button>
              <button
                onClick={() => { setSummary(null); setConfirmText('') }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Files */}
      {archiveFiles.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-primary-600" />
            Exported Archive Files
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Download archived data files. These JSON files contain all exported data and can be stored in cloud storage for backup.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Filename</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Size</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {archiveFiles.map((file, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-xs text-gray-800">{file.filename}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(file.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDownload(file.filename)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Archive History */}
      {history.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Archive History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Semester</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">School Year</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Periods</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{h.semester}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{h.school_year}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {h.period_count} period(s)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {h.last_updated ? new Date(h.last_updated).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

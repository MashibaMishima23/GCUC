import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon, ClipboardDocumentListIcon, CheckBadgeIcon,
  CalendarIcon, DocumentTextIcon, UsersIcon,
  ArrowRightOnRectangleIcon, ChartBarIcon, AcademicCapIcon,
  SparklesIcon, BuildingOfficeIcon, RectangleGroupIcon,
  BookOpenIcon, UserGroupIcon, Bars3Icon, XMarkIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import NotificationBell from './NotificationBell'

const navItems = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, roles: ['guidance','admin','president','vp','teacher','student','staff','department_head'] },
  { to: '/users', label: 'Users', icon: UsersIcon, roles: ['guidance','admin','president','vp'] },
  { to: '/departments', label: 'Departments', icon: BuildingOfficeIcon, roles: ['guidance','admin'] },
  { to: '/subjects', label: 'Subjects', icon: BookOpenIcon, roles: ['guidance','admin'] },
  { to: '/questionnaires', label: 'Questionnaires', icon: ClipboardDocumentListIcon, roles: ['guidance','admin','staff','president','vp'] },
  { to: '/approvals', label: 'Approvals', icon: CheckBadgeIcon, roles: ['president','vp','department_head'] },
  { to: '/periods', label: 'Evaluations', icon: CalendarIcon, roles: ['guidance','admin','staff','student','teacher','president','vp'] },
  { to: '/my-evaluations', label: 'My Results', icon: ChartBarIcon, roles: ['teacher'] },
  { to: '/reports', label: 'Reports', icon: DocumentTextIcon, roles: ['guidance','admin','staff','president','vp','teacher'] },
  { to: '/ai-logs', label: 'AI Logs', icon: SparklesIcon, roles: ['guidance','admin','president','vp'] },
  { to: '/dept-students', label: 'My Students', icon: UserGroupIcon, roles: ['department_head'] },
  { to: '/blocks', label: 'Blocks', icon: RectangleGroupIcon, roles: ['department_head'] },
  { to: '/assignments', label: 'Teacher Assignments', icon: BookOpenIcon, roles: ['department_head'] },
  { to: '/enrollments', label: 'Enrollments', icon: ClipboardDocumentListIcon, roles: ['department_head'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const visibleItems = navItems.filter(item => item.roles.includes(user?.role))

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-primary-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AcademicCapIcon className="w-8 h-8 text-gcuc-flame flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">GCUC</p>
            <p className="text-primary-200 text-xs">Evaluation System</p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-primary-300 hover:text-white">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-600 text-white shadow-sm' : 'text-primary-100 hover:bg-primary-700 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-primary-700">
        <div className="mb-3">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <p className="text-primary-300 text-xs capitalize">
            {user?.role?.replace('_', ' ')} · {user?.department || 'GCUC'}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={handleLogout} className="flex items-center gap-2 text-primary-300 hover:text-white text-sm transition-colors">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
          <NotificationBell />
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 bg-primary-800">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col h-full bg-primary-800">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center gap-3 p-4 bg-primary-800 border-b border-primary-700 shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="text-primary-100 hover:text-white">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <AcademicCapIcon className="w-6 h-6 text-gcuc-flame" />
          <span className="font-bold text-white text-sm">GCUC Evaluation</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

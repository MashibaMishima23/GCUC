import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon, ClipboardDocumentListIcon, CheckBadgeIcon,
  CalendarIcon, DocumentTextIcon, UsersIcon,
  ArrowRightOnRectangleIcon, ChartBarIcon, AcademicCapIcon,
  SparklesIcon, BuildingOfficeIcon, RectangleGroupIcon,
  BookOpenIcon, UserGroupIcon, Bars3Icon, XMarkIcon, UserCircleIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import NotificationBell from './NotificationBell'

const navItems = [
  // ── All roles ──────────────────────────────────────────────────────────────
  {
    to: '/', label: 'Dashboard', icon: HomeIcon,
    roles: ['guidance','staff','teacher','student','department_head']
  },
  // ── Admin Only ─────────────────────────────────────────────────────────────
  {
    to: '/users', label: 'Users', icon: UsersIcon,
    roles: ['admin']
  },
  {
    to: '/departments', label: 'Departments', icon: BuildingOfficeIcon,
    roles: ['admin']
  },
  {
    to: '/subjects', label: 'Subjects', icon: BookOpenIcon,
    roles: ['admin']
  },

  {
    to: '/archive', label: 'Archive', icon: ArchiveBoxIcon,
    roles: ['admin']
  },
  // ── Evaluations ───────────────────────────────────────────────────────────
  {
    to: '/periods', label: 'Evaluations', icon: CalendarIcon,
    roles: ['guidance','admin','staff','student','teacher']
  },
  {
    to: '/my-evaluations', label: 'My Results', icon: ChartBarIcon,
    roles: ['teacher']
  },
  // ── Reports ────────────────────────────────────────────────────────────────
  {
    to: '/reports', label: 'Reports', icon: DocumentTextIcon,
    roles: ['guidance','staff']
  },
  {
    to: '/department-info', label: 'Department Info', icon: BuildingOfficeIcon,
    roles: ['guidance','staff']
  },
  // ── Department Head Module — exclusive to dept_head (guidance sees via Users/Departments) ──
  {
    to: '/dept-students', label: 'My Students', icon: UserGroupIcon,
    roles: ['department_head']
  },
  {
    to: '/blocks', label: 'Blocks', icon: RectangleGroupIcon,
    roles: ['department_head']
  },
  {
    to: '/assignments', label: 'Teacher Assignments', icon: BookOpenIcon,
    roles: ['department_head']
  }
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
        {/* Mobile close */}
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-primary-300 hover:text-white">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-primary-100 hover:bg-primary-700 hover:text-white'
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
        <div className="space-y-1">
          <NavLink
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-primary-300 hover:text-white text-sm transition-colors py-1.5 px-2 rounded hover:bg-primary-700"
          >
            <UserCircleIcon className="w-5 h-5" />
            My Profile
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-primary-300 hover:text-white text-sm transition-colors py-1.5 px-2 rounded hover:bg-primary-700"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 bg-primary-800">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col h-full bg-primary-800">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header — always visible, contains bell + user info */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-gray-500 hover:text-gray-700 mr-3">
            <Bars3Icon className="w-5 h-5" />
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 md:hidden">
            <AcademicCapIcon className="w-5 h-5 text-primary-700" />
            <span className="font-bold text-gray-800 text-sm">GCUC Evaluation</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side: Bell + User */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            
            {/* Desktop user menu */}
            <NavLink 
              to="/profile"
              className="hidden md:flex items-center gap-2 text-gray-700 hover:text-primary-700 transition-colors"
              title="My Profile"
            >
              <UserCircleIcon className="w-5 h-5" />
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_',' ')}</p>
              </div>
            </NavLink>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors ml-1"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Logout</span>
            </button>
          </div>
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

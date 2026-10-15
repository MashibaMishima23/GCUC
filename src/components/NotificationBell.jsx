import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import api from '../lib/api'

const TYPE_ICON = {
  approval_submitted:           '📤',
  approval_forwarded:           '➡️',
  questionnaire_level_approved: '✅',
  questionnaire_fully_approved: '🎉',
  questionnaire_rejected:       '❌',
  revision_requested:           '🔄',
}

export default function NotificationBell() {
  const [open, setOpen]     = useState(false)
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const btnRef              = useRef(null)
  const dropRef             = useRef(null)

  const load = useCallback(() => {
    api.get('/notifications').then(r => {
      setNotifs(r.data.data || [])
      setUnread(r.data.unread_count || 0)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [load])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = e => {
      if (
        btnRef.current  && !btnRef.current.contains(e.target) &&
        dropRef.current && !dropRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const markRead = async id => {
    await api.patch(`/notifications/${id}/read`).catch(() => {})
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })))
    setUnread(0)
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={() => { setOpen(o => !o); if (!open) load() }}
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center font-bold leading-none px-0.5">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={dropRef}
          className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50"
          style={{
            animation: 'notif-drop 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BellIcon className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-800 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium hover:underline">
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <BellIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">You're all caught up!</p>
                <p className="text-xs text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  className={`group px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    !n.is_read ? 'bg-primary-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base ${
                      !n.is_read ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      {TYPE_ICON[n.type] || '🔔'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${!n.is_read ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                        {n.message}
                      </p>
                      {n.questionnaire_id && (
                        <Link
                          to={`/questionnaires/${n.questionnaire_id}`}
                          onClick={() => setOpen(false)}
                          className="text-xs text-primary-600 hover:text-primary-800 hover:underline mt-1 inline-block font-medium">
                          View questionnaire →
                        </Link>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-xs text-gray-400">
                          {n.created_at?.slice(0,16).replace('T',' ')}
                        </p>
                        {!n.is_read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="text-xs text-primary-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-xs text-gray-400">{notifs.length} notification{notifs.length !== 1 ? 's' : ''} total</p>
            </div>
          )}
        </div>
      )}

      {/* Animation style */}
      <style>{`
        @keyframes notif-drop {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  )
}

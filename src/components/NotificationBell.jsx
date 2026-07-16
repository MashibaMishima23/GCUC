import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import {
  getNotifications, markNotificationRead, markAllNotificationsRead
} from '../lib/mockApi'

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
  const ref                 = useRef(null)

  const load = () => {
    getNotifications().then(r => {
      setNotifs(r.data.data || [])
      setUnread(r.data.unread_count || 0)
    }).catch(() => {})
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async id => {
    await markNotificationRead(id).catch(() => {})
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    await markAllNotificationsRead().catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })))
    setUnread(0)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) load() }}
        className="relative p-2 text-primary-200 hover:text-white transition-colors rounded-lg hover:bg-primary-700"
        title="Notifications"
      >
        <BellIcon className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-gray-800 text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-800 hover:underline">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No notifications yet</div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                className={`px-4 py-3 cursor-pointer hover:bg-primary-50 transition-colors ${!n.is_read ? 'bg-primary-50' : ''}`}
                onClick={() => markRead(n.id)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] || '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
                    {n.questionnaire_id && (
                      <Link
                        to={`/questionnaires/${n.questionnaire_id}`}
                        className="text-xs text-primary-600 hover:text-primary-800 hover:underline mt-0.5 block"
                        onClick={() => setOpen(false)}
                      >
                        View questionnaire →
                      </Link>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {n.created_at?.slice(0,16).replace('T',' ')}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

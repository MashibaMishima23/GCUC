import { useEffect, useState, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  PlusIcon, PencilIcon, TrashIcon, XMarkIcon,
  MagnifyingGlassIcon, UserGroupIcon
} from '@heroicons/react/24/outline'

const SEMESTERS   = ['1st','2nd','summer']
const YEAR_LEVELS = ['1st Year','2nd Year','3rd Year','4th Year','5th Year']
const SECTIONS    = ['A','B','C','D','E','F']
const EMPTY_FORM  = { year_level:'', section:'', block_name:'', semester:'1st', academic_year:'', department_id:'' }

export default function Blocks() {
  const { user } = useAuth()
  const [blocks, setBlocks]         = useState([])
  const [departments, setDepts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [semFilter, setSem]         = useState('')

  const [modal, setModal]           = useState(null) // 'add'|'edit'|'students'
  const [form, setForm]             = useState(EMPTY_FORM)
  const [editId, setEditId]         = useState(null)
  const [saving, setSaving]         = useState(false)
  const [deleteId, setDeleteId]     = useState(null)

  // block detail for assign modals
  const [activeBlock, setActiveBlock] = useState(null)
  const [allStudents, setAllStudents] = useState([])
  const [selStudents, setSelStudents] = useState([])

  const load = useCallback(() => {
    setLoading(true)
    api.get('/blocks', { params: { search: search || undefined, semester: semFilter || undefined } })
      .then(r => setBlocks(r.data))
      .catch(() => toast.error('Failed to load blocks'))
      .finally(() => setLoading(false))
  }, [search, semFilter])

  useEffect(() => {
    load()
    if (['guidance','admin'].includes(user?.role)) {
      api.get('/departments').then(r => setDepts(r.data)).catch(() => {})
    }
  }, [load, user])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Auto-generate block_name from year_level + section
  const handleYearOrSection = (key, val) => {
    setForm(f => {
      const year    = key === 'year_level' ? val : f.year_level
      const section = key === 'section'    ? val : f.section
      const yearNum = year ? year.replace(/[^0-9]/g, '') : ''
      const blockName = yearNum && section ? `${yearNum}${section}` : ''
      return { ...f, [key]: val, block_name: blockName }
    })
  }

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setModal('add') }

  const openEdit = b => {
    const match = (b.block_name || '').match(/([1-5])([A-F])$/)
    setForm({
      year_level:    match ? `${match[1]}${['st','nd','rd','th','th'][parseInt(match[1])-1]} Year` : '',
      section:       match ? match[2] : '',
      block_name:    b.block_name,
      semester:      b.semester,
      academic_year: b.academic_year,
      department_id: b.department_id,
    })
    setEditId(b.id)
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setEditId(null) }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === 'add') {
        await api.post('/blocks', form)
        toast.success('Block created')
      } else {
        await api.patch(`/blocks/${editId}`, form)
        toast.success('Block updated')
      }
      closeModal()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/blocks/${deleteId}`)
      toast.success('Block deleted')
      setDeleteId(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const openAssignStudents = async b => {
    setActiveBlock(b)
    const [detail, studs] = await Promise.all([
      api.get(`/blocks/${b.id}`),
      api.get('/users', { params: { role: 'student', limit: 500 } }),
    ])
    const assigned = new Set(detail.data.students.map(s => s.id))
    setAllStudents(studs.data.data)
    setSelStudents([...assigned])
    setModal('students')
  }

  const saveStudents = async () => {
    setSaving(true)
    try {
      if (selStudents.length) {
        await api.post(`/blocks/${activeBlock.id}/students`, { student_ids: selStudents })
      }
      toast.success('Students assigned')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const toggleItem = (list, setList, id) => {
    setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Block / Section Management</h1>
          <p className="text-gray-500 text-sm">{blocks.length} blocks</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Create Block
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search block name…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={semFilter} onChange={e => setSem(e.target.value)}>
          <option value="">All Semesters</option>
          {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map(b => (
            <div key={b.id} className="card hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800 text-lg">{b.block_name}</p>
                  <p className="text-xs text-gray-500">{b.department_name} · {b.semester} Sem · {b.academic_year}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(b.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <UserGroupIcon className="w-4 h-4 text-green-500" />
                  {b.student_count} students
                </span>
              </div>
              <button onClick={() => openAssignStudents(b)}
                className="btn-secondary text-xs w-full">Assign Students</button>
            </div>
          ))}
          {blocks.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">No blocks found.</div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">{modal === 'add' ? 'Create Block' : 'Edit Block'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Year Level + Section → auto-builds block_name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Year Level *</label>
                  <select className="input" required value={form.year_level}
                    onChange={e => handleYearOrSection('year_level', e.target.value)}>
                    <option value="">— Select Year —</option>
                    {YEAR_LEVELS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Section *</label>
                  <select className="input" required value={form.section}
                    onChange={e => handleYearOrSection('section', e.target.value)}>
                    <option value="">— Section —</option>
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Block Name</label>
                <input className="input bg-gray-50 text-gray-500" readOnly
                  value={form.block_name || '— auto-generated —'} />
                <p className="text-xs text-gray-400 mt-1">Auto-generated from Year Level + Section (e.g. 3A, 2B)</p>
              </div>
              {['guidance','admin'].includes(user?.role) && (
                <div>
                  <label className="label">Department *</label>
                  <select className="input" required value={form.department_id} onChange={set('department_id')}>
                    <option value="">— Select Department —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Semester *</label>
                  <select className="input" required value={form.semester} onChange={set('semester')}>
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Academic Year *</label>
                  <input className="input" required value={form.academic_year} onChange={set('academic_year')}
                    placeholder="e.g. 2024-2025" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : modal === 'add' ? 'Create Block' : 'Save Changes'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {modal === 'students' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Assign Students to {activeBlock?.block_name}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 text-xs text-gray-500">
              {selStudents.length} selected
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-1">
              {allStudents.map(s => (
                <label key={s.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="rounded"
                    checked={selStudents.includes(s.id)}
                    onChange={() => toggleItem(selStudents, setSelStudents, s.id)} />
                  <span className="text-sm text-gray-800">{s.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{s.year_block || s.student_id}</span>
                </label>
              ))}
              {allStudents.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No students available</p>}
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={saveStudents} disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save Assignments'}
              </button>
              <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Delete Block?</h3>
            <p className="text-sm text-gray-500">All student assignments in this block will be removed.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="btn-primary bg-red-600 hover:bg-red-700">Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

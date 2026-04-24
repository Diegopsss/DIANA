import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { BottomNav } from '../components/layout/BottomNav'
import { HamburgerMenu } from '../components/layout/HamburgerMenu'
import {
  getPhaseForDate,
  PHASE_CONFIG,
  MONTHS_ES,
  DAYS_SHORT,
  dateToString,
  todayString,
} from '../utils/cycleUtils'
import type { CyclePhase } from '../utils/cycleUtils'

interface Profile {
  avg_cycle_duration: number
  avg_bleeding_duration: number
  last_period_start: string | null
}

interface TodayLog {
  flow_level: string | null
  symptoms: string[] | null
}

export const Calendar = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [periodDates, setPeriodDates] = useState<Set<string>>(new Set())
  const [todayLog, setTodayLog] = useState<TodayLog | null>(null)
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [editMode, setEditMode] = useState(false)
  const [editDraft, setEditDraft] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const todayStr = todayString()
  const todayDate = new Date()

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [pRes, periodRes, logRes] = await Promise.all([
      supabase.from('profiles').select('avg_cycle_duration, avg_bleeding_duration, last_period_start').eq('id', user.id).maybeSingle(),
      supabase.from('period_dates').select('date').eq('user_id', user.id),
      supabase.from('daily_logs').select('flow_level, symptoms').eq('user_id', user.id).eq('date', todayStr).maybeSingle(),
    ])
    if (pRes.data) setProfile(pRes.data as Profile)
    if (periodRes.data) setPeriodDates(new Set(periodRes.data.map((r: { date: string }) => r.date)))
    if (logRes.data) setTodayLog(logRes.data as TodayLog)
    setLoading(false)
  }, [user, todayStr])

  useEffect(() => { load() }, [load])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const getDateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const getDayPhase = (day: number): CyclePhase | null => {
    if (!profile?.last_period_start) return null
    const date = new Date(viewYear, viewMonth, day)
    return getPhaseForDate(date, profile.last_period_start, profile.avg_cycle_duration, profile.avg_bleeding_duration)
  }

  const isToday = (day: number) => getDateStr(day) === todayStr
  const isCurrentViewMonth = viewMonth === todayDate.getMonth() && viewYear === todayDate.getFullYear()

  // Edit mode handlers
  const openEdit = () => {
    setEditDraft(new Set(periodDates))
    setEditMode(true)
  }

  const toggleEditDay = (day: number) => {
    const ds = getDateStr(day)
    const d = new Date(editDraft)
    if (d.has(ds)) d.delete(ds)
    else d.add(ds)
    setEditDraft(d)
  }

  const saveEdit = async () => {
    if (!user) return
    const toAdd = [...editDraft].filter((d) => !periodDates.has(d))
    const toRemove = [...periodDates].filter((d) => !editDraft.has(d))

    const ops: Promise<unknown>[] = []
    if (toAdd.length) {
      ops.push(supabase.from('period_dates').insert(toAdd.map((date) => ({ user_id: user.id, date }))))
    }
    for (const date of toRemove) {
      ops.push(supabase.from('period_dates').delete().eq('user_id', user.id).eq('date', date))
    }
    await Promise.all(ops)

    // Update last_period_start to earliest new period date if we added some
    if (toAdd.length) {
      const earliest = [...editDraft].sort()[0]
      await supabase.from('profiles').upsert({ id: user.id, last_period_start: earliest })
    }

    setPeriodDates(new Set(editDraft))
    setEditMode(false)
    load()
  }

  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const currentPhase = isCurrentViewMonth && profile?.last_period_start
    ? getDayPhase(todayDate.getDate())
    : null

  if (loading) {
    return (
      <div className="app-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#9B8B72', fontSize: 15 }}>Cargando...</div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="diana-topbar">
        <button className="icon-btn" onClick={() => setMenuOpen(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button className="diana-topbar-logo" onClick={() => navigate('/home')}>Diana</button>
        <div style={{ width: 40 }} />
      </div>

      <div className="app-content">
        {/* Month nav */}
        <div className="cal-month-nav">
          <button className="icon-btn" onClick={prevMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <span className="cal-month-label">{MONTHS_ES[viewMonth]} {viewYear}</span>
          <button className="icon-btn" onClick={nextMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Phase legend */}
        <div className="cal-legend">
          {(Object.entries(PHASE_CONFIG) as [CyclePhase, typeof PHASE_CONFIG[CyclePhase]][]).map(([phase, cfg]) => (
            <div key={phase} className="cal-legend-item">
              <span className="cal-legend-dot" style={{ background: cfg.color, border: `1.5px solid ${cfg.textColor}` }} />
              <span className="cal-legend-label">{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="cal-grid-wrap">
          <div className="cal-dow-row">
            {DAYS_SHORT.map((d) => <div key={d} className="cal-dow">{d}</div>)}
          </div>
          <div className="cal-grid">
            {Array(firstDow).fill(null).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const ds = getDateStr(day)
              const phase = getDayPhase(day)
              const today_ = isToday(day)
              const isPeriod = periodDates.has(ds)
              const isEdit = editMode && editDraft.has(ds)
              const phaseColor = phase ? PHASE_CONFIG[phase].color : '#F5F0E8'

              return (
                <motion.button
                  key={day}
                  className={`cal-day${today_ ? ' today' : ''}${isPeriod && !editMode ? ' period' : ''}${isEdit ? ' edit-period' : ''}`}
                  style={{ background: editMode ? (isEdit ? 'rgba(255,140,66,0.3)' : '#F5F0E8') : phaseColor }}
                  onClick={() => editMode ? toggleEditDay(day) : undefined}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="cal-day-num">{day}</span>
                  {today_ && <span className="cal-today-ring" />}
                  {isPeriod && !editMode && <span className="cal-period-dot" />}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Info panel */}
        <div className="cal-info-panel">
          <div className="cal-info-item">
            <span className="cal-info-label">Hoy</span>
            <span className="cal-info-value">
              {todayDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className="cal-info-item" style={{ flex: 2, textAlign: 'center' }}>
            <span className="cal-info-label">Fase actual</span>
            <span className="cal-info-value" style={{ color: currentPhase ? PHASE_CONFIG[currentPhase].textColor : '#9B8B72' }}>
              {currentPhase ? PHASE_CONFIG[currentPhase].label : '—'}
            </span>
          </div>
          <div className="cal-info-item" style={{ textAlign: 'right' }}>
            <span className="cal-info-label">Flujo</span>
            <span className="cal-info-value">{todayLog?.flow_level?.replace('_', ' ') || '—'}</span>
          </div>
        </div>

        {todayLog?.symptoms?.length ? (
          <div className="cal-symptoms-bar">
            {todayLog.symptoms.map((s) => (
              <span key={s} className="cal-symptom-tag">{s}</span>
            ))}
          </div>
        ) : null}

        {/* Edit / save buttons */}
        <AnimatePresence>
          {!editMode ? (
            <motion.button
              key="edit"
              className="cal-edit-btn"
              onClick={openEdit}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              Editar fechas de periodo
            </motion.button>
          ) : (
            <motion.div key="edit-bar" className="cal-edit-bar"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
              <p className="cal-edit-hint">Toca los días para marcar/desmarcar tu periodo</p>
              <div className="cal-edit-actions">
                <button className="cal-cancel-btn" onClick={() => setEditMode(false)}>Cancelar</button>
                <button className="cal-save-btn" onClick={saveEdit}>Guardar</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}

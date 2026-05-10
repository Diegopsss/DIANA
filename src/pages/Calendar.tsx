import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { BottomNav } from '../components/layout/BottomNav'
import { HamburgerMenu } from '../components/layout/HamburgerMenu'
import logoHeader from '../assets/images/logo-header.png'
import {
  getPhaseForDate,
  calculateCycleDay,
  PHASE_CONFIG,
  MONTHS_ES,
  DAYS_SHORT,
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
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [monthDir, setMonthDir] = useState<1 | -1>(1)

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
    setMonthDir(-1); setSelectedDay(null)
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    setMonthDir(1); setSelectedDay(null)
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const getDateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const getDayPhase = (day: number): CyclePhase | null => {
    if (!profile?.last_period_start) return null
    return getPhaseForDate(new Date(viewYear, viewMonth, day), profile.last_period_start, profile.avg_cycle_duration, profile.avg_bleeding_duration)
  }

  const isToday = (day: number) => getDateStr(day) === todayStr
  const isCurrentViewMonth = viewMonth === todayDate.getMonth() && viewYear === todayDate.getFullYear()

  const cycleDay = profile?.last_period_start
    ? calculateCycleDay(profile.last_period_start, profile.avg_cycle_duration)
    : null
  const daysUntilPeriod = cycleDay !== null && profile
    ? Math.max(0, profile.avg_cycle_duration - cycleDay)
    : null

  const openEdit = () => { setEditDraft(new Set(periodDates)); setEditMode(true); setSelectedDay(null) }

  const toggleEditDay = (day: number) => {
    const ds = getDateStr(day)
    setEditDraft(prev => {
      const next = new Set(prev)
      next.has(ds) ? next.delete(ds) : next.add(ds)
      return next
    })
  }

  const saveEdit = async () => {
    if (!user) return
    const toAdd = [...editDraft].filter(d => !periodDates.has(d))
    const toRemove = [...periodDates].filter(d => !editDraft.has(d))
    if (toAdd.length) await supabase.from('period_dates').insert(toAdd.map(date => ({ user_id: user.id, date })))
    for (const date of toRemove) await supabase.from('period_dates').delete().eq('user_id', user.id).eq('date', date)
    const allDraftDates = [...editDraft].sort()
    if (allDraftDates.length > 0) {
      await supabase.from('profiles').update({ last_period_start: allDraftDates[0], avg_bleeding_duration: allDraftDates.length }).eq('id', user.id)
    }
    setPeriodDates(new Set(editDraft))
    setEditMode(false)
    load()
  }

  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const currentPhase = isCurrentViewMonth && profile?.last_period_start ? getDayPhase(todayDate.getDate()) : null
  const selectedPhase = selectedDay ? getDayPhase(selectedDay) : null
  const monthKey = `${viewYear}-${viewMonth}`

  if (loading) {
    return (
      <div className="app-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#9B8B72', fontSize: 14 }}>Cargando...</div>
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
        <button className="diana-topbar-logo" onClick={() => navigate('/home')}>
          <img src={logoHeader} alt="Diana" className="topbar-logo-img" />
        </button>
        <div style={{ width: 40 }} />
      </div>

      <div className="app-content">

        {/* Phase banner */}
        {isCurrentViewMonth && currentPhase && (
          <motion.div
            className="phase-banner"
            style={{ background: PHASE_CONFIG[currentPhase].color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div>
              <div className="phase-banner-label" style={{ color: PHASE_CONFIG[currentPhase].textColor }}>
                {PHASE_CONFIG[currentPhase].label}
              </div>
              <div className="phase-banner-sub" style={{ color: PHASE_CONFIG[currentPhase].textColor }}>
                {cycleDay !== null ? `Día ${cycleDay} de tu ciclo` : ''}
                {daysUntilPeriod !== null && daysUntilPeriod > 0 ? ` · ${daysUntilPeriod} días para el período` : ''}
              </div>
            </div>
            <button
              className="phase-banner-btn"
              style={{ borderColor: PHASE_CONFIG[currentPhase].textColor, color: PHASE_CONFIG[currentPhase].textColor }}
              onClick={() => navigate('/phases')}
            >
              Ver fases
            </button>
          </motion.div>
        )}

        {isCurrentViewMonth && !profile?.last_period_start && (
          <div className="setup-prompt" onClick={() => navigate('/settings')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#FF8C42" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" stroke="#FF8C42" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="#FF8C42" />
            </svg>
            Configura tu ciclo en Ajustes para ver las fases
          </div>
        )}

        {/* Main calendar card */}
        <div className="cal-card">

          {/* Month nav inside the card header */}
          <div className="cal-card-header">
            <button className="cal-arrow-btn" onClick={prevMonth}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="cal-month-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={monthKey}
                  className="cal-month-label"
                  initial={{ opacity: 0, y: monthDir * 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: monthDir * -8 }}
                  transition={{ duration: 0.16 }}
                >
                  {MONTHS_ES[viewMonth]} {viewYear}
                </motion.span>
              </AnimatePresence>
            </div>

            <button className="cal-arrow-btn" onClick={nextMonth}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {!isCurrentViewMonth && (
              <button className="cal-today-chip" onClick={() => {
                setViewMonth(todayDate.getMonth())
                setViewYear(todayDate.getFullYear())
                setSelectedDay(null)
              }}>Hoy</button>
            )}
          </div>

          {/* DOW headers */}
          <div className="cal-dow-row">
            {DAYS_SHORT.map(d => <div key={d} className="cal-dow">{d}</div>)}
          </div>

          {/* Grid */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={monthKey}
              className="cal-grid"
              initial={{ opacity: 0, x: monthDir * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: monthDir * -20 }}
              transition={{ duration: 0.18 }}
            >
              {Array(firstDow).fill(null).map((_, i) => <div key={`gap-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const ds = getDateStr(day)
                const phase = getDayPhase(day)
                const today_ = isToday(day)
                const isPeriod = periodDates.has(ds) && !editMode
                const isEditMarked = editMode && editDraft.has(ds)
                const isSelected = selectedDay === day && !editMode
                const phaseColor = phase ? PHASE_CONFIG[phase].color : '#F5F0E8'
                const phaseText = phase ? PHASE_CONFIG[phase].textColor : '#5A3E2B'

                return (
                  <motion.button
                    key={day}
                    className={[
                      'cal-day',
                      today_ ? 'cal-day--today' : '',
                      isPeriod ? 'cal-day--period' : '',
                      isEditMarked ? 'cal-day--edit' : '',
                      isSelected ? 'cal-day--selected' : '',
                    ].filter(Boolean).join(' ')}
                    style={{
                      background: editMode
                        ? (isEditMarked ? 'rgba(176,48,80,0.15)' : '#F5F0E8')
                        : today_ ? 'linear-gradient(135deg, #C07868 0%, #D49564 100%)'
                        : phaseColor,
                      color: today_ ? '#fff' : phaseText,
                      outline: isEditMarked ? '2px solid #B03050' : 'none',
                      outlineOffset: '-2px',
                    }}
                    onClick={() => editMode ? toggleEditDay(day) : setSelectedDay(prev => prev === day ? null : day)}
                    whileTap={{ scale: 0.88 }}
                  >
                    <span className="cal-day-num">{day}</span>
                    {isPeriod && <span className="cal-day-dot" />}
                    {isSelected && <span className="cal-day-ring" />}
                  </motion.button>
                )
              })}
            </motion.div>
          </AnimatePresence>

          {/* Legend */}
          <div className="cal-legend">
            {(Object.entries(PHASE_CONFIG) as [CyclePhase, typeof PHASE_CONFIG[CyclePhase]][]).map(([phase, cfg]) => (
              <div key={phase} className="cal-legend-item">
                <span className="cal-legend-dot" style={{ background: cfg.color, borderColor: cfg.textColor }} />
                <span className="cal-legend-label">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected day detail */}
        <AnimatePresence>
          {selectedDay && !editMode && (
            <motion.div
              key={`sel-${selectedDay}`}
              className="cal-detail-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="cal-detail-row">
                <span className="cal-detail-date">
                  {selectedDay} de {MONTHS_ES[viewMonth]}
                </span>
                {selectedPhase && (
                  <span
                    className="cal-detail-badge"
                    style={{ background: PHASE_CONFIG[selectedPhase].color, color: PHASE_CONFIG[selectedPhase].textColor }}
                  >
                    {PHASE_CONFIG[selectedPhase].label}
                  </span>
                )}
              </div>
              {selectedPhase && (
                <p className="cal-detail-tip">{PHASE_CONFIG[selectedPhase].tips[0]}</p>
              )}
              {getDateStr(selectedDay) === todayStr && todayLog?.flow_level && (
                <span className="cal-detail-flow">Flujo: {todayLog.flow_level.replace('_', ' ')}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit bar / button */}
        <AnimatePresence mode="wait">
          {!editMode ? (
            <motion.button
              key="edit-btn"
              className="cal-edit-btn"
              onClick={openEdit}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              Registrar periodo
            </motion.button>
          ) : (
            <motion.div
              key="edit-bar"
              className="cal-edit-bar"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            >
              <p className="cal-edit-hint">
                Toca los días de tu periodo
                {editDraft.size > 0 && <strong> · {editDraft.size} días</strong>}
              </p>
              <div className="cal-edit-actions">
                <button className="cal-cancel-btn" onClick={() => setEditMode(false)}>Cancelar</button>
                <button className="cal-save-btn" onClick={saveEdit}>Guardar</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ height: 16 }} />
      </div>

      <BottomNav />
    </div>
  )
}

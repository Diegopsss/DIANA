import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { BottomNav } from '../components/layout/BottomNav'
import { HamburgerMenu } from '../components/layout/HamburgerMenu'
import { MOODS, MONTHS_ES, todayString } from '../utils/cycleUtils'

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function formatDateFull(d: string) {
  const date = new Date(d + 'T00:00:00')
  const day = DAYS_ES[date.getDay()]
  const num = date.getDate()
  const month = MONTHS_ES[date.getMonth()].toLowerCase()
  return { day, num, month, year: date.getFullYear() }
}

function prevDay(d: string) {
  const date = new Date(d + 'T00:00:00')
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}

function nextDay(d: string) {
  const date = new Date(d + 'T00:00:00')
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}

export const Diary = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeDate, setActiveDate] = useState(searchParams.get('date') || todayString())
  const [text, setText] = useState('')
  const [mood, setMood] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [recentDates, setRecentDates] = useState<{ date: string; journal_entry: string | null; mood_rank: string | null }[]>([])
  const [shakingMood, setShakingMood] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isToday = activeDate === todayString()
  const dateInfo = formatDateFull(activeDate)
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  const load = useCallback(async () => {
    if (!user) return
    const [entryRes, listRes] = await Promise.all([
      supabase.from('daily_logs').select('journal_entry, mood_rank').eq('user_id', user.id).eq('date', activeDate).maybeSingle(),
      supabase.from('daily_logs').select('date, journal_entry, mood_rank').eq('user_id', user.id).order('date', { ascending: false }).limit(14),
    ])
    setText(entryRes.data?.journal_entry || '')
    setMood(entryRes.data?.mood_rank || '')
    if (listRes.data) setRecentDates(listRes.data)
  }, [user, activeDate])

  useEffect(() => { load() }, [load])

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  const save = async (t: string, m: string) => {
    if (!user || (!t.trim() && !m)) return
    setSaving(true)
    await supabase.from('daily_logs').upsert(
      { user_id: user.id, date: activeDate, journal_entry: t || null, mood_rank: m || null },
      { onConflict: 'user_id,date' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTextChange = (value: string) => {
    setText(value)
    autoResize()
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(value, mood), 900)
  }

  const handleMood = (emoji: string) => {
    const newMood = mood === emoji ? '' : emoji
    setMood(newMood)
    setShakingMood(emoji)
    setTimeout(() => setShakingMood(''), 400)
    save(text, newMood)
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

      <div className="app-content diary-page-content">

        {/* Date navigation */}
        <div className="diary-date-nav">
          <button className="diary-nav-arrow" onClick={() => setActiveDate(prevDay(activeDate))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="diary-date-center">
            <div className="diary-date-main">
              <span className="diary-date-dayname">{dateInfo.day}</span>
              <span className="diary-date-num">{dateInfo.num}</span>
              <span className="diary-date-month">{dateInfo.month} {dateInfo.year !== new Date().getFullYear() ? dateInfo.year : ''}</span>
            </div>
            {isToday && <span className="diary-today-badge">Hoy</span>}
            {!isToday && (
              <button className="diary-goto-today" onClick={() => setActiveDate(todayString())}>
                Ir a hoy
              </button>
            )}
          </div>

          <button
            className="diary-nav-arrow"
            disabled={isToday}
            onClick={() => {
              const next = nextDay(activeDate)
              if (next <= todayString()) setActiveDate(next)
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Writing card */}
        <div className="diary-card">
          <div className="diary-card-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: '#C07868' }}>
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="diary-card-label">
              {isToday ? 'Escribe sobre tu día' : 'Entrada del día'}
            </span>
            <AnimatePresence mode="wait">
              {saving ? (
                <motion.span key="saving" className="diary-autosave saving"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Guardando...
                </motion.span>
              ) : saved ? (
                <motion.span key="saved" className="diary-autosave saved"
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  ✓ Guardado
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>

          <textarea
            ref={textareaRef}
            className="diary-textarea"
            placeholder={isToday ? 'Cuéntame cómo estuvo tu día...' : 'Sin entrada para este día.'}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            readOnly={!isToday}
            rows={6}
          />

          {wordCount > 0 && (
            <div className="diary-wordcount">
              {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}
            </div>
          )}
        </div>

        {/* Mood */}
        <div className="diary-mood-section">
          <p className="diary-section-label">
            {isToday ? '¿Cómo te sientes hoy?' : 'Estado de ánimo'}
          </p>
          <div className="diary-moods-row">
            {MOODS.map((m) => (
              <motion.button
                key={m.emoji}
                className={`diary-mood-chip${mood === m.emoji ? ' active' : ''}${!isToday ? ' readonly' : ''}`}
                onClick={() => isToday && handleMood(m.emoji)}
                animate={shakingMood === m.emoji ? { y: [0, -8, 0, -5, 0] } : { y: 0 }}
                transition={{ duration: 0.35 }}
                whileTap={isToday ? { scale: 0.88 } : {}}
              >
                <span className="diary-mood-emoji">{m.emoji}</span>
                <span className="diary-mood-chipname">{m.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="diary-history-section">
          <p className="diary-section-label">Entradas recientes</p>

          {recentDates.length === 0 ? (
            <div className="diary-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: '#C4B4A0' }}>
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span>Aún no hay entradas</span>
            </div>
          ) : (
            <div className="diary-history-list">
              {recentDates.map((entry) => {
                const d = new Date(entry.date + 'T00:00:00')
                const isActive = entry.date === activeDate
                const hasText = !!entry.journal_entry?.trim()
                const preview = hasText
                  ? entry.journal_entry!.slice(0, 72).trimEnd() + (entry.journal_entry!.length > 72 ? '…' : '')
                  : null
                return (
                  <motion.button
                    key={entry.date}
                    className={`diary-entry-card${isActive ? ' active' : ''}`}
                    onClick={() => setActiveDate(entry.date)}
                    whileTap={{ scale: 0.985 }}
                  >
                    <div className={`diary-entry-date-badge${isActive ? ' active' : ''}`}>
                      <span className="diary-entry-month">
                        {MONTHS_ES[d.getMonth()].slice(0, 3).toUpperCase()}
                      </span>
                      <span className="diary-entry-day">{d.getDate()}</span>
                      <span className="diary-entry-weekday">
                        {DAYS_ES[d.getDay()].slice(0, 2)}
                      </span>
                    </div>
                    <div className="diary-entry-body">
                      {preview ? (
                        <p className="diary-entry-preview">{preview}</p>
                      ) : (
                        <p className="diary-entry-empty-text">Sin texto</p>
                      )}
                      {!hasText && !entry.mood_rank && (
                        <span className="diary-entry-tag empty">Sin registro</span>
                      )}
                    </div>
                    {entry.mood_rank && (
                      <span className="diary-entry-mood">{entry.mood_rank}</span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ height: 24 }} />
      </div>

      <BottomNav />
    </div>
  )
}

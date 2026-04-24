import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { BottomNav } from '../components/layout/BottomNav'
import { HamburgerMenu } from '../components/layout/HamburgerMenu'
import { MOODS, MONTHS_ES, todayString } from '../utils/cycleUtils'

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

  const isToday = activeDate === todayString()

  const load = useCallback(async () => {
    if (!user) return
    const [entryRes, listRes] = await Promise.all([
      supabase.from('daily_logs').select('journal_entry, mood_rank').eq('user_id', user.id).eq('date', activeDate).maybeSingle(),
      supabase.from('daily_logs').select('date, journal_entry, mood_rank').eq('user_id', user.id).order('date', { ascending: false }).limit(14),
    ])
    if (entryRes.data) {
      setText(entryRes.data.journal_entry || '')
      setMood(entryRes.data.mood_rank || '')
    } else {
      setText('')
      setMood('')
    }
    if (listRes.data) setRecentDates(listRes.data)
  }, [user, activeDate])

  useEffect(() => { load() }, [load])

  let saveTimer: ReturnType<typeof setTimeout>
  const handleTextChange = (value: string) => {
    setText(value)
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => save(value, mood), 900)
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
    setTimeout(() => setSaved(false), 1500)
  }

  const handleMood = (emoji: string) => {
    const newMood = mood === emoji ? '' : emoji
    setMood(newMood)
    setShakingMood(emoji)
    setTimeout(() => setShakingMood(''), 500)
    save(text, newMood)
  }

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const monthLabel = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return MONTHS_ES[date.getMonth()]
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

      <div className="app-content" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Entry area */}
        <div className="diary-editor">
          <div className="diary-date-bar">
            <button className="diary-date-nav" onClick={() => {
              const d = new Date(activeDate + 'T00:00:00')
              d.setDate(d.getDate() - 1)
              setActiveDate(todayString() === activeDate ? todayString() : d.toISOString().split('T')[0])
            }}>‹</button>
            <span className="diary-date-label">{formatDate(activeDate)}</span>
            <button
              className="diary-date-nav"
              disabled={isToday}
              onClick={() => {
                const d = new Date(activeDate + 'T00:00:00')
                d.setDate(d.getDate() + 1)
                const next = d.toISOString().split('T')[0]
                if (next <= todayString()) setActiveDate(next)
              }}
            >›</button>
          </div>

          <div className="diary-paper">
            <textarea
              className="diary-textarea"
              placeholder={isToday ? 'Escribe sobre tu día...' : 'Sin entrada para este día'}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              readOnly={!isToday}
            />
          </div>

          {/* Mood selector */}
          <div className="diary-mood-bar">
            <span className="diary-mood-label">¿Cómo te sientes hoy?</span>
            <div className="diary-moods">
              {MOODS.map((m) => (
                <motion.button
                  key={m.emoji}
                  className={`diary-mood-btn${mood === m.emoji ? ' active' : ''}`}
                  onClick={() => handleMood(m.emoji)}
                  animate={shakingMood === m.emoji ? { y: [0, -6, 0, -4, 0] } : { y: 0 }}
                  transition={{ duration: 0.35 }}
                  whileTap={{ scale: 0.85 }}
                  title={m.label}
                >
                  {m.emoji}
                </motion.button>
              ))}
            </div>
          </div>

          {saving && <div className="diary-saving">Guardando...</div>}
          {saved && <div className="diary-saving" style={{ color: '#4A9E6B' }}>✓ Guardado</div>}
        </div>

        {/* Past entries */}
        <div className="diary-history">
          <h3 className="diary-history-title">Entradas recientes</h3>
          {recentDates.length === 0 ? (
            <p className="diary-history-empty">Aún no hay entradas</p>
          ) : (
            recentDates.map((entry) => (
              <motion.button
                key={entry.date}
                className={`diary-history-row${entry.date === activeDate ? ' active' : ''}`}
                onClick={() => setActiveDate(entry.date)}
                whileTap={{ scale: 0.98 }}
              >
                <div className="diary-history-left">
                  <span className="diary-history-month">{monthLabel(entry.date)}</span>
                  <span className="diary-history-day">
                    {new Date(entry.date + 'T00:00:00').getDate()}
                  </span>
                </div>
                <div className="diary-history-preview">
                  {entry.journal_entry
                    ? entry.journal_entry.split(/[.!?]/)[0].trim().slice(0, 60) + '...'
                    : '(sin texto)'}
                </div>
                {entry.mood_rank && <span className="diary-history-mood">{entry.mood_rank}</span>}
              </motion.button>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { BottomNav } from '../components/layout/BottomNav'
import { HamburgerMenu } from '../components/layout/HamburgerMenu'
import logoHeader from '../assets/images/logo-header.png'
import {
  getCurrentPhaseInfo,
  getPhaseForDate,
  PHASE_CONFIG,
  FLOW_LEVELS,
  SYMPTOMS,
  MONTHS_ES,
  DAYS_SHORT,
  todayString,
} from '../utils/cycleUtils'

interface Profile {
  full_name: string | null
  avg_cycle_duration: number
  avg_bleeding_duration: number
  last_period_start: string | null
}

interface DailyLog {
  date: string
  flow_level: string | null
  symptoms: string[] | null
  journal_entry: string | null
  mood_rank: string | null
}

interface LastForumPost {
  id: string
  title: string
  content: string
  created_at: string
}

// ──────────────────────────────────────────
// Mini Calendar
// ──────────────────────────────────────────
const MiniCalendar = ({
  profile,
  periodDates,
  onClick,
}: {
  profile: Profile | null
  periodDates: string[]
  onClick: () => void
}) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const todayStr = todayString()

  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const getDayStyle = (day: number): React.CSSProperties => {
    if (!profile?.last_period_start) return {}
    const phase = getPhaseForDate(
      new Date(year, month, day),
      profile.last_period_start,
      profile.avg_cycle_duration,
      profile.avg_bleeding_duration
    )
    return phase ? { background: PHASE_CONFIG[phase].color } : {}
  }

  const isPeriod = (day: number) =>
    periodDates.includes(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)

  const isToday = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` === todayStr

  return (
    <button className="mini-cal" onClick={onClick}>
      <div className="mini-cal-header">
        <span className="mini-cal-month">{MONTHS_ES[month]} {year}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="#9B8B72" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="mini-cal-grid">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="mini-cal-dow">{d}</div>
        ))}
        {cells.map((day, i) =>
          day ? (
            <div
              key={i}
              className={`mini-cal-day${isToday(day) ? ' today' : ''}${isPeriod(day) ? ' period' : ''}`}
              style={getDayStyle(day)}
            >
              {day}
            </div>
          ) : (
            <div key={i} />
          )
        )}
      </div>
    </button>
  )
}

// ──────────────────────────────────────────
// Flow Drop
// ──────────────────────────────────────────
const FlowDrop = ({ filled, size = 32, onClick }: { filled: boolean; size?: number; onClick: () => void }) => (
  <motion.button className="flow-drop-btn" onClick={onClick} whileTap={{ scale: 0.85 }}>
    <svg width={size} height={size * 1.25} viewBox="0 0 32 40" fill="none">
      <path
        d="M16 2 C16 2 2 18 2 27 a14 14 0 0 0 28 0 C30 18 16 2 16 2z"
        fill={filled ? '#FF8C42' : 'none'}
        stroke={filled ? '#FF8C42' : '#D4A574'}
        strokeWidth="2"
      />
    </svg>
  </motion.button>
)

// ──────────────────────────────────────────
// Symptom Pill
// ──────────────────────────────────────────
const SymptomPill = ({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) => {
  const [shaking, setShaking] = useState(false)
  const handle = () => {
    onToggle()
    setShaking(true)
    setTimeout(() => setShaking(false), 420)
  }
  return (
    <motion.button
      className={`symptom-pill${active ? ' active' : ''}`}
      onClick={handle}
      animate={shaking ? { x: [0, -5, 5, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
    >
      {label}
    </motion.button>
  )
}

// ──────────────────────────────────────────
// Home Page
// ──────────────────────────────────────────
export const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([])
  const [periodDates, setPeriodDates] = useState<string[]>([])
  const [flowLevel, setFlowLevel] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [lastForumPost, setLastForumPost] = useState<LastForumPost | null>(null)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showSetupToast, setShowSetupToast] = useState(false)
  const [showPhaseToast, setShowPhaseToast] = useState(false)
  const hasShownModal = useRef(false)
  const hasShownPhaseToast = useRef(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phaseToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const today = todayString()

  const load = useCallback(async () => {
    if (!user) return
    const [pRes, logRes, recentRes, periodRes, forumRes] = await Promise.all([
      supabase.from('profiles').select('full_name, avg_cycle_duration, avg_bleeding_duration, last_period_start').eq('id', user.id).maybeSingle(),
      supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('daily_logs').select('date, journal_entry, mood_rank').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
      supabase.from('period_dates').select('date').eq('user_id', user.id),
      supabase.from('forum_posts').select('id, title, content, created_at').eq('type', 'consejo').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    if (pRes.data) setProfile(pRes.data as Profile)
    if (logRes.data) { setFlowLevel(logRes.data.flow_level || ''); setSymptoms(logRes.data.symptoms || []) }
    if (recentRes.data) setRecentLogs(recentRes.data as DailyLog[])
    if (periodRes.data) setPeriodDates(periodRes.data.map((r: { date: string }) => r.date))
    if (forumRes.data) setLastForumPost(forumRes.data as LastForumPost)
  }, [user, today])

  useEffect(() => { load() }, [load])

  // Show setup modal once when profile loads without cycle data
  useEffect(() => {
    if (!hasShownModal.current && profile !== null && !profile.last_period_start) {
      hasShownModal.current = true
      const t = setTimeout(() => setShowSetupModal(true), 800)
      return () => clearTimeout(t)
    }
  }, [profile])

  // Show phase toast once per load when phaseInfo is available
  const phaseInfo = profile?.last_period_start
    ? getCurrentPhaseInfo(profile.last_period_start, profile.avg_cycle_duration, profile.avg_bleeding_duration)
    : null

  useEffect(() => {
    if (!hasShownPhaseToast.current && phaseInfo) {
      hasShownPhaseToast.current = true
      const t = setTimeout(() => {
        setShowPhaseToast(true)
        phaseToastTimer.current = setTimeout(() => setShowPhaseToast(false), 5000)
      }, 600)
      return () => clearTimeout(t)
    }
  }, [phaseInfo])

  const dismissModal = () => {
    setShowSetupModal(false)
    setShowSetupToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setShowSetupToast(false), 5000)
  }

  const goToSettings = () => {
    setShowSetupModal(false)
    navigate('/settings')
  }

  const dismissToast = () => {
    setShowSetupToast(false)
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }

  const saveRecord = async (flow: string, syms: string[]) => {
    if (!user) return
    setSaving(true)
    await supabase.from('daily_logs').upsert(
      { user_id: user.id, date: today, flow_level: flow || null, symptoms: syms.length ? syms : null },
      { onConflict: 'user_id,date' }
    )
    setSaving(false)
  }

  const handleFlow = (levelId: string) => {
    const newFlow = flowLevel === levelId ? '' : levelId
    setFlowLevel(newFlow)
    saveRecord(newFlow, symptoms)
  }

  const handleSymptom = (s: string) => {
    const next = symptoms.includes(s) ? symptoms.filter((x) => x !== s) : [...symptoms, s]
    setSymptoms(next)
    saveRecord(flowLevel, next)
  }

  const flowIndex = FLOW_LEVELS.findIndex((f) => f.id === flowLevel)

  const firstSentence = (text: string | null) => {
    if (!text?.trim()) return 'Sin entrada...'
    const s = text.split(/[.!?]/)[0].trim()
    return s.length > 48 ? s.slice(0, 48) + '...' : s + '...'
  }

  const fmtDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="home-page">
      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Setup modal */}
      <AnimatePresence>
        {showSetupModal && (
          <>
            <motion.div
              className="setup-modal-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={dismissModal}
            />
            <motion.div
              className="setup-modal"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              <button className="setup-modal-close" onClick={dismissModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
              <div className="setup-modal-icon">🌸</div>
              <h3 className="setup-modal-title">¡Configura tu ciclo!</h3>
              <p className="setup-modal-text">
                Para ver predicciones de fases, tu período próximo y recomendaciones personalizadas, necesitamos algunos datos de tu ciclo.
              </p>
              <button className="setup-modal-primary" onClick={goToSettings}>
                Configurar ahora
              </button>
              <button className="setup-modal-secondary" onClick={dismissModal}>
                Más tarde
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Setup toast */}
      <AnimatePresence>
        {showSetupToast && (
          <motion.div
            className="setup-toast"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.22 }}
          >
            <span className="setup-toast-icon">⚙️</span>
            <button className="setup-toast-text" onClick={() => { dismissToast(); navigate('/settings') }}>
              Configura tu ciclo
            </button>
            <button className="setup-toast-close" onClick={dismissToast}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="diana-topbar">
        <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Menú">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button className="diana-topbar-logo" onClick={() => navigate('/home')}>
          <img src={logoHeader} alt="Diana" className="topbar-logo-img" />
        </button>
        <button className="icon-btn" onClick={() => navigate('/settings')} aria-label="Perfil">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Phase toast – fixed bottom-right */}
      <AnimatePresence>
        {showPhaseToast && phaseInfo && (
          <motion.div
            className="phase-toast"
            style={{ '--phase-color': PHASE_CONFIG[phaseInfo.phase].color, '--phase-text': PHASE_CONFIG[phaseInfo.phase].textColor } as React.CSSProperties}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            <div className="phase-toast-dot" />
            <div className="phase-toast-body">
              <span className="phase-toast-label">{PHASE_CONFIG[phaseInfo.phase].label}</span>
              <span className="phase-toast-sub">Día {phaseInfo.cycleDay} de tu ciclo</span>
            </div>
            <button className="phase-toast-cta" onClick={() => { setShowPhaseToast(false); navigate('/phases') }}>
              Ver
            </button>
            <button className="phase-toast-close" onClick={() => setShowPhaseToast(false)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="home-content">
        {/* Grid layout */}
        <div className="home-grid">
          <div className="home-grid-item home-grid-item-calendar">
            <MiniCalendar profile={profile} periodDates={periodDates} onClick={() => navigate('/calendar')} />
          </div>

          <div className="home-grid-item home-grid-item-diary">
            <div className="diana-section diary-checklist-section">
              <div className="diary-checklist-header">
                <h2 className="diary-checklist-title">DIARIO</h2>
                <button className="diana-section-action" onClick={() => navigate('/diary')}>
                  Escribir hoy →
                </button>
              </div>
              <div className="diary-checklist">
                {recentLogs.length === 0 ? (
                  <div className="diary-empty">Aún no hay entradas. ¡Empieza a escribir hoy!</div>
                ) : (
                  recentLogs.slice(0, 7).map((log) => (
                    <motion.button
                      key={log.date}
                      className="diary-checklist-item"
                      onClick={() => navigate(`/diary?date=${log.date}`)}
                      whileTap={{ scale: 0.985 }}
                    >
                      <div className="diary-checkbox" />
                      <div className="diary-checklist-line">
                        <span className="diary-checklist-date">{fmtDate(log.date)}</span>
                        <span className="diary-checklist-text">{firstSentence(log.journal_entry)}</span>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="home-grid-item home-grid-item-record">
            <div className="diana-section">
              <div className="diana-section-header">
                <h2 className="diana-section-title">Récord</h2>
                {saving && <span className="saving-dot">Guardando</span>}
              </div>
              <div className="record-body">
                <div className="record-label">Flujo</div>
                <div className="flow-drops-row">
                  {FLOW_LEVELS.map((f, idx) => (
                    <div key={f.id} className="flow-drop-item">
                      <FlowDrop filled={flowIndex >= 0 && idx <= flowIndex} onClick={() => handleFlow(f.id)} />
                      <span className="flow-drop-label">{f.label}</span>
                    </div>
                  ))}
                </div>
                <div className="record-label" style={{ marginTop: 20 }}>Síntomas</div>
                <div className="symptoms-grid">
                  {SYMPTOMS.map((s) => (
                    <SymptomPill key={s} label={s} active={symptoms.includes(s)} onToggle={() => handleSymptom(s)} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Forum card */}
          <div className="home-grid-item home-grid-item-recommendation">
            <div className="forum-card">
              <div className="forum-card-header">
                <span className="forum-card-eyebrow">Comunidad</span>
                <button className="diana-section-action" onClick={() => navigate('/forum')}>
                  Ver foro →
                </button>
              </div>
              <div className="forum-card-body">
                {lastForumPost ? (
                  <>
                    <p className="forum-card-title">{lastForumPost.title}</p>
                    <p className="forum-card-text">
                      {lastForumPost.content.length > 100
                        ? lastForumPost.content.slice(0, 100) + '...'
                        : lastForumPost.content}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="forum-card-title">Consejos de la comunidad</p>
                    <p className="forum-card-text">Sé la primera en compartir un consejo con la comunidad.</p>
                  </>
                )}
                <button className="forum-card-btn" onClick={() => navigate('/forum')}>
                  Ir al foro →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

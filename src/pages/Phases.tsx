import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { BottomNav } from '../components/layout/BottomNav'
import { HamburgerMenu } from '../components/layout/HamburgerMenu'
import { getCurrentPhaseInfo, PHASE_CONFIG } from '../utils/cycleUtils'
import type { CyclePhase } from '../utils/cycleUtils'

const PHASE_ORDER: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'luteal']

const PHASE_DETAILS: Record<CyclePhase, { emoji: string; symptoms: string[]; foods: string[] }> = {
  menstrual: {
    emoji: '🌑',
    symptoms: ['Calambres', 'Fatiga', 'Sensibilidad', 'Cambios de humor'],
    foods: ['Hierro (espinacas, legumbres)', 'Chocolate negro', 'Té de jengibre', 'Agua de coco'],
  },
  follicular: {
    emoji: '🌒',
    symptoms: ['Energía en aumento', 'Mejor humor', 'Mayor claridad mental', 'Piel luminosa'],
    foods: ['Proteínas magras', 'Semillas de calabaza', 'Vegetales fermentados', 'Granos enteros'],
  },
  ovulation: {
    emoji: '🌕',
    symptoms: ['Pico de energía', 'Alta fertilidad', 'Mayor libido', 'Sensación de bienestar'],
    foods: ['Frutas frescas', 'Vegetales crudos', 'Fibra', 'Antioxidantes (bayas)'],
  },
  luteal: {
    emoji: '🌖',
    symptoms: ['Retención de líquidos', 'Antojos', 'Irritabilidad posible', 'Sensibilidad mamaria'],
    foods: ['Magnesio (nueces, semillas)', 'Calcio', 'Vitamina B6', 'Reducir cafeína y azúcar'],
  },
}

export const Phases = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [selected, setSelected] = useState<CyclePhase | null>(null)
  const [currentPhase, setCurrentPhase] = useState<CyclePhase | null>(null)

  const loadPhase = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('avg_cycle_duration, avg_bleeding_duration, last_period_start')
      .eq('id', user.id)
      .maybeSingle()
    if (data?.last_period_start) {
      const info = getCurrentPhaseInfo(data.last_period_start, data.avg_cycle_duration, data.avg_bleeding_duration)
      if (info) setCurrentPhase(info.phase)
    }
  }, [user])

  useEffect(() => { loadPhase() }, [loadPhase])

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

      <div className="app-content" style={{ padding: '20px 16px' }}>
        <h1 className="phases-title">Fases del ciclo</h1>
        <p className="phases-sub">Toca una fase para aprender más sobre ella</p>

        <div className="phases-grid">
          {PHASE_ORDER.map((phase) => {
            const cfg = PHASE_CONFIG[phase]
            const detail = PHASE_DETAILS[phase]
            const isCurrent = phase === currentPhase
            return (
              <motion.button
                key={phase}
                className="phase-card"
                style={{ background: cfg.color, borderColor: isCurrent ? cfg.textColor : 'transparent' }}
                onClick={() => setSelected(phase)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="phase-card-emoji">{detail.emoji}</span>
                <span className="phase-card-label" style={{ color: cfg.textColor }}>{cfg.label}</span>
                {isCurrent && (
                  <span className="phase-card-current" style={{ background: cfg.textColor }}>
                    Ahora
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Cycle diagram */}
        <div className="cycle-diagram">
          <div className="cycle-ring">
            {PHASE_ORDER.map((phase, i) => {
              const cfg = PHASE_CONFIG[phase]
              return (
                <div
                  key={phase}
                  className="cycle-segment"
                  style={{
                    background: cfg.color,
                    transform: `rotate(${i * 90}deg)`,
                    opacity: currentPhase === phase ? 1 : 0.5,
                  }}
                />
              )
            })}
            <div className="cycle-center">
              <span>{currentPhase ? PHASE_DETAILS[currentPhase].emoji : '🌸'}</span>
            </div>
          </div>
          {currentPhase && (
            <p className="cycle-diagram-label" style={{ color: PHASE_CONFIG[currentPhase].textColor }}>
              {PHASE_CONFIG[currentPhase].label}
            </p>
          )}
        </div>
      </div>

      {/* Phase detail modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              className="phase-modal"
              style={{ background: PHASE_CONFIG[selected].color }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="phase-modal-handle" onClick={() => setSelected(null)} />
              <div className="phase-modal-content">
                <span className="phase-modal-emoji">{PHASE_DETAILS[selected].emoji}</span>
                <h2 className="phase-modal-title" style={{ color: PHASE_CONFIG[selected].textColor }}>
                  {PHASE_CONFIG[selected].label}
                </h2>
                <p className="phase-modal-desc">{PHASE_CONFIG[selected].description}</p>

                <div className="phase-modal-section">
                  <h3 style={{ color: PHASE_CONFIG[selected].textColor }}>Lo que puedes sentir</h3>
                  <ul className="phase-modal-list">
                    {PHASE_DETAILS[selected].symptoms.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="phase-modal-section">
                  <h3 style={{ color: PHASE_CONFIG[selected].textColor }}>Nutrición recomendada</h3>
                  <ul className="phase-modal-list">
                    {PHASE_DETAILS[selected].foods.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="phase-modal-section">
                  <h3 style={{ color: PHASE_CONFIG[selected].textColor }}>Consejos</h3>
                  <ul className="phase-modal-list">
                    {PHASE_CONFIG[selected].tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}

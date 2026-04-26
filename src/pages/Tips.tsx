import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { BottomNav } from '../components/layout/BottomNav'
import { HamburgerMenu } from '../components/layout/HamburgerMenu'
import { getCurrentPhaseInfo, PHASE_CONFIG } from '../utils/cycleUtils'
import type { CyclePhase } from '../utils/cycleUtils'

const GENERAL_TIPS = [
  {
    icon: '💧',
    color: '#E8F4FF',
    accent: '#5BA4CF',
    title: 'Hidratación',
    body: 'Beber al menos 8 vasos de agua al día puede reducir la hinchazón y los calambres menstruales.',
  },
  {
    icon: '🧘',
    color: '#EDF7ED',
    accent: '#5C9E6E',
    title: 'Movimiento consciente',
    body: 'El ejercicio suave como yoga o caminatas ayuda a equilibrar las hormonas en todas las fases del ciclo.',
  },
  {
    icon: '🌙',
    color: '#EEE8F8',
    accent: '#8B6DB8',
    title: 'Sueño reparador',
    body: 'Dormir 7–9 horas es fundamental para la salud hormonal y el manejo del dolor menstrual.',
  },
  {
    icon: '🥑',
    color: '#F0F7E8',
    accent: '#72A64A',
    title: 'Magnesio',
    body: 'El magnesio (presente en nueces, chocolate negro y aguacate) puede reducir los calambres y el SPM.',
  },
  {
    icon: '🌡️',
    color: '#FFF0E8',
    accent: '#E07845',
    title: 'Calor terapéutico',
    body: 'Una bolsa de calor en el abdomen puede aliviar los calambres tan efectivamente como el ibuprofeno.',
  },
]

export const Tips = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
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

  const phaseTips = currentPhase ? PHASE_CONFIG[currentPhase].tips : []
  const phaseColor = currentPhase ? PHASE_CONFIG[currentPhase].color : '#FFF3C4'
  const phaseTextColor = currentPhase ? PHASE_CONFIG[currentPhase].textColor : '#8B7000'
  const phaseLabel = currentPhase ? PHASE_CONFIG[currentPhase].label : ''

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

      <div className="app-content tips-content">

        {/* Phase card */}
        {currentPhase ? (
          <motion.div
            className="tips-phase-card"
            style={{ background: phaseColor }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="tips-phase-eyebrow" style={{ color: phaseTextColor }}>
              Tu fase actual
            </div>
            <h2 className="tips-phase-title" style={{ color: phaseTextColor }}>
              {phaseLabel}
            </h2>
            <ul className="tips-list">
              {phaseTips.map((tip) => (
                <li key={tip} className="tips-list-item" style={{ color: phaseTextColor }}>
                  <span className="tips-list-dot" style={{ background: phaseTextColor }} />
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        ) : (
          <div className="tips-phase-empty" onClick={() => navigate('/settings')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#FF8C42" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" stroke="#FF8C42" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="#FF8C42" />
            </svg>
            Configura tu ciclo para ver consejos personalizados →
          </div>
        )}

        {/* General tips */}
        <p className="tips-section-label">Bienestar general</p>

        <div className="tips-cards">
          {GENERAL_TIPS.map((tip, i) => (
            <motion.div
              key={tip.title}
              className="tip-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="tip-card-icon-wrap" style={{ background: tip.color }}>
                <span className="tip-card-icon">{tip.icon}</span>
              </div>
              <div className="tip-card-body-wrap">
                <h4 className="tip-card-title" style={{ color: tip.accent }}>{tip.title}</h4>
                <p className="tip-card-body">{tip.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      <BottomNav />
    </div>
  )
}

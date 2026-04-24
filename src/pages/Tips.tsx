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
  { title: 'Hidratación', body: 'Beber al menos 8 vasos de agua al día puede reducir la hinchazón y los calambres menstruales.' },
  { title: 'Movimiento consciente', body: 'El ejercicio suave como yoga o caminatas ayuda a equilibrar las hormonas en todas las fases del ciclo.' },
  { title: 'Sueño reparador', body: 'Dormir 7-9 horas es fundamental para la salud hormonal y el manejo del dolor menstrual.' },
  { title: 'Magnesio', body: 'El magnesio (presente en nueces, chocolate negro y aguacate) puede reducir los calambres y el SPM.' },
  { title: 'Calor terapéutico', body: 'Una bolsa de calor en el abdomen puede aliviar los calambres tan efectivamente como el ibuprofeno.' },
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

      <div className="app-content" style={{ padding: '16px' }}>
        {/* Phase-specific tips */}
        {currentPhase && (
          <motion.div
            className="tips-phase-card"
            style={{ background: phaseColor }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="tips-phase-title" style={{ color: phaseTextColor }}>
              Recomendado para tu fase {PHASE_CONFIG[currentPhase].label}
            </h2>
            <ul className="tips-list">
              {phaseTips.map((tip) => (
                <li key={tip} style={{ color: phaseTextColor }}>{tip}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* General tips */}
        <h3 className="tips-section-title">Bienestar general</h3>
        <div className="tips-cards">
          {GENERAL_TIPS.map((tip, i) => (
            <motion.div
              key={tip.title}
              className="tip-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <h4 className="tip-card-title">{tip.title}</h4>
              <p className="tip-card-body">{tip.body}</p>
            </motion.div>
          ))}
        </div>

        {/* AI question prompt */}
        <motion.button
          className="tips-ask-btn"
          onClick={() => navigate('/chat')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          ¿Tienes alguna pregunta?
          <span style={{ fontSize: 12, opacity: 0.7 }}>Pregúntale a Diana AI →</span>
        </motion.button>
      </div>

      <BottomNav />
    </div>
  )
}

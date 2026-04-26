import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PHASE_CONFIG, type CyclePhase } from '../utils/cycleUtils'

const PHASE_ORDER: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'luteal']

const PHASE_POSITIONS = {
  menstrual: { top: '0%', left: '50%' },
  follicular: { top: '50%', left: '100%' },
  ovulation: { top: '100%', left: '50%' },
  luteal: { top: '50%', left: '0%' },
}

const PHASE_DETAILS: Record<CyclePhase, {
  emoji: string;
  state: string;
  shortDesc: string;
  tips: string[];
}> = {
  menstrual: {
    emoji: '🌑',
    state: 'Energía baja, introspección',
    shortDesc: 'Descanso, reflexión y renovación',
    tips: ['Descansa y permite que tu cuerpo recupere energía', 'Practica meditación suave', 'Mantén una dieta rica en hierro', 'Evita actividades intensas'],
  },
  follicular: {
    emoji: '🌒',
    state: 'Energía en aumento',
    shortDesc: 'Momento para nuevos proyectos',
    tips: ['Inicia nuevos proyectos', 'Practica ejercicio moderado', 'Aumenta tu ingesta de proteínas', 'Planifica tus metas'],
  },
  ovulation: {
    emoji: '🌕',
    state: 'Pico de energía y confianza',
    shortDesc: 'Socializa y lidera con confianza',
    tips: ['Socializa y conecta con otros', 'Acepta nuevos desafíos', 'Practica ejercicio intenso', 'Expresa tu creatividad'],
  },
  luteal: {
    emoji: '🌖',
    state: 'Energía descendente, preparación',
    shortDesc: 'Organización y cierre de ciclos',
    tips: ['Organiza y planifica', 'Practica yoga suave', 'Reduce el consumo de cafeína', 'Prioriza el autocuidado'],
  },
}

const YOGA_POSES = [
  { phase: 'menstrual', pose: '🧘‍♀️' },
  { phase: 'follicular', pose: '🤸‍♀️' },
  { phase: 'ovulation', pose: '🏃‍♀️' },
  { phase: 'luteal', pose: '🧘' },
]

interface PhaseWheelProps {
  currentPhase?: CyclePhase | null
}

export const PhaseWheel = ({ currentPhase }: PhaseWheelProps) => {
  const [selectedPhase, setSelectedPhase] = useState<CyclePhase | null>(null)

  const handlePhaseClick = (phase: CyclePhase) => {
    setSelectedPhase(phase)
  }

  const handleOverlayClick = () => {
    setSelectedPhase(null)
  }

  return (
    <>
      <div className="phase-wheel-container">
        <div className="phase-wheel">
          {/* Orbit circle */}
          <div className="phase-wheel-orbit" />

          {/* Central sun */}
          <div className="phase-wheel-center">
            <div className="phase-wheel-sun">
              <div className="phase-wheel-core">
                {selectedPhase ? PHASE_DETAILS[selectedPhase].emoji : '☀️'}
              </div>
            </div>
          </div>

          {/* Phase positions - absolute positioning */}
          {PHASE_ORDER.map((phase, index) => {
            const position = PHASE_POSITIONS[phase]
            const cfg = PHASE_CONFIG[phase]
            const isSelected = selectedPhase === phase
            const isCurrent = currentPhase === phase
            const opacity = selectedPhase && !isSelected ? 0.3 : 1

            return (
              <motion.button
                key={phase}
                className={`phase-wheel-item ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
                style={{
                  top: position.top,
                  left: position.left,
                  '--phase-color': cfg.color,
                  opacity,
                } as React.CSSProperties}
                onClick={() => handlePhaseClick(phase)}
              >
                <div className="phase-wheel-icon">
                  {YOGA_POSES[index].pose}
                </div>
                <span className="phase-wheel-name">{cfg.label}</span>
                <span className="phase-wheel-desc">{PHASE_DETAILS[phase].shortDesc}</span>
                {isCurrent && <div className="phase-wheel-indicator" />}
              </motion.button>
            )
          })}

          {/* Moving illustration */}
          <AnimatePresence>
            {selectedPhase && (
              <motion.div
                className="phase-wheel-illustration"
                style={{
                  top: PHASE_POSITIONS[selectedPhase].top,
                  left: PHASE_POSITIONS[selectedPhase].left,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.3 }}
              >
                🧘‍♀️
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Phase detail card - bottom of screen - OUTSIDE container */}
      <AnimatePresence>
        {selectedPhase && (
          <>
            <motion.div
              className="phase-detail-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleOverlayClick}
              style={{
                display: 'block',
                position: 'fixed',
                inset: 0,
                height: '100vh',
                pointerEvents: 'auto'
              } as React.CSSProperties}
            />
            <motion.div
              className="phase-detail-card-bottom"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                '--phase-color': PHASE_CONFIG[selectedPhase].color
              } as React.CSSProperties}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ overflowY: 'auto', maxHeight: '100%', paddingBottom: '100px', scrollbarWidth: 'none' }}>
                <div className="phase-detail-header-bottom">
                  <h3 className="phase-detail-title-bottom">{PHASE_CONFIG[selectedPhase].label}</h3>
                  <span className="phase-detail-state-bottom">{PHASE_DETAILS[selectedPhase].state}</span>
                </div>
                <p className="phase-detail-desc-bottom">{PHASE_DETAILS[selectedPhase].shortDesc}</p>
                <div className="phase-detail-tips-bottom">
                  <h4>Consejos:</h4>
                  <ul>
                    {PHASE_DETAILS[selectedPhase].tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

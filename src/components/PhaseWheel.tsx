import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PHASE_CONFIG, type CyclePhase } from '../utils/cycleUtils'
import faseMenstrual from '../assets/images/Arriba.png'
import faseFolicular from '../assets/images/Derecha.png'
import faseOvulacion from '../assets/images/Abajo.png'
import faseLutea from '../assets/images/Izquierda.png'
import faseCentral from '../assets/images/LogoCentral.png'

const PHASE_ORDER: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'luteal']

const PHASE_POSITIONS = {
  menstrual:  { top: '-8%',  left: '50%'  },
  follicular: { top: '50%',  left: '108%' },
  ovulation:  { top: '108%', left: '50%'  },
  luteal:     { top: '50%',  left: '-8%'  },
}

const PHASE_IMAGES: Record<CyclePhase, string> = {
  menstrual:  faseMenstrual,
  follicular: faseFolicular,
  ovulation:  faseOvulacion,
  luteal:     faseLutea,
}

const PHASE_DETAILS: Record<CyclePhase, { state: string; shortDesc: string; tips: string[] }> = {
  menstrual: {
    state: 'Energía baja · Introspección',
    shortDesc: 'Tu cuerpo libera el revestimiento uterino. Es normal sentir calambres, fatiga y cambios de humor.',
    tips: ['Descansa y permite que tu cuerpo recupere energía', 'Practica meditación suave o respiración profunda', 'Mantén una dieta rica en hierro y magnesio', 'Evita actividades físicas de alta intensidad'],
  },
  follicular: {
    state: 'Energía en aumento',
    shortDesc: 'Los folículos ováricos maduran. Tu energía aumenta progresivamente y el estado de ánimo mejora.',
    tips: ['Inicia nuevos proyectos o retoma pendientes', 'Practica ejercicio moderado, tu cuerpo responde mejor', 'Aprovecha tu creatividad y capacidad de aprendizaje', 'Planifica tus metas del mes'],
  },
  ovulation: {
    state: 'Pico de energía y confianza',
    shortDesc: 'Se libera el óvulo. Es tu pico de fertilidad, energía y vitalidad. Te sientes más sociable.',
    tips: ['Socializa y conecta con las personas que te importan', 'Acepta nuevos desafíos con confianza', 'El ejercicio intenso da mejores resultados hoy', 'Expresa tu creatividad al máximo'],
  },
  luteal: {
    state: 'Energía descendente · Preparación',
    shortDesc: 'El cuerpo se prepara para el siguiente ciclo. Puedes experimentar síntomas premenstruales.',
    tips: ['Organiza y cierra tareas pendientes', 'Practica yoga suave o caminatas tranquilas', 'Reduce cafeína y azúcar para estabilizar el ánimo', 'Prioriza el descanso y el autocuidado'],
  },
}

const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
}

// x/y en framer-motion se combinan con scale sin romper el posicionamiento
const modalVariants = {
  hidden:  { scale: 0.72, opacity: 0,  x: '-50%', y: '-50%' },
  visible: { scale: 1,    opacity: 1,  x: '-50%', y: '-50%' },
  exit:    { scale: 0.72, opacity: 0,  x: '-50%', y: '-50%' },
}

const contentVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.065, delayChildren: 0.08 } },
}

const itemVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
}

interface PhaseWheelProps {
  currentPhase?: CyclePhase | null
}

export const PhaseWheel = ({ currentPhase }: PhaseWheelProps) => {
  const [selectedPhase, setSelectedPhase] = useState<CyclePhase | null>(null)

  const close = () => setSelectedPhase(null)

  return (
    <>
      <div className="phase-wheel-container">
        <div className="phase-wheel">
          <div className="phase-wheel-orbit" />

          {/* Central image */}
          <div className="phase-wheel-center">
            <div className="phase-wheel-sun">
              <div className="phase-wheel-core">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedPhase ?? 'central'}
                    src={selectedPhase ? PHASE_IMAGES[selectedPhase] : faseCentral}
                    alt={selectedPhase ?? 'Diana'}
                    className="phase-wheel-center-img"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Phase items — opacity via style inline, sin animate prop para no romper el transform */}
          {PHASE_ORDER.map((phase) => {
            const cfg = PHASE_CONFIG[phase]
            const isSelected = selectedPhase === phase
            const isCurrent = currentPhase === phase
            const opacity = selectedPhase && !isSelected ? 0.28 : 1

            return (
              <motion.button
                key={phase}
                className={['phase-wheel-item', isSelected ? 'selected' : '', isCurrent ? 'current' : ''].filter(Boolean).join(' ')}
                style={{
                  top: PHASE_POSITIONS[phase].top,
                  left: PHASE_POSITIONS[phase].left,
                  '--phase-color': cfg.color,
                  opacity,
                } as React.CSSProperties}
                onClick={() => setSelectedPhase(phase)}
                whileTap={{ scale: 0.93 }}
              >
                <div className="phase-wheel-icon">
                  <img src={PHASE_IMAGES[phase]} alt={cfg.label} className="phase-wheel-item-img" />
                </div>
                <span className="phase-wheel-name">{cfg.label}</span>
                {isCurrent && <div className="phase-wheel-indicator" />}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Modal centrado con animación pop */}
      <AnimatePresence>
        {selectedPhase && (
          <>
            {/* Overlay */}
            <motion.div
              className="pw-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.18 }}
              onClick={close}
            />

            {/* Modal — top/left 50% + x/y framer-motion para centrar sin conflicto */}
            <motion.div
              className="pw-modal"
              style={{
                '--pw-color': PHASE_CONFIG[selectedPhase].color,
                '--pw-text': PHASE_CONFIG[selectedPhase].textColor,
              } as React.CSSProperties}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.85 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header coloreado */}
              <div
                className="pw-modal-header"
                style={{ background: PHASE_CONFIG[selectedPhase].color }}
              >
                <div className="pw-modal-header-content">
                  <span className="pw-badge" style={{ color: PHASE_CONFIG[selectedPhase].textColor }}>
                    {PHASE_DETAILS[selectedPhase].state}
                  </span>
                  <h2 className="pw-title" style={{ color: PHASE_CONFIG[selectedPhase].textColor }}>
                    {PHASE_CONFIG[selectedPhase].label}
                  </h2>
                </div>
                <button className="pw-close" onClick={close} aria-label="Cerrar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Scrollable body */}
              <div className="pw-scroll">
                <motion.div
                  className="pw-content"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.p variants={itemVariants} className="pw-desc">
                    {PHASE_DETAILS[selectedPhase].shortDesc}
                  </motion.p>

                  <motion.div variants={itemVariants} className="pw-divider" />

                  <motion.div variants={itemVariants}>
                    <p className="pw-tips-label">Consejos para esta fase</p>
                    <div className="pw-tips">
                      {PHASE_DETAILS[selectedPhase].tips.map((tip, i) => (
                        <motion.div key={i} className="pw-tip" variants={itemVariants}>
                          <span
                            className="pw-tip-icon"
                            style={{
                              background: PHASE_CONFIG[selectedPhase].color,
                              color: PHASE_CONFIG[selectedPhase].textColor,
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <span className="pw-tip-text">{tip}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.button
                    variants={itemVariants}
                    className="pw-close-btn"
                    style={{
                      background: PHASE_CONFIG[selectedPhase].color,
                      color: PHASE_CONFIG[selectedPhase].textColor,
                    }}
                    onClick={close}
                    whileTap={{ scale: 0.97 }}
                  >
                    Cerrar
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

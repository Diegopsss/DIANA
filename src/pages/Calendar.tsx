import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const Calendar = () => {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentMonth] = useState('Enero')

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }
  
  const daysOfWeek = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1)

  const diaryTasks = [
    { id: 1, completed: false },
    { id: 2, completed: false },
    { id: 3, completed: false },
    { id: 4, completed: false },
  ]

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <motion.button
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          whileTap={{ scale: 0.95 }}
        >
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </motion.button>

        <motion.button
          className="profile-button"
          whileTap={{ scale: 0.95 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="#F5E6D3" strokeWidth="2"/>
            <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20" stroke="#F5E6D3" strokeWidth="2"/>
          </svg>
        </motion.button>

        <motion.div
          className="logo-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="logo-rays-small">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="ray-small"
                style={{
                  transform: `rotate(${i * 22.5}deg) translateY(-25px)`,
                }}
              />
            ))}
          </div>
          <div className="logo-moon-small">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <circle cx="15" cy="15" r="13" stroke="#F5E6D3" strokeWidth="1.5"/>
              <path d="M15 28C22.1797 28 28 22.1797 28 15C28 7.8203 22.1797 2 15 2" stroke="#F5E6D3" strokeWidth="1.5"/>
            </svg>
          </div>
          <div className="logo-text-small">diana</div>
        </motion.div>
      </div>

      <div className="calendar-content">
        <motion.div
          className="calendar-widget"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="calendar-widget-header">
            <span className="calendar-month">{currentMonth}</span>
            <h2 className="calendar-title">CALENDARIO</h2>
          </div>
          <div className="calendar-grid">
            <div className="calendar-days-header">
              {daysOfWeek.map((day, i) => (
                <div key={i} className="day-label">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {daysInMonth.map((day) => (
                <motion.button
                  key={day}
                  className="calendar-day"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {day}
                </motion.button>
              ))}
            </div>
            <div className="calendar-circles">
              {[...Array(5)].map((_, row) => (
                <div key={row} className="circle-row">
                  {[...Array(7)].map((_, col) => (
                    <div key={col} className="circle" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="widgets-row">
          <motion.div
            className="diary-widget"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="widget-title">DIARIO</h3>
            <div className="diary-tasks">
              {diaryTasks.map((task) => (
                <div key={task.id} className="diary-task">
                  <div className="task-checkbox" />
                  <div className="task-line" />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="record-widget"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="widget-title">RÉCORD</h3>
            <div className="record-section">
              <p className="record-label">Flujo</p>
              <div className="flow-indicators">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flow-drop" />
                ))}
              </div>
            </div>
            <div className="record-section">
              <p className="record-label">Síntomas</p>
              <div className="symptoms-icons">
                <button className="symptom-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="8" width="4" height="12" rx="1" stroke="#F5E6D3" strokeWidth="1.5"/>
                    <rect x="10" y="4" width="4" height="16" rx="1" stroke="#F5E6D3" strokeWidth="1.5"/>
                    <rect x="16" y="10" width="4" height="10" rx="1" stroke="#F5E6D3" strokeWidth="1.5"/>
                  </svg>
                </button>
                <button className="symptom-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="8" stroke="#F5E6D3" strokeWidth="1.5"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="#F5E6D3" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                <button className="symptom-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" stroke="#F5E6D3" strokeWidth="1.5"/>
                  </svg>
                </button>
                <button className="symptom-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="8" stroke="#F5E6D3" strokeWidth="1.5"/>
                    <path d="M12 8v4l3 3" stroke="#F5E6D3" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="recommendation-widget"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="recommendation-title">RECOMENDADO PARA TI</h3>
          <p className="recommendation-subtitle">Rutina de estiramientos</p>
          <p className="recommendation-text">
            Hacer estiramientos durante la menstruación ayuda a aliviar los malestares y mejorar la 
            circulación. Estos ejercicios suaves reducen los calores y la tensión en el abdomen y la espalda, 
            haciendo que el cuerpo se sienta más cómodo. Además, el movimiento suave también ayuda a 
            reducir el estrés.
          </p>
          <div className="recommendation-image">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <circle cx="35" cy="25" r="12" fill="#2D3748"/>
              <ellipse cx="35" cy="50" rx="8" ry="15" fill="#E8A87C"/>
              <rect x="27" y="50" width="16" height="30" rx="2" fill="#4A90E2"/>
              <rect x="20" y="80" width="10" height="25" rx="2" fill="#2D3748"/>
              <rect x="35" y="80" width="10" height="25" rx="2" fill="#2D3748"/>
              <path d="M43 55L70 40L75 50L48 65Z" fill="#E8A87C"/>
              <path d="M27 55L10 70L5 60L22 45Z" fill="#E8A87C"/>
            </svg>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="bottom-nav"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <button className="nav-item nav-item-active">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="8" height="8" rx="1" stroke="#4A5568" strokeWidth="2"/>
            <rect x="4" y="16" width="8" height="8" rx="1" stroke="#4A5568" strokeWidth="2"/>
            <rect x="16" y="4" width="8" height="8" rx="1" stroke="#4A5568" strokeWidth="2"/>
            <rect x="16" y="16" width="8" height="8" rx="1" stroke="#4A5568" strokeWidth="2"/>
          </svg>
        </button>
        <button className="nav-item">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="10" stroke="#4A5568" strokeWidth="2"/>
            <circle cx="14" cy="14" r="6" stroke="#4A5568" strokeWidth="2"/>
            <circle cx="14" cy="14" r="2" fill="#4A5568"/>
          </svg>
        </button>
        <button className="nav-item nav-item-center">
          <div className="plus-button">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <line x1="16" y1="8" x2="16" y2="24" stroke="#4A5568" strokeWidth="3" strokeLinecap="round"/>
              <line x1="8" y1="16" x2="24" y2="16" stroke="#4A5568" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
        </button>
        <button className="nav-item">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="20" height="20" rx="2" stroke="#4A5568" strokeWidth="2"/>
            <line x1="4" y1="10" x2="24" y2="10" stroke="#4A5568" strokeWidth="2"/>
            <line x1="10" y1="4" x2="10" y2="10" stroke="#4A5568" strokeWidth="2"/>
            <line x1="18" y1="4" x2="18" y2="10" stroke="#4A5568" strokeWidth="2"/>
          </svg>
        </button>
        <button className="nav-item">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="10" stroke="#4A5568" strokeWidth="2"/>
            <path d="M14 8V14L18 16" stroke="#4A5568" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </motion.div>

      {menuOpen && (
        <motion.div
          className="menu-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <motion.div
        className="side-menu"
        initial={{ x: '-100%' }}
        animate={{ x: menuOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="menu-content">
          <div className="menu-header">
            <h2 className="menu-title">Menú</h2>
            <div className="menu-stars">
              <span>✦</span>
              <span>✦</span>
            </div>
          </div>

          <div className="menu-items">
            <button className="menu-item">
              <div className="menu-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="#4A5568" strokeWidth="2"/>
                  <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20" stroke="#4A5568" strokeWidth="2"/>
                </svg>
              </div>
              <span>Perfil</span>
            </button>

            <div className="menu-divider"></div>

            <button className="menu-item">
              <div className="menu-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="#4A5568" strokeWidth="2"/>
                  <path d="M12 1v3m0 14v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M1 12h3m14 0h3M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12" stroke="#4A5568" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>Configuración</span>
            </button>

            <button className="menu-item">
              <div className="menu-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#4A5568" strokeWidth="2"/>
                  <path d="M14 2v6h6M16 13H8m8 4H8m2-8H8" stroke="#4A5568" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>Políticas</span>
            </button>

            <button className="menu-item">
              <div className="menu-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" stroke="#4A5568" strokeWidth="2"/>
                  <path d="M9 7h6M9 11h6M9 15h3" stroke="#4A5568" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>Diario</span>
            </button>

            <button className="menu-item">
              <div className="menu-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#4A5568" strokeWidth="2"/>
                </svg>
              </div>
              <span>Contacto</span>
            </button>

            <div className="menu-divider"></div>

            <button className="menu-item logout" onClick={handleSignOut}>
              <div className="menu-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

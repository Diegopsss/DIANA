import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const Login = () => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message || 'Error al iniciar sesión')
      } else {
        navigate('/calendar')
      }
    } catch (err) {
      setError('Error inesperado al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-header">
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
            <circle cx="12" cy="8" r="4" stroke="#4A5568" strokeWidth="2"/>
            <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20" stroke="#4A5568" strokeWidth="2"/>
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

      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <motion.div
          className="login-card"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <h1 className="login-title">Cuenta</h1>
          <div className="title-underline"></div>

          <form onSubmit={handleSubmit}>
            <motion.div
              className="input-group"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                required
              />
            </motion.div>

            <motion.div
              className="input-group"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
              />
            </motion.div>

            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="login-button"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </motion.button>
          </form>

          <motion.div
            className="login-links"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
            <a href="#" className="create-account">Crear una cuenta</a>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="bottom-nav"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <button className="nav-item">
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

            <button className="menu-item logout">
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

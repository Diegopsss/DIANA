import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const SignUp = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message || 'Error al crear la cuenta')
      } else {
        setSuccess(true)
        setTimeout(() => navigate('/login'), 2500)
      }
    } catch {
      setError('Error inesperado al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== password

  return (
    <div className="auth-page">
      <motion.div
        className="auth-brand"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-brand-content">
          <div className="auth-brand-logo" />
          <h1 className="auth-brand-name">Diana</h1>
          <p className="auth-brand-tagline">
            Tu compañera de salud y bienestar personal
          </p>
        </div>
      </motion.div>

      <motion.div
        className="auth-panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        <button className="auth-back-btn" onClick={() => navigate('/login')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </button>

        <h2 className="auth-title">Crear cuenta</h2>
        <p className="auth-subtitle">Únete a Diana hoy</p>

        {success ? (
          <motion.div
            className="auth-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="auth-success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="auth-success-title">¡Cuenta creada!</p>
            <p className="auth-success-text">Redirigiendo al inicio de sesión...</p>
          </motion.div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="password" className="auth-label">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="confirmPassword" className="auth-label">Confirmar contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`auth-input${passwordMismatch ? ' error' : ''}`}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <motion.div
                  className="auth-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <>
                    <svg className="auth-btn-spinner" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="10" />
                    </svg>
                    Creando cuenta...
                  </>
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="auth-link"
              >
                ¿Ya tienes cuenta?{' '}
                <span style={{ color: '#FF8C42', fontWeight: 600 }}>Inicia sesión</span>
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

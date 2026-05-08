import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export const ResetPassword = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when user arrives via the reset link.
    // We wait for that event before allowing the form to be used.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ResetPassword] auth event:', event, 'session:', session?.user?.email)
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
      }
    })

    // Also check if there's already an active session (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[ResetPassword] existing session:', session?.user?.email)
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

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
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        console.error('[ResetPassword] updateUser error:', error)
        setError(error.message || 'Error al actualizar la contraseña')
      } else {
        setSuccess(true)
        setTimeout(() => navigate('/home'), 2500)
      }
    } catch (err) {
      console.error('[ResetPassword] unexpected error:', err)
      setError('Error inesperado al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

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
        <h2 className="auth-title">Nueva contraseña</h2>
        <p className="auth-subtitle">Elige una contraseña segura</p>

        {success ? (
          <motion.div
            className="auth-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="auth-success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="auth-success-title">¡Contraseña actualizada!</p>
            <p className="auth-success-text">Redirigiendo...</p>
          </motion.div>
        ) : !sessionReady ? (
          <div className="loading-screen" style={{ minHeight: 'auto', padding: '32px 0' }}>
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Verificando enlace...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">Nueva contraseña</label>
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
                className="auth-input"
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
                  Actualizando...
                </>
              ) : (
                'Actualizar contraseña'
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) {
        setError(error.message || 'Error al enviar el correo de recuperación')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Error inesperado al enviar el correo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <motion.button
          className="menu-button"
          onClick={() => navigate('/login')}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#F5E6D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>

        <motion.div
          className="logo-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Espacio reservado para logo */}
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
          <h1 className="login-title">Recuperar contraseña</h1>
          <div className="title-underline"></div>

          {success ? (
            <motion.div
              className="success-message"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <svg className="success-icon" width="60" height="60" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#48BB78" strokeWidth="2"/>
                <path d="M8 12l2 2 4-4" stroke="#48BB78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>¡Correo enviado!</p>
              <p className="success-subtext">Revisa tu bandeja de entrada para restablecer tu contraseña.</p>
              <motion.button
                onClick={() => navigate('/login')}
                className="login-button"
                style={{ marginTop: '20px' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Volver al inicio de sesión
              </motion.button>
            </motion.div>
          ) : (
            <>
              <motion.p
                className="forgot-password-description"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </motion.p>

              <form onSubmit={handleSubmit}>
                <motion.div
                  className="input-group"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
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
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </motion.button>
              </form>

              <motion.div
                className="login-links"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="create-account">
                  Volver al inicio de sesión
                </a>
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

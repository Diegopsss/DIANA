import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import logoSplash from '../assets/images/logo-splash.png'

export const SplashScreen = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(user ? '/home' : '/login')
    }, 1500)

    return () => clearTimeout(timer)
  }, [navigate, user])

  return (
    <div className="splash-screen">
      <motion.div
        className="logo-container"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <motion.img
          src={logoSplash}
          alt="Diana"
          className="splash-logo-img"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          style={{ maxWidth: '220px', width: '100%', objectFit: 'contain' }}
        />
      </motion.div>
    </div>
  )
}

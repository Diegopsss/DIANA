import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const SplashScreen = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login')
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="splash-screen">
      <motion.div
        className="logo-container"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <motion.div
          className="rays"
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: 360, opacity: 1 }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity }}
        >
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="ray"
              style={{
                transform: `rotate(${i * 15}deg) translateY(-80px)`,
              }}
            />
          ))}
        </motion.div>

        <motion.div
          className="stars"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                transform: `rotate(${i * 45}deg) translateY(-100px)`,
              }}
            />
          ))}
        </motion.div>

        <motion.div
          className="moon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "backOut" }}
        >
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <path
              d="M30 55C43.8071 55 55 43.8071 55 30C55 16.1929 43.8071 5 30 5C16.1929 5 5 16.1929 5 30C5 43.8071 16.1929 55 30 55Z"
              stroke="#F5E6D3"
              strokeWidth="2"
            />
            <path
              d="M30 50C41.0457 50 50 41.0457 50 30C50 18.9543 41.0457 10 30 10"
              stroke="#F5E6D3"
              strokeWidth="2"
            />
          </svg>
        </motion.div>

        <motion.div
          className="brand-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <svg width="120" height="40" viewBox="0 0 120 40">
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="#F5E6D3"
              fontSize="28"
              fontFamily="cursive"
              fontStyle="italic"
            >
              diana
            </text>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}

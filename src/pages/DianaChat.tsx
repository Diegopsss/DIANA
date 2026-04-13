import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'

interface UserProfile {
  avg_cycle_duration: number
  last_period_start: string
}

interface DailyLog {
  symptoms: string[]
  flow_level: number
}

interface ChatContext {
  phase: string
  symptoms: string[]
  cycle_day: number
}

export const DianaChat = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Railway URL - Configura tu URL real aquí
  const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || 'https://your-railway-app.railway.app/api/chat'

  useEffect(() => {
    if (user) {
      fetchUserContext()
    }
  }, [user])

  const fetchUserContext = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('avg_cycle_duration, last_period_start')
        .eq('user_id', user?.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      } else {
        setProfile(profileData || {
          avg_cycle_duration: 28,
          last_period_start: new Date().toISOString()
        })
      }

      // Fetch today's daily log
      const today = new Date().toISOString().split('T')[0]
      const { data: logData, error: logError } = await supabase
        .from('daily_logs')
        .select('symptoms, flow_level')
        .eq('user_id', user?.id)
        .eq('date', today)
        .single()

      if (logError && logError.code !== 'PGRST116') {
        console.error('Error fetching daily log:', logError)
      } else {
        setDailyLog(logData || { symptoms: [], flow_level: 0 })
      }
    } catch (err) {
      console.error('Error fetching context:', err)
    }
  }

  const calculateCurrentPhase = (): string => {
    if (!profile) return 'Desconocida'
    
    const lastPeriod = new Date(profile.last_period_start)
    const cycleDuration = profile.avg_cycle_duration || 28
    
    const daysSinceLastPeriod = Math.floor(
      (new Date().getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    const cycleDay = ((daysSinceLastPeriod % cycleDuration) + cycleDuration) % cycleDuration
    
    if (cycleDay >= 0 && cycleDay <= 4) {
      return 'Menstruación'
    } else if (cycleDay >= 5 && cycleDay <= 13) {
      return 'Fase Folicular'
    } else if (cycleDay >= 14 && cycleDay <= 16) {
      return 'Ovulación'
    } else {
      return 'Fase Lútea'
    }
  }

  const getCycleDay = (): number => {
    if (!profile) return 0
    
    const lastPeriod = new Date(profile.last_period_start)
    const cycleDuration = profile.avg_cycle_duration || 28
    
    const daysSinceLastPeriod = Math.floor(
      (new Date().getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    return ((daysSinceLastPeriod % cycleDuration) + cycleDuration) % cycleDuration
  }

  const askDiana = async () => {
    if (!question.trim()) {
      setError('Por favor, escribe una pregunta')
      return
    }

    setIsLoading(true)
    setError('')
    setResponse('')

    try {
      const context: ChatContext = {
        phase: calculateCurrentPhase(),
        symptoms: dailyLog?.symptoms || [],
        cycle_day: getCycleDay()
      }

      const requestBody = {
        question: question.trim(),
        context: context,
        user_id: user?.id
      }

      console.log('Sending request to Diana AI:', requestBody)

      const apiResponse = await fetch(RAILWAY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!apiResponse.ok) {
        throw new Error(`Error del servidor: ${apiResponse.status}`)
      }

      const data = await apiResponse.json()
      
      if (data.response || data.answer || data.message) {
        setResponse(data.response || data.answer || data.message)
      } else {
        throw new Error('Respuesta inválida del servidor')
      }

    } catch (err) {
      console.error('Error asking Diana:', err)
      setError(
        'Lo siento, no pude conectarme con Diana en este momento. Por favor, intenta nuevamente en unos momentos. Si el problema persiste, verifica tu conexión a internet.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    askDiana()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      askDiana()
    }
  }

  return (
    <div className="diana-chat-page" style={{ backgroundColor: 'var(--diana-bg)' }}>
      {/* Header */}
      <header className="diana-chat-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--diana-border)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            className="menu-button"
            onClick={() => navigate('/calendar')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 140, 66, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="var(--diana-text)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="logo-placeholder" style={{
            width: '120px',
            height: '40px',
            background: 'transparent',
            border: '2px dashed var(--diana-border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--diana-text-light)',
            fontSize: '12px'
          }}>
            {/* Espacio para logo */}
          </div>
        </div>
        
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="phase-indicator" style={{ 
            backgroundColor: 'var(--diana-soft)', 
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--diana-text)',
            border: `1px solid var(--diana-border)`
          }}>
            Fase: {calculateCurrentPhase()}
          </div>
          <button className="profile-button" style={{
            background: 'transparent',
            border: '2px solid var(--diana-border)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--diana-orange)'
            e.currentTarget.style.backgroundColor = 'rgba(255, 140, 66, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--diana-border)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="var(--diana-text)" strokeWidth="2"/>
              <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20" stroke="var(--diana-text)" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="diana-chat-main" style={{
        flex: 1,
        padding: '40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}>
        <div className="diana-chat-container" style={{
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px'
        }}>
          {/* Search Bar */}
          <div className="search-section">
            <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="¿Tienes alguna pregunta? Consulta aquí"
                disabled={isLoading}
                className="search-input"
                style={{
                  width: '100%',
                  padding: '20px 60px 20px 24px',
                  fontSize: '16px',
                  border: `2px solid var(--diana-border)`,
                  borderRadius: '50px',
                  backgroundColor: 'white',
                  color: 'var(--diana-text)',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--diana-orange)'
                  e.target.style.boxShadow = '0 4px 12px rgba(255, 140, 66, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--diana-border)'
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
              />
              <motion.button
                type="submit"
                disabled={isLoading || !question.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: isLoading || !question.trim() ? 'var(--diana-border)' : 'var(--diana-orange)',
                  border: 'none',
                  cursor: isLoading || !question.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                {isLoading ? (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2"/>
                    <path d="m21 21-4.35-4.35" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </motion.button>
            </form>
          </div>

          {/* Response Box */}
          <AnimatePresence mode="wait">
            {(response || isLoading || error) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="diana-card response-box"
                style={{
                  backgroundColor: error ? '#EF4444' : 'var(--diana-orange)',
                  borderRadius: 'var(--radius-4xl)',
                  padding: '40px',
                  minHeight: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 10px 15px -3px rgba(255, 140, 66, 0.3), 0 4px 6px -2px rgba(255, 140, 66, 0.2)'
                }}
              >
                {isLoading ? (
                  <div className="loading-container" style={{ textAlign: 'center' }}>
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{
                        width: '60px',
                        height: '60px',
                        margin: '0 auto 20px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </motion.div>
                    <p style={{ 
                      color: 'white', 
                      fontSize: '18px', 
                      fontWeight: '500',
                      margin: 0
                    }}>
                      Diana está pensando...
                    </p>
                  </div>
                ) : error ? (
                  <div className="error-container" style={{ textAlign: 'center' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 20px' }}>
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                      <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p style={{ 
                      color: 'white', 
                      fontSize: '16px', 
                      lineHeight: '1.6',
                      margin: 0,
                      maxWidth: '600px'
                    }}>
                      {error}
                    </p>
                  </div>
                ) : (
                  <div className="response-container" style={{ width: '100%' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      marginBottom: '24px'
                    }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" strokeWidth="2"/>
                        <path d="M8 10h8M8 14h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <h3 style={{ 
                        color: 'white', 
                        fontSize: '20px', 
                        fontWeight: '600',
                        margin: 0
                      }}>
                        Respuesta de Diana
                      </h3>
                    </div>
                    <p style={{ 
                      color: 'var(--diana-cream)', 
                      fontSize: '16px', 
                      lineHeight: '1.8',
                      margin: 0,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {response}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Welcome Message */}
          {!response && !isLoading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="welcome-message diana-card"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 'var(--radius-4xl)',
                padding: '40px',
                textAlign: 'center',
                boxShadow: '0 10px 15px -3px rgba(139, 115, 85, 0.1), 0 4px 6px -2px rgba(139, 115, 85, 0.05)',
                border: '1px solid rgba(210, 180, 140, 0.3)'
              }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 20px' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="var(--diana-orange)" strokeWidth="2"/>
                <circle cx="9" cy="10" r="1" fill="var(--diana-orange)"/>
                <circle cx="15" cy="10" r="1" fill="var(--diana-orange)"/>
                <path d="M9 14s1.5 2 3 2 3-2 3-2" stroke="var(--diana-orange)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: 'var(--diana-text)',
                marginBottom: '16px'
              }}>
                ¡Hola! Soy Diana
              </h2>
              <p style={{ 
                fontSize: '16px', 
                lineHeight: '1.7', 
                color: 'var(--diana-text)',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Estoy aquí para responder tus preguntas sobre tu ciclo menstrual, síntomas y bienestar. 
                Actualmente estás en tu fase de <strong>{calculateCurrentPhase()}</strong>.
                {dailyLog && dailyLog.symptoms.length > 0 && (
                  <span> Veo que hoy has registrado: {dailyLog.symptoms.join(', ')}.</span>
                )}
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

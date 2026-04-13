import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { motion, AnimatePresence } from 'framer-motion'

interface UserProfile {
  avg_cycle_duration: number
  last_period_start: string
}

export const Calendar = () => {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [today] = useState(new Date().getDate())
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avg_cycle_duration, last_period_start')
        .eq('user_id', user?.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // Use default values if profile doesn't exist
        setProfile({
          avg_cycle_duration: 28,
          last_period_start: new Date().toISOString()
        })
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error:', err)
      setProfile({
        avg_cycle_duration: 28,
        last_period_start: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    setIsMenuOpen(false)
  }

  // Calculate menstrual cycle phases
  const calculatePhase = (day: number): string => {
    if (!profile) return 'default'
    
    const lastPeriod = new Date(profile.last_period_start)
    const cycleDuration = profile.avg_cycle_duration || 28
    
    // Calculate days since last period
    const currentDate = new Date(currentYear, currentMonth, day)
    const daysSinceLastPeriod = Math.floor(
      (currentDate.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // Normalize to current cycle
    const cycleDay = ((daysSinceLastPeriod % cycleDuration) + cycleDuration) % cycleDuration
    
    // Phase calculation based on medical guidelines
    if (cycleDay >= 0 && cycleDay <= 4) {
      // Menstruation phase (days 1-5)
      return 'menstruation'
    } else if (cycleDay >= 5 && cycleDay <= 13) {
      // Follicular phase (days 6-13)
      return 'follicular'
    } else if (cycleDay >= 14 && cycleDay <= 16) {
      // Ovulation phase (days 14-16)
      return 'ovulation'
    } else {
      // Luteal phase (days 17-28)
      return 'luteal'
    }
  }

  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case 'menstruation':
        return '#F87171' // Rosa
      case 'ovulation':
        return '#4ADE80' // Verde
      case 'follicular':
        return '#FBBF24' // Amarillo
      case 'luteal':
        return '#FDF6E3' // diana-soft
      default:
        return 'transparent'
    }
  }

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay()
  }

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDay(null)
  }

  const handleDayClick = (day: number) => {
    setSelectedDay(day)
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day empty" />
      )
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const phase = calculatePhase(day)
      const isToday = day === today && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear()
      const isSelected = day === selectedDay
      
      days.push(
        <button
          key={day}
          className={`calendar-day ${phase} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => handleDayClick(day)}
          style={{
            backgroundColor: getPhaseColor(phase),
            position: 'relative',
            border: isSelected ? '2px solid var(--diana-orange)' : '1px solid var(--diana-border)',
            borderRadius: '12px',
            color: phase === 'follicular' ? 'var(--diana-text)' : phase === 'luteal' ? 'var(--diana-text)' : 'white',
            fontWeight: isToday ? '700' : '500',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio: '1',
            minHeight: '48px'
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          {day}
          {isToday && (
            <div 
              className="today-circle"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '32px',
                height: '32px',
                border: '2px solid black',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 1
              }}
            />
          )}
        </button>
      )
    }

    return days
  }

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

  if (loading) {
    return (
      <div className="calendar-page" style={{ backgroundColor: 'var(--diana-bg)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'var(--diana-text)'
        }}>
          Cargando calendario...
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-page" style={{ 
      backgroundColor: 'var(--diana-bg)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header className="calendar-header" style={{
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
          <motion.button 
            className="menu-button"
            onClick={toggleMenu}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
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
            <motion.svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none"
              animate={{
                rotate: isMenuOpen ? 45 : 0,
                opacity: isMenuOpen ? 0.7 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <path d="M3 12h18M3 6h18M3 18h18" stroke="var(--diana-text)" strokeWidth="2" strokeLinecap="round"/>
            </motion.svg>
          </motion.button>
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
          <button 
            onClick={handleSignOut}
            className="logout-button"
            style={{
              background: 'var(--diana-orange)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '20px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E67A32'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--diana-orange)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="calendar-main" style={{
        flex: 1,
        padding: '40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}>
        <div className="calendar-container" style={{
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px'
        }}>
          {/* Calendar Widget */}
          <div className="diana-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-4xl)',
            padding: '40px',
            boxShadow: '0 10px 15px -3px rgba(139, 115, 85, 0.1), 0 4px 6px -2px rgba(139, 115, 85, 0.05)',
            border: '1px solid rgba(210, 180, 140, 0.3)'
          }}>
            {/* Calendar Header */}
            <div className="calendar-header-widget" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignContent: 'center',
              marginBottom: '30px',
              alignItems: 'center'
            }}>
              <button
                onClick={handlePreviousMonth}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  color: 'var(--diana-text)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 140, 66, 0.1)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <span className="calendar-month" style={{ 
                  fontSize: '16px', 
                  fontWeight: '500', 
                  color: 'var(--diana-text-light)',
                  display: 'block'
                }}>
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <h1 className="calendar-title" style={{ 
                  fontSize: '32px', 
                  fontWeight: '700', 
                  color: 'var(--diana-text)',
                  letterSpacing: '2px',
                  margin: '8px 0 0 0'
                }}>
                  CALENDARIO
                </h1>
              </div>
              
              <button
                onClick={handleNextMonth}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  color: 'var(--diana-text)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 140, 66, 0.1)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            {/* Calendar Grid */}
            <div className="calendar-grid" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {/* Day Labels */}
              <div className="days-header" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '10px'
              }}>
                {dayLabels.map((day, i) => (
                  <div key={i} className="day-label" style={{ 
                    textAlign: 'center', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--diana-text-light)',
                    padding: '10px 0'
                  }}>
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Days Grid */}
              <div className="days-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '10px'
              }}>
                {renderCalendarDays()}
              </div>
            </div>
          </div>

          {/* Phase Legend */}
          <div className="diana-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-4xl)',
            padding: '30px',
            boxShadow: '0 10px 15px -3px rgba(139, 115, 85, 0.1), 0 4px 6px -2px rgba(139, 115, 85, 0.05)',
            border: '1px solid rgba(210, 180, 140, 0.3)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--diana-text)',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Leyenda de Fases
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#F87171',
                  borderRadius: '6px',
                  border: '1px solid var(--diana-border)'
                }} />
                <span style={{ color: 'var(--diana-text)', fontSize: '14px' }}>Menstruación</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#FBBF24',
                  borderRadius: '6px',
                  border: '1px solid var(--diana-border)'
                }} />
                <span style={{ color: 'var(--diana-text)', fontSize: '14px' }}>Fase Folicular</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#4ADE80',
                  borderRadius: '6px',
                  border: '1px solid var(--diana-border)'
                }} />
                <span style={{ color: 'var(--diana-text)', fontSize: '14px' }}>Ovulación</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: 'var(--diana-soft)',
                  borderRadius: '6px',
                  border: '1px solid var(--diana-border)'
                }} />
                <span style={{ color: 'var(--diana-text)', fontSize: '14px' }}>Fase Lútea</span>
              </div>
            </div>
          </div>

          {/* Selected Day Info */}
          {selectedDay && (
            <div className="diana-card" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 'var(--radius-4xl)',
              padding: '30px',
              boxShadow: '0 10px 15px -3px rgba(139, 115, 85, 0.1), 0 4px 6px -2px rgba(139, 115, 85, 0.05)',
              border: '1px solid rgba(210, 180, 140, 0.3)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--diana-text)',
                marginBottom: '16px'
              }}>
                Día Seleccionado: {selectedDay} de {monthNames[currentMonth]}
              </h3>
              <p style={{
                color: 'var(--diana-text)',
                fontSize: '16px',
                lineHeight: '1.6',
                margin: 0
              }}>
                Fase actual: <span style={{
                  fontWeight: '600',
                  color: 'var(--diana-orange)'
                }}>
                  {calculatePhase(selectedDay) === 'menstruation' ? 'Menstruación' :
                   calculatePhase(selectedDay) === 'follicular' ? 'Fase Folicular' :
                   calculatePhase(selectedDay) === 'ovulation' ? 'Ovulación' :
                   calculatePhase(selectedDay) === 'luteal' ? 'Fase Lútea' : 'Desconocida'}
                </span>
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Menú lateral animado */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 40
              }}
            />
            
            {/* Menú lateral */}
            <motion.div
              className="side-menu"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '280px',
                height: '100vh',
                backgroundColor: 'var(--diana-cream)',
                boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px'
              }}
            >
              {/* Header del menú */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '40px',
                paddingBottom: '20px',
                borderBottom: `1px solid var(--diana-border)`
              }}>
                <h3 style={{ 
                  color: 'var(--diana-text)', 
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  Menú Diana
                </h3>
                <motion.button
                  onClick={toggleMenu}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="var(--diana-text)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </motion.button>
              </div>

              {/* Navegación */}
              <nav style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <motion.button
                    onClick={() => handleNavigation('/calendar')}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className="menu-item"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '12px',
                      color: 'var(--diana-text)',
                      fontSize: '16px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Calendario
                  </motion.button>

                  <motion.button
                    onClick={() => handleNavigation('/daily-record')}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className="menu-item"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '12px',
                      color: 'var(--diana-text)',
                      fontSize: '16px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 20v-6M6 20V10M18 20v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Registro Diario
                  </motion.button>

                  <motion.button
                    onClick={() => handleNavigation('/medical-registry')}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className="menu-item"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '12px',
                      color: 'var(--diana-text)',
                      fontSize: '16px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 11H3v2h6v-2zm0-4H3v2h6V7zm0 8H3v2h6v-2zm12-8h-6v2h6V7zm0 4h-6v2h6v-2zm0 4h-6v2h6v-2z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Registro Médico
                  </motion.button>

                  <motion.button
                    onClick={() => handleNavigation('/chat')}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className="menu-item"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '12px',
                      color: 'var(--diana-text)',
                      fontSize: '16px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                      <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="2"/>
                      <line x1="8" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Chat Diana
                  </motion.button>

                  <motion.button
                    onClick={() => handleNavigation('/profile')}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className="menu-item"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '12px',
                      color: 'var(--diana-text)',
                      fontSize: '16px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Perfil
                  </motion.button>
                </div>
              </nav>

              {/* Footer del menú */}
              <div style={{ 
                borderTop: `1px solid var(--diana-border)`, 
                paddingTop: '20px',
                marginTop: 'auto'
              }}>
                <motion.button
                  onClick={handleSignOut}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'var(--diana-orange)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.2s'
                  }}
                >
                  Cerrar sesión
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

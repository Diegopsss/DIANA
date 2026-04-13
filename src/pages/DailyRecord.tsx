import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'

interface DailyLog {
  id?: string
  user_id?: string
  date: string
  flow_level: number
  symptoms: string[]
  diary_entry: string
  created_at?: string
}

interface DiaryEntry {
  date: string
  entry: string
}

export const DailyRecord = () => {
  const { user } = useAuth()
  const [currentLog, setCurrentLog] = useState<DailyLog>({
    date: new Date().toISOString().split('T')[0],
    flow_level: 0,
    symptoms: [],
    diary_entry: ''
  })
  const [recentEntries, setRecentEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      fetchTodayLog()
      fetchRecentEntries()
    }
  }, [user])

  const fetchTodayLog = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', today)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching today log:', error)
        return
      }

      if (data) {
        setCurrentLog(data)
      } else {
        // Create new log for today
        setCurrentLog({
          date: today,
          flow_level: 0,
          symptoms: [],
          diary_entry: ''
        })
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentEntries = async () => {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data, error } = await supabase
        .from('daily_logs')
        .select('date, diary_entry')
        .eq('user_id', user?.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .not('diary_entry', 'is', null)
        .neq('diary_entry', '')
        .order('date', { ascending: false })
        .limit(7)

      if (error) {
        console.error('Error fetching recent entries:', error)
        return
      }

      const entries: DiaryEntry[] = (data || []).map(log => ({
        date: log.date,
        entry: getFirstSentence(log.diary_entry)
      }))

      setRecentEntries(entries)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const getFirstSentence = (text: string): string => {
    const sentences = text.split(/[.!?]+/)
    const firstSentence = sentences[0]?.trim() || ''
    return firstSentence.length > 80 ? firstSentence.substring(0, 80) + '...' : firstSentence
  }

  const saveToSupabase = async (updates: Partial<DailyLog>) => {
    if (!user || saving) return

    setSaving(true)
    try {
      const logData = {
        ...currentLog,
        ...updates,
        user_id: user.id
      }

      const { error } = await supabase
        .from('daily_logs')
        .upsert(logData, {
          onConflict: 'user_id,date'
        })

      if (error) {
        console.error('Error saving log:', error)
        return
      }

      setCurrentLog(prev => ({ ...prev, ...updates }))
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleFlowChange = (level: number) => {
    saveToSupabase({ flow_level: level })
  }

  const handleSymptomToggle = (symptom: string) => {
    const newSymptoms = currentLog.symptoms.includes(symptom)
      ? currentLog.symptoms.filter(s => s !== symptom)
      : [...currentLog.symptoms, symptom]
    
    saveToSupabase({ symptoms: newSymptoms })
  }

  const handleDiaryChange = (entry: string) => {
    setCurrentLog(prev => ({ ...prev, diary_entry: entry }))
  }

  const handleDiaryBlur = () => {
    saveToSupabase({ diary_entry: currentLog.diary_entry })
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const shakeVariants = {
    idle: { x: 0 },
    shake: {
      x: [0, -4, 4, -4, 4, 0],
      transition: { duration: 0.5 }
    }
  }

  if (loading) {
    return (
      <div className="daily-record-page" style={{ backgroundColor: 'var(--diana-bg)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'var(--diana-text)'
        }}>
          Cargando registro diario...
        </div>
      </div>
    )
  }

  return (
    <div className="daily-record-page" style={{ backgroundColor: 'var(--diana-bg)' }}>
      {/* Header */}
      <header className="daily-record-header" style={{
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
            onClick={() => window.history.back()}
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
      <main className="daily-record-main" style={{
        flex: 1,
        padding: '40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}>
        <div className="daily-record-container" style={{
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px'
        }}>
          {/* Sección Record - Flujo Menstrual */}
          <div className="diana-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-4xl)',
            padding: '40px',
            boxShadow: '0 10px 15px -3px rgba(139, 115, 85, 0.1), 0 4px 6px -2px rgba(139, 115, 85, 0.05)',
            border: '1px solid rgba(210, 180, 140, 0.3)'
          }}>
            <h2 className="section-title" style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: 'var(--diana-text)',
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              RÉCORD
            </h2>
            
            {/* Selección de Flujo */}
            <div className="flow-section" style={{ marginBottom: '40px' }}>
              <p className="section-label" style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: 'var(--diana-text-light)',
                marginBottom: '20px'
              }}>
                Flujo del día
              </p>
              <div className="flow-indicators" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '20px'
              }}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <motion.button
                    key={level}
                    className={`flow-drop ${currentLog.flow_level >= level ? 'active' : ''}`}
                    onClick={() => handleFlowChange(level)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: 'transparent',
                      border: '2px solid var(--diana-border)',
                      borderRadius: '50%',
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      color: currentLog.flow_level >= level ? 'white' : 'var(--diana-border)',
                      backgroundColor: currentLog.flow_level >= level ? 'var(--diana-orange)' : 'transparent',
                      borderColor: currentLog.flow_level >= level ? 'var(--diana-orange)' : 'var(--diana-border)'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
                      <circle cx="12" cy="9" r="2.5" fill="white" opacity="0.3"/>
                    </svg>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Síntomas */}
            <div className="symptoms-section">
              <p className="section-label" style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: 'var(--diana-text-light)',
                marginBottom: '20px'
              }}>
                Síntomas
              </p>
              <div className="symptoms-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px'
              }}>
                {['Mareo', 'Indigestión', 'Dolores corporales', 'Vómito'].map((symptom) => (
                  <motion.button
                    key={symptom}
                    className={`symptom-button ${currentLog.symptoms.includes(symptom) ? 'active' : ''}`}
                    onClick={() => handleSymptomToggle(symptom)}
                    variants={shakeVariants}
                    animate={currentLog.symptoms.includes(symptom) ? 'shake' : 'idle'}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: 'transparent',
                      border: currentLog.symptoms.includes(symptom) ? '2px solid var(--diana-orange)' : '1px solid var(--diana-border)',
                      padding: '16px',
                      borderRadius: '16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: currentLog.symptoms.includes(symptom) ? 'var(--diana-orange)' : 'var(--diana-text-light)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    {symptom}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Sección Diario */}
          <div className="diana-card diary-section" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-4xl)',
            padding: '40px',
            boxShadow: '0 10px 15px -3px rgba(139, 115, 85, 0.1), 0 4px 6px -2px rgba(139, 115, 85, 0.05)',
            border: '1px solid rgba(210, 180, 140, 0.3)'
          }}>
            <h2 className="section-title" style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: 'var(--diana-text)',
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              DIARIO
            </h2>
            
            {/* Resumen de últimos 7 días */}
            <div className="recent-entries" style={{ marginBottom: '30px' }}>
              <p className="recent-label" style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: 'var(--diana-text-light)',
                marginBottom: '20px'
              }}>
                Últimos 7 días
              </p>
              <div className="recent-list" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '200px',
                overflowY: 'auto',
                paddingRight: '10px'
              }}>
                <AnimatePresence>
                  {recentEntries.map((entry, index) => (
                    <motion.div
                      key={entry.date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="recent-entry"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '12px',
                        border: '1px solid var(--diana-border)'
                      }}
                    >
                      <span className="entry-date" style={{ 
                        color: 'var(--diana-orange)', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {formatDate(entry.date)}
                      </span>
                      <p className="entry-preview" style={{ 
                        color: 'var(--diana-text)', 
                        fontSize: '14px', 
                        lineHeight: '1.5',
                        margin: '0'
                      }}>
                        {entry.entry}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {recentEntries.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: 'var(--diana-text-light)',
                    fontStyle: 'italic'
                  }}>
                    No hay entradas recientes. Comienza a escribir tu diario hoy.
                  </div>
                )}
              </div>
            </div>

            {/* Textarea para diario */}
            <div className="diary-input-section">
              <p className="section-label" style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: 'var(--diana-text-light)',
                marginBottom: '16px'
              }}>
                ¿Cómo te sientes hoy?
              </p>
              <textarea
                className="diary-textarea"
                placeholder="Escribe tus pensamientos, sentimientos y síntomas del día..."
                value={currentLog.diary_entry}
                onChange={(e) => handleDiaryChange(e.target.value)}
                onBlur={handleDiaryBlur}
                style={{
                  backgroundColor: 'var(--diana-soft)',
                  color: 'var(--diana-text)',
                  border: `1px solid var(--diana-border)`,
                  borderRadius: '16px',
                  padding: '20px',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  minHeight: '150px',
                  resize: 'vertical',
                  width: '100%',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--diana-orange)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 140, 66, 0.1)'
                }}
              />
            </div>
          </div>

          {/* Recomendación */}
          <div className="diana-card recommendation-section" style={{
            background: 'linear-gradient(135deg, rgba(255, 140, 66, 0.1) 0%, rgba(245, 245, 220, 0.5) 100%)',
            borderRadius: 'var(--radius-4xl)',
            padding: '40px',
            border: '1px solid rgba(210, 180, 140, 0.3)',
            textAlign: 'center'
          }}>
            <h2 className="recommendation-title" style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: 'var(--diana-text)',
              marginBottom: '16px'
            }}>
              RECOMENDADO PARA TI
            </h2>
            <p className="recommendation-subtitle" style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--diana-orange)',
              marginBottom: '16px'
            }}>
              Rutina de estiramientos
            </p>
            <p className="recommendation-text" style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: 'var(--diana-text)',
              maxWidth: '70%',
              margin: '0 auto 24px'
            }}>
              Hacer estiramientos durante la menstruación ayuda a aliviar los malestares y mejorar la circulación. 
              Estos ejercicios suaves reducen los calores y la tensión en el abdomen y la espalda.
            </p>
            <motion.button
              className="view-recommendation-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'var(--diana-orange)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Ver recomendación
            </motion.button>
          </div>

          {/* Estado de guardado */}
          <AnimatePresence>
            {saving && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="saving-indicator"
                style={{
                  position: 'fixed',
                  bottom: '20px',
                  right: '20px',
                  backgroundColor: 'var(--diana-orange)',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  zIndex: 1000
                }}
              >
                Guardando...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

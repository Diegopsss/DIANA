import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'

interface MedicalHistory {
  id?: string
  user_id?: string
  // Paso 1: Datos Personales y Ginecológicos
  personal_data: {
    full_name: string
    age: string
    birth_date: string
    allergies: string
    blood_type: string
    vaginal_infections: string
    surgeries: string
  }
  // Paso 2: Historial Obstétrico y Síntomas
  obstetric_history: {
    pregnancies: string
    deliveries: string
    cesareans: string
    abortions: string
  }
  current_symptoms: {
    pelvic_pain: string
    abnormal_bleeding: string
    other_symptoms: string
  }
  // Paso 3: Historial Menstrual y Estudios
  menstrual_history: {
    menarche_age: string
    cycle_duration: string
    cycle_regularity: string
    last_pap_smear: string
    last_ultrasound: string
  }
  created_at?: string
}

export const MedicalRegistry = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  
  const [formData, setFormData] = useState<MedicalHistory>({
    personal_data: {
      full_name: '',
      age: '',
      birth_date: '',
      allergies: '',
      blood_type: '',
      vaginal_infections: '',
      surgeries: ''
    },
    obstetric_history: {
      pregnancies: '',
      deliveries: '',
      cesareans: '',
      abortions: ''
    },
    current_symptoms: {
      pelvic_pain: '',
      abnormal_bleeding: '',
      other_symptoms: ''
    },
    menstrual_history: {
      menarche_age: '',
      cycle_duration: '',
      cycle_regularity: '',
      last_pap_smear: '',
      last_ultrasound: ''
    }
  })

  useEffect(() => {
    if (user) {
      fetchMedicalHistory()
    }
  }, [user])

  const fetchMedicalHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching medical history:', error)
        return
      }

      if (data) {
        setFormData(data)
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleInputChange = (section: keyof MedicalHistory, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof Omit<MedicalHistory, 'id' | 'user_id' | 'created_at'>],
        [field]: value
      }
    }))
  }

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setSaving(true)
    try {
      const historyData = {
        ...formData,
        user_id: user.id
      }

      const { error } = await supabase
        .from('medical_history')
        .upsert(historyData, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error saving medical history:', error)
        setToastMessage('Error al guardar la información médica')
        setShowToast(true)
        return
      }

      setToastMessage('Información médica guardada exitosamente')
      setShowToast(true)
      
      // Navigate to calendar after successful save
      setTimeout(() => {
        navigate('/calendar')
      }, 2000)
      
    } catch (err) {
      console.error('Error:', err)
      setToastMessage('Error inesperado al guardar')
      setShowToast(true)
    } finally {
      setSaving(false)
    }
  }

  const handleSendPDF = () => {
    setToastMessage('Enviando información médica en PDF a tu correo registrado...')
    setShowToast(true)
    
    // Simulate PDF sending
    setTimeout(() => {
      setToastMessage('PDF enviado exitosamente a tu correo')
      setShowToast(true)
    }, 2000)
  }

  const stepVariants = {
    hidden: { opacity: 0, x: 300 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -300 }
  }

  const renderStep1 = () => (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="step-content"
    >
      <h2 className="step-title" style={{ color: 'var(--diana-text)' }}>
        Datos Personales y Ginecológicos
      </h2>
      
      <div className="form-section">
        <h3 className="section-subtitle" style={{ color: 'var(--diana-text-light)' }}>
          Información Personal
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Nombre Completo
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.personal_data.full_name}
              onChange={(e) => handleInputChange('personal_data', 'full_name', e.target.value)}
              placeholder="Ingresa tu nombre completo"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Edad
            </label>
            <input
              type="number"
              className="form-input"
              value={formData.personal_data.age}
              onChange={(e) => handleInputChange('personal_data', 'age', e.target.value)}
              placeholder="Años"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              className="form-input"
              value={formData.personal_data.birth_date}
              onChange={(e) => handleInputChange('personal_data', 'birth_date', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Tipo de Sangre
            </label>
            <select
              className="form-input"
              value={formData.personal_data.blood_type}
              onChange={(e) => handleInputChange('personal_data', 'blood_type', e.target.value)}
            >
              <option value="">Selecciona...</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-subtitle" style={{ color: 'var(--diana-text-light)' }}>
          Historial Médico
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Alergias
            </label>
            <textarea
              className="form-input"
              value={formData.personal_data.allergies}
              onChange={(e) => handleInputChange('personal_data', 'allergies', e.target.value)}
              placeholder="Describe tus alergias conocidas..."
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Infecciones Vaginales
            </label>
            <textarea
              className="form-input"
              value={formData.personal_data.vaginal_infections}
              onChange={(e) => handleInputChange('personal_data', 'vaginal_infections', e.target.value)}
              placeholder="Describe infecciones vaginales previas..."
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Cirugías
            </label>
            <textarea
              className="form-input"
              value={formData.personal_data.surgeries}
              onChange={(e) => handleInputChange('personal_data', 'surgeries', e.target.value)}
              placeholder="Describe cirugías previas..."
              rows={3}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderStep2 = () => (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="step-content"
    >
      <h2 className="step-title" style={{ color: 'var(--diana-text)' }}>
        Historial Obstétrico y Síntomas Actuales
      </h2>
      
      <div className="form-section">
        <h3 className="section-subtitle" style={{ color: 'var(--diana-text-light)' }}>
          Historial Obstétrico
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Número de Embarazos
            </label>
            <input
              type="number"
              className="form-input"
              value={formData.obstetric_history.pregnancies}
              onChange={(e) => handleInputChange('obstetric_history', 'pregnancies', e.target.value)}
              placeholder="Número total de embarazos"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Partos
            </label>
            <input
              type="number"
              className="form-input"
              value={formData.obstetric_history.deliveries}
              onChange={(e) => handleInputChange('obstetric_history', 'deliveries', e.target.value)}
              placeholder="Número de partos vaginales"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Cesáreas
            </label>
            <input
              type="number"
              className="form-input"
              value={formData.obstetric_history.cesareans}
              onChange={(e) => handleInputChange('obstetric_history', 'cesareans', e.target.value)}
              placeholder="Número de cesáreas"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Abortos
            </label>
            <input
              type="number"
              className="form-input"
              value={formData.obstetric_history.abortions}
              onChange={(e) => handleInputChange('obstetric_history', 'abortions', e.target.value)}
              placeholder="Número de abortos"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-subtitle" style={{ color: 'var(--diana-text-light)' }}>
          Síntomas Actuales
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Dolor Pélvico
            </label>
            <select
              className="form-input"
              value={formData.current_symptoms.pelvic_pain}
              onChange={(e) => handleInputChange('current_symptoms', 'pelvic_pain', e.target.value)}
            >
              <option value="">Selecciona...</option>
              <option value="none">Ninguno</option>
              <option value="mild">Leve</option>
              <option value="moderate">Moderado</option>
              <option value="severe">Severo</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Sangrado Fuera del Período
            </label>
            <select
              className="form-input"
              value={formData.current_symptoms.abnormal_bleeding}
              onChange={(e) => handleInputChange('current_symptoms', 'abnormal_bleeding', e.target.value)}
            >
              <option value="">Selecciona...</option>
              <option value="none">Ninguno</option>
              <option value="between_periods">Entre períodos</option>
              <option value="after_sex">Después del sexo</option>
              <option value="post_menopause">Post-menopausia</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Otros Síntomas
            </label>
            <textarea
              className="form-input"
              value={formData.current_symptoms.other_symptoms}
              onChange={(e) => handleInputChange('current_symptoms', 'other_symptoms', e.target.value)}
              placeholder="Describe otros síntomas que experimentes..."
              rows={4}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderStep3 = () => (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="step-content"
    >
      <h2 className="step-title" style={{ color: 'var(--diana-text)' }}>
        Historial Menstrual y Estudios
      </h2>
      
      <div className="form-section">
        <h3 className="section-subtitle" style={{ color: 'var(--diana-text-light)' }}>
          Historial Menstrual
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Edad de la Primera Regla (Menarquia)
            </label>
            <input
              type="number"
              className="form-input"
              value={formData.menstrual_history.menarche_age}
              onChange={(e) => handleInputChange('menstrual_history', 'menarche_age', e.target.value)}
              placeholder="Edad en años"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Duración del Ciclo (días)
            </label>
            <input
              type="number"
              className="form-input"
              value={formData.menstrual_history.cycle_duration}
              onChange={(e) => handleInputChange('menstrual_history', 'cycle_duration', e.target.value)}
              placeholder="Ej: 28"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Regularidad del Ciclo
            </label>
            <select
              className="form-input"
              value={formData.menstrual_history.cycle_regularity}
              onChange={(e) => handleInputChange('menstrual_history', 'cycle_regularity', e.target.value)}
            >
              <option value="">Selecciona...</option>
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
              <option value="variable">Variable</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-subtitle" style={{ color: 'var(--diana-text-light)' }}>
          Estudios Médicos Recientes
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Último Papanicolaou
            </label>
            <input
              type="date"
              className="form-input"
              value={formData.menstrual_history.last_pap_smear}
              onChange={(e) => handleInputChange('menstrual_history', 'last_pap_smear', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Última Ultrasonido
            </label>
            <input
              type="date"
              className="form-input"
              value={formData.menstrual_history.last_ultrasound}
              onChange={(e) => handleInputChange('menstrual_history', 'last_ultrasound', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Botones de acción del paso 3 */}
      <div className="form-actions" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '40px'
      }}>
        <motion.button
          onClick={handleSubmit}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={saving}
          className="save-button"
          style={{
            background: saving ? '#9CA3AF' : 'var(--diana-orange)',
            color: 'white',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '20px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.2s'
          }}
        >
          {saving ? (
            <div className="spinner" style={{
              width: '20px',
              height: '20px',
              border: '2px solid white',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2"/>
              <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" strokeWidth="2"/>
              <polyline points="7,3 7,8 15,8" stroke="currentColor" strokeWidth="2"/>
            </svg>
          )}
          {saving ? 'Guardando...' : 'Guardar Información'}
        </motion.button>

        <motion.button
          onClick={handleSendPDF}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="pdf-button"
          style={{
            background: 'var(--diana-text)',
            color: 'white',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '20px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.2s'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
            <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Enviar PDF
        </motion.button>
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="medical-registry-page" style={{ backgroundColor: 'var(--diana-bg)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'var(--diana-text)'
        }}>
          Cargando registro médico...
        </div>
      </div>
    )
  }

  return (
    <div className="medical-registry-page" style={{ backgroundColor: 'var(--diana-bg)' }}>
      <header className="medical-registry-header">
        <div className="header-left">
          <button className="menu-button" onClick={() => navigate('/calendar')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="var(--diana-text)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="logo-placeholder">
            {/* Espacio para logo */}
          </div>
        </div>
        
        <div className="header-right">
          <button className="profile-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="var(--diana-text)" strokeWidth="2"/>
              <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20" stroke="var(--diana-text)" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="medical-registry-main">
        <div className="medical-registry-container">
          {/* Progress Indicator */}
          <div className="progress-indicator">
            <div className="progress-dots">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`progress-dot ${currentStep >= step ? 'active' : ''}`}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: currentStep >= step ? 'var(--diana-orange)' : 'var(--diana-border)',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
            <div className="progress-label" style={{ color: 'var(--diana-text-light)' }}>
              Paso {currentStep} de 3
            </div>
          </div>

          {/* Form Content */}
          <div className="diana-card" style={{ borderRadius: 'var(--radius-4xl)' }}>
            <AnimatePresence mode="wait">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </AnimatePresence>
          </div>

          {/* Navigation Arrow */}
          <div className="navigation-arrow">
            {currentStep < 3 ? (
              <motion.button
                onClick={handleNextStep}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="arrow-button"
                style={{
                  position: 'fixed',
                  bottom: '40px',
                  right: '40px',
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#DC2626', // Rojo específico
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  zIndex: 10
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            ) : null}
          </div>

          {/* Previous Step Button (except on step 1) */}
          {currentStep > 1 && (
            <motion.button
              onClick={handlePreviousStep}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="prev-button"
              style={{
                position: 'fixed',
                bottom: '40px',
                left: '40px',
                backgroundColor: 'var(--diana-border)',
                color: 'var(--diana-text)',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              Anterior
            </motion.button>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="toast-notification"
            style={{
              position: 'fixed',
              bottom: '120px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--diana-text)',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              zIndex: 1000,
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

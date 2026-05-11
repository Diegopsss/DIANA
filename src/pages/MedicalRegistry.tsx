import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { DateInput } from '../components/DateInput'
import { downloadMedicalPDF } from '../utils/generateMedicalPDF'

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
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [isExisting, setIsExisting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showSaveBeforeLeave, setShowSaveBeforeLeave] = useState(false)
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
    if (user) fetchMedicalHistory()
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
        setIsExisting(true)
        setFormData({
          personal_data: {
            full_name: data.full_name || '',
            age: data.age?.toString() || '',
            birth_date: data.birth_date || '',
            allergies: data.allergies || '',
            blood_type: data.blood_type || '',
            vaginal_infections: data.vaginal_infections_detail || '',
            surgeries: data.surgeries_detail || '',
          },
          obstetric_history: {
            pregnancies: data.pregnancy_count?.toString() || '',
            deliveries: data.delivery_count?.toString() || '',
            cesareans: data.c_section_count?.toString() || '',
            abortions: data.abortion_loss_count?.toString() || '',
          },
          current_symptoms: {
            pelvic_pain: data.pelvic_pain || '',
            abnormal_bleeding: data.abnormal_bleeding || '',
            other_symptoms: data.other_symptoms || '',
          },
          menstrual_history: {
            menarche_age: data.menarche_age?.toString() || '',
            cycle_duration: data.cycle_duration?.toString() || '',
            cycle_regularity: data.cycle_regularity || '',
            last_pap_smear: data.last_pap_smear || '',
            last_ultrasound: data.last_ultrasound || '',
          },
        })
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
      const toInt = (v: string) => (v !== '' ? parseInt(v, 10) : null)

      const historyData = {
        user_id: user.id,
        // personal
        full_name:                  formData.personal_data.full_name || null,
        age:                        toInt(formData.personal_data.age),
        birth_date:                 formData.personal_data.birth_date || null,
        allergies:                  formData.personal_data.allergies || null,
        blood_type:                 formData.personal_data.blood_type || null,
        has_infections:             !!formData.personal_data.vaginal_infections,
        vaginal_infections_detail:  formData.personal_data.vaginal_infections || null,
        had_surgeries:              !!formData.personal_data.surgeries,
        surgeries_detail:           formData.personal_data.surgeries || null,
        // obstetric
        pregnancy_count:     toInt(formData.obstetric_history.pregnancies),
        delivery_count:      toInt(formData.obstetric_history.deliveries),
        c_section_count:     toInt(formData.obstetric_history.cesareans),
        abortion_loss_count: toInt(formData.obstetric_history.abortions),
        // symptoms
        pelvic_pain:       formData.current_symptoms.pelvic_pain || null,
        abnormal_bleeding: formData.current_symptoms.abnormal_bleeding || null,
        other_symptoms:    formData.current_symptoms.other_symptoms || null,
        // menstrual
        menarche_age:     toInt(formData.menstrual_history.menarche_age),
        cycle_duration:   toInt(formData.menstrual_history.cycle_duration),
        cycle_regularity: formData.menstrual_history.cycle_regularity || null,
        is_cycle_regular: formData.menstrual_history.cycle_regularity === 'regular',
        last_pap_smear:   formData.menstrual_history.last_pap_smear || null,
        last_ultrasound:  formData.menstrual_history.last_ultrasound || null,
        updated_at:       new Date().toISOString(),
      }

      const { error } = await supabase
        .from('medical_history')
        .upsert(historyData, { onConflict: 'user_id' })

      if (error) {
        console.error('Error saving medical history:', error)
        setToastMessage('Error al guardar la información médica')
        setShowToast(true)
        return
      }

      setIsExisting(true)
      setShowSuccessModal(true)

    } catch (err) {
      console.error('Error:', err)
      setToastMessage('Error inesperado al guardar')
      setShowToast(true)
    } finally {
      setSaving(false)
    }
  }

  const saveAndLeave = async () => {
    if (!user) { navigate('/settings'); return }
    setSaving(true)
    try {
      const toInt = (v: string) => (v !== '' ? parseInt(v, 10) : null)
      const historyData = {
        user_id: user.id,
        full_name:                  formData.personal_data.full_name || null,
        age:                        toInt(formData.personal_data.age),
        birth_date:                 formData.personal_data.birth_date || null,
        allergies:                  formData.personal_data.allergies || null,
        blood_type:                 formData.personal_data.blood_type || null,
        has_infections:             !!formData.personal_data.vaginal_infections,
        vaginal_infections_detail:  formData.personal_data.vaginal_infections || null,
        had_surgeries:              !!formData.personal_data.surgeries,
        surgeries_detail:           formData.personal_data.surgeries || null,
        pregnancy_count:     toInt(formData.obstetric_history.pregnancies),
        delivery_count:      toInt(formData.obstetric_history.deliveries),
        c_section_count:     toInt(formData.obstetric_history.cesareans),
        abortion_loss_count: toInt(formData.obstetric_history.abortions),
        pelvic_pain:       formData.current_symptoms.pelvic_pain || null,
        abnormal_bleeding: formData.current_symptoms.abnormal_bleeding || null,
        other_symptoms:    formData.current_symptoms.other_symptoms || null,
        menarche_age:     toInt(formData.menstrual_history.menarche_age),
        cycle_duration:   toInt(formData.menstrual_history.cycle_duration),
        cycle_regularity: formData.menstrual_history.cycle_regularity || null,
        is_cycle_regular: formData.menstrual_history.cycle_regularity === 'regular',
        last_pap_smear:   formData.menstrual_history.last_pap_smear || null,
        last_ultrasound:  formData.menstrual_history.last_ultrasound || null,
        updated_at:       new Date().toISOString(),
      }
      await supabase.from('medical_history').upsert(historyData, { onConflict: 'user_id' })
    } finally {
      setSaving(false)
      navigate('/settings')
    }
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
            <DateInput
              className="form-input"
              value={formData.personal_data.birth_date}
              onChange={(v) => handleInputChange('personal_data', 'birth_date', v)}
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
            <DateInput
              className="form-input"
              value={formData.menstrual_history.last_pap_smear}
              onChange={(v) => handleInputChange('menstrual_history', 'last_pap_smear', v)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--diana-text)' }}>
              Última Ultrasonido
            </label>
            <DateInput
              className="form-input"
              value={formData.menstrual_history.last_ultrasound}
              onChange={(v) => handleInputChange('menstrual_history', 'last_ultrasound', v)}
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
          {saving ? 'Guardando...' : isExisting ? 'Actualizar Información' : 'Guardar Información'}
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
        </div>
        
        <div className="header-right">
          <button className="profile-button" onClick={() => setShowLeaveModal(true)}>
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

      {/* Modal 1 — Confirmar salida */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(42,26,14,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: '24px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 24 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{
                background: '#FEFCF9', borderRadius: '28px',
                padding: '40px 36px 32px', maxWidth: '380px', width: '100%',
                textAlign: 'center', boxShadow: '0 24px 60px rgba(42,26,14,0.18)',
              }}
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 16 }}
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FBB96E, #FF8C42)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 8px 20px rgba(255,140,66,0.3)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v4M12 17h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  fontFamily: "Georgia,'Times New Roman',serif",
                  fontSize: '22px', fontWeight: 400, color: '#2A1A0E',
                  margin: '0 0 10px', letterSpacing: '-0.3px',
                }}
              >
                ¿Seguro que quieres salir?
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.27 }}
                style={{ fontSize: '14px', color: '#9B8B72', margin: '0 0 28px', lineHeight: 1.6 }}
              >
                Estás editando tu historial médico. Si sales sin guardar podrías perder los cambios.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.33 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <button
                  onClick={() => { setShowLeaveModal(false); setShowSaveBeforeLeave(true) }}
                  style={{
                    width: '100%', padding: '13px',
                    background: 'var(--diana-orange)', border: 'none',
                    borderRadius: '14px', fontSize: '15px', fontWeight: 600,
                    color: 'white', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Sí, salir
                </button>
                <button
                  onClick={() => setShowLeaveModal(false)}
                  style={{
                    width: '100%', padding: '13px',
                    background: 'transparent', border: '1.5px solid #E4D8C8',
                    borderRadius: '14px', fontSize: '15px', fontWeight: 600,
                    color: '#5D4E37', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Cancelar
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 2 — ¿Guardar antes de salir? */}
      <AnimatePresence>
        {showSaveBeforeLeave && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(42,26,14,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: '24px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 24 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{
                background: '#FEFCF9', borderRadius: '28px',
                padding: '40px 36px 32px', maxWidth: '380px', width: '100%',
                textAlign: 'center', boxShadow: '0 24px 60px rgba(42,26,14,0.18)',
              }}
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 16 }}
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #B0A898, #9BAD98)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 8px 20px rgba(155,173,152,0.35)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="white" strokeWidth="2"/>
                  <polyline points="17,21 17,13 7,13 7,21" stroke="white" strokeWidth="2"/>
                  <polyline points="7,3 7,8 15,8" stroke="white" strokeWidth="2"/>
                </svg>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  fontFamily: "Georgia,'Times New Roman',serif",
                  fontSize: '22px', fontWeight: 400, color: '#2A1A0E',
                  margin: '0 0 10px', letterSpacing: '-0.3px',
                }}
              >
                ¿Guardar antes de salir?
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.27 }}
                style={{ fontSize: '14px', color: '#9B8B72', margin: '0 0 28px', lineHeight: 1.6 }}
              >
                ¿Quieres guardar los cambios en tu historial médico antes de ir al perfil?
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.33 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <button
                  onClick={() => { setShowSaveBeforeLeave(false); saveAndLeave() }}
                  disabled={saving}
                  style={{
                    width: '100%', padding: '13px',
                    background: saving ? '#9CA3AF' : 'var(--diana-orange)',
                    border: 'none', borderRadius: '14px',
                    fontSize: '15px', fontWeight: 600,
                    color: 'white', cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', fontFamily: 'inherit',
                  }}
                >
                  {saving ? (
                    <>
                      <div style={{
                        width: '16px', height: '16px',
                        border: '2px solid white', borderTop: '2px solid transparent',
                        borderRadius: '50%', animation: 'spin 0.75s linear infinite',
                      }} />
                      Guardando...
                    </>
                  ) : 'Sí, guardar y salir'}
                </button>
                <button
                  onClick={() => { setShowSaveBeforeLeave(false); navigate('/settings') }}
                  style={{
                    width: '100%', padding: '13px',
                    background: 'transparent', border: '1.5px solid #E4D8C8',
                    borderRadius: '14px', fontSize: '15px', fontWeight: 600,
                    color: '#5D4E37', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  No, salir sin guardar
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(42, 26, 14, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '24px',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowSuccessModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 24 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{
                background: '#FEFCF9',
                borderRadius: '28px',
                padding: '44px 40px 36px',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 24px 60px rgba(42, 26, 14, 0.18)',
              }}
            >
              {/* Checkmark circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 16 }}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 8px 24px rgba(34, 197, 94, 0.35)',
                }}
              >
                <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
                  <motion.path
                    d="M14 27l9 9 16-18"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3, duration: 0.45, ease: 'easeOut' }}
                  />
                </svg>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: '24px',
                  fontWeight: 400,
                  color: '#2A1A0E',
                  margin: '0 0 10px',
                  letterSpacing: '-0.3px',
                }}
              >
                {isExisting ? '¡Información actualizada!' : '¡Información guardada!'}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                style={{ fontSize: '14px', color: '#9B8B72', margin: '0 0 32px', lineHeight: 1.6 }}
              >
                Tu historial médico está seguro. Puedes descargarlo en PDF como respaldo.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <button
                  onClick={async () => {
                    setDownloadingPDF(true)
                    try { await downloadMedicalPDF(formData) }
                    finally { setDownloadingPDF(false) }
                  }}
                  disabled={downloadingPDF}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: downloadingPDF ? '#9CA3AF' : 'var(--diana-orange)',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'white',
                    cursor: downloadingPDF ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  {downloadingPDF ? (
                    <>
                      <div style={{
                        width: '16px', height: '16px',
                        border: '2px solid white', borderTop: '2px solid transparent',
                        borderRadius: '50%', animation: 'spin 0.75s linear infinite', flexShrink: 0,
                      }} />
                      Generando PDF...
                    </>
                  ) : (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                        <path d="M12 15V3M12 15l-4-4M12 15l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Descargar PDF
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigate('/home')}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'transparent',
                    border: '1.5px solid #E4D8C8',
                    borderRadius: '14px',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#5D4E37',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  Regresar al inicio
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

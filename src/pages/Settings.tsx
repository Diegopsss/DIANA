import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'

interface ProfileForm {
  full_name: string
  birth_date: string
  weight: string
  weight_unit: string
  height: string
  height_unit: string
  avg_cycle_duration: string
  avg_bleeding_duration: string
  last_period_start: string
}

const DEFAULT: ProfileForm = {
  full_name: '',
  birth_date: '',
  weight: '',
  weight_unit: 'kg',
  height: '',
  height_unit: 'cm',
  avg_cycle_duration: '28',
  avg_bleeding_duration: '5',
  last_period_start: '',
}

const PersonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const WeightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 3a3 3 0 100 6 3 3 0 000-6z" stroke="currentColor" strokeWidth="2" />
    <path d="M6.5 9H4a1 1 0 00-.98.8L2 19h20l-1.02-9.2A1 1 0 0019.98 9H17.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
)

const HeightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 3v18M8 6l4-3 4 3M8 18l4 3 4-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CycleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const DropIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 3C12 3 5 10.5 5 15a7 7 0 0014 0c0-4.5-7-12-7-12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
)

const LastPeriodIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M3 9h18M8 2v4M16 2v4M8 14h2M11 14h2M8 17h2M11 17h2M14 14h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const Stepper = ({
  value,
  onChange,
  min,
  max,
}: {
  value: string
  onChange: (v: string) => void
  min: number
  max: number
}) => {
  const num = parseInt(value) || 0
  return (
    <div className="stepper">
      <button
        className="stepper-btn"
        onClick={() => onChange(String(Math.max(min, num - 1)))}
        disabled={num <= min}
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
      <span className="stepper-value">{value}</span>
      <button
        className="stepper-btn"
        onClick={() => onChange(String(Math.min(max, num + 1)))}
        disabled={num >= max}
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

export const Settings = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState<ProfileForm>(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const initials = form.full_name
    ? form.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            full_name: data.full_name || '',
            birth_date: data.birth_date || '',
            weight: data.weight ? String(data.weight) : '',
            weight_unit: data.weight_unit || 'kg',
            height: data.height ? String(data.height) : '',
            height_unit: data.height_unit || 'cm',
            avg_cycle_duration: data.avg_cycle_duration ? String(data.avg_cycle_duration) : '28',
            avg_bleeding_duration: data.avg_bleeding_duration ? String(data.avg_bleeding_duration) : '5',
            last_period_start: data.last_period_start || '',
          })
        }
      })
  }, [user])

  const set = (key: keyof ProfileForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.full_name || null,
      birth_date: form.birth_date || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      weight_unit: form.weight_unit,
      height: form.height ? parseFloat(form.height) : null,
      height_unit: form.height_unit,
      avg_cycle_duration: parseInt(form.avg_cycle_duration) || 28,
      avg_bleeding_duration: parseInt(form.avg_bleeding_duration) || 5,
      last_period_start: form.last_period_start || null,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="settings-page">
      {/* Top bar */}
      <div className="diana-topbar">
        <button className="icon-btn" onClick={() => navigate('/home')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="diana-topbar-logo" style={{ cursor: 'default' }}>Configuración</span>
        <div style={{ width: 40 }} />
      </div>

      <div className="settings-scroll">
        {/* Profile banner */}
        <div className="settings-profile-banner">
          <div className="settings-avatar">{initials}</div>
          <div className="settings-profile-info">
            <p className="settings-profile-name">
              {form.full_name || 'Tu perfil'}
            </p>
            <p className="settings-profile-email">{user?.email}</p>
          </div>
        </div>

        <p className="settings-intro">
          Estos datos se usan para calcular tu fase del ciclo y darte recomendaciones precisas.
        </p>

        {/* Personal info */}
        <div className="settings-section-label">Información personal</div>
        <div className="settings-card">
          <Field icon={<PersonIcon />} label="Nombre">
            <input
              className="settings-input"
              placeholder="Tu nombre completo"
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
            />
          </Field>

          <Field icon={<CalendarIcon />} label="Fecha de nacimiento">
            <input
              className="settings-input"
              type="date"
              value={form.birth_date}
              onChange={(e) => set('birth_date', e.target.value)}
            />
          </Field>

          <Field icon={<WeightIcon />} label="Peso">
            <div className="settings-input-row">
              <input
                className="settings-input"
                type="number"
                placeholder="0"
                value={form.weight}
                onChange={(e) => set('weight', e.target.value)}
                style={{ flex: 1 }}
              />
              <div className="unit-toggle">
                {['kg', 'lbs'].map((u) => (
                  <button
                    key={u}
                    className={`unit-btn${form.weight_unit === u ? ' active' : ''}`}
                    onClick={() => set('weight_unit', u)}
                    type="button"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </Field>

          <Field icon={<HeightIcon />} label="Altura" last>
            <div className="settings-input-row">
              <input
                className="settings-input"
                type="number"
                placeholder="0"
                value={form.height}
                onChange={(e) => set('height', e.target.value)}
                style={{ flex: 1 }}
              />
              <div className="unit-toggle">
                {['cm', 'ft'].map((u) => (
                  <button
                    key={u}
                    className={`unit-btn${form.height_unit === u ? ' active' : ''}`}
                    onClick={() => set('height_unit', u)}
                    type="button"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </Field>
        </div>

        {/* Cycle */}
        <div className="settings-section-label">Ciclo menstrual</div>
        <div className="settings-card">
          <Field icon={<CycleIcon />} label="Duración del ciclo">
            <div className="settings-stepper-row">
              <Stepper
                value={form.avg_cycle_duration}
                onChange={(v) => set('avg_cycle_duration', v)}
                min={21}
                max={45}
              />
              <span className="settings-unit-hint">días · promedio 28</span>
            </div>
          </Field>

          <Field icon={<DropIcon />} label="Duración del sangrado">
            <div className="settings-stepper-row">
              <Stepper
                value={form.avg_bleeding_duration}
                onChange={(v) => set('avg_bleeding_duration', v)}
                min={2}
                max={10}
              />
              <span className="settings-unit-hint">días · promedio 5</span>
            </div>
          </Field>

          <Field icon={<LastPeriodIcon />} label="Inicio de tu último periodo" last>
            <input
              className="settings-input"
              type="date"
              value={form.last_period_start}
              onChange={(e) => set('last_period_start', e.target.value)}
            />
          </Field>
        </div>

        <div style={{ height: 100 }} />
      </div>

      {/* Sticky save bar */}
      <div className="settings-save-bar">
        <motion.button
          className="settings-save-btn"
          onClick={handleSave}
          disabled={saving}
          whileTap={{ scale: 0.97 }}
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="save-btn-inner"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Guardado
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="save-btn-inner"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}

const Field = ({
  icon,
  label,
  children,
  last = false,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  last?: boolean
}) => (
  <div className={`settings-field${last ? ' last' : ''}`}>
    <div className="settings-field-header">
      <span className="settings-field-icon">{icon}</span>
      <label className="settings-label">{label}</label>
    </div>
    {children}
  </div>
)

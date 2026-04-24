import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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

export const Settings = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState<ProfileForm>(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
    setTimeout(() => setSaved(false), 2200)
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

      <div className="settings-content">
        <p className="settings-intro">
          Estos datos se usan para calcular tu fase del ciclo y darte recomendaciones precisas.
        </p>

        <div className="settings-group">
          <h3 className="settings-group-title">Información personal</h3>

          <Field label="Nombre">
            <input
              className="settings-input"
              placeholder="Tu nombre"
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
            />
          </Field>

          <Field label="Fecha de nacimiento">
            <input
              className="settings-input"
              type="date"
              value={form.birth_date}
              onChange={(e) => set('birth_date', e.target.value)}
            />
          </Field>

          <Field label="Peso">
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
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </Field>

          <Field label="Altura">
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
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </Field>
        </div>

        <div className="settings-group">
          <h3 className="settings-group-title">Ciclo menstrual</h3>

          <Field label="Duración promedio del ciclo (días)">
            <input
              className="settings-input"
              type="number"
              min="21"
              max="45"
              value={form.avg_cycle_duration}
              onChange={(e) => set('avg_cycle_duration', e.target.value)}
            />
          </Field>

          <Field label="Duración promedio del sangrado (días)">
            <input
              className="settings-input"
              type="number"
              min="2"
              max="10"
              value={form.avg_bleeding_duration}
              onChange={(e) => set('avg_bleeding_duration', e.target.value)}
            />
          </Field>

          <Field label="Inicio de tu último periodo">
            <input
              className="settings-input"
              type="date"
              value={form.last_period_start}
              onChange={(e) => set('last_period_start', e.target.value)}
            />
          </Field>
        </div>

        <motion.button
          className="settings-save-btn"
          onClick={handleSave}
          disabled={saving}
          whileTap={{ scale: 0.97 }}
        >
          {saving ? 'Guardando...' : saved ? '¡Guardado ✓' : 'Guardar cambios'}
        </motion.button>
      </div>
    </div>
  )
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="settings-field">
    <label className="settings-label">{label}</label>
    {children}
  </div>
)

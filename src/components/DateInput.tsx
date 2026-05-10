import { useState, useEffect, useRef } from 'react'

interface DateInputProps {
  value: string // yyyy-mm-dd or ''
  onChange: (value: string) => void
  className?: string
}

export const DateInput = ({ value, onChange, className = '' }: DateInputProps) => {
  const parts = value ? value.split('-') : ['', '', '']
  const [day, setDay] = useState(parts[2] || '')
  const [month, setMonth] = useState(parts[1] || '')
  const [year, setYear] = useState(parts[0] || '')

  const monthRef = useRef<HTMLInputElement>(null)
  const yearRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const p = value ? value.split('-') : ['', '', '']
    setDay(p[2] || '')
    setMonth(p[1] || '')
    setYear(p[0] || '')
  }, [value])

  const emit = (d: string, m: string, y: string) => {
    if (d && m && y.length === 4) {
      onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    } else if (!d && !m && !y) {
      onChange('')
    }
  }

  return (
    <div className={`date-input-group ${className}`}>
      <input
        className="date-part"
        type="text"
        inputMode="numeric"
        placeholder="DD"
        maxLength={2}
        value={day}
        onChange={e => {
          const v = e.target.value.replace(/\D/g, '')
          setDay(v)
          if (v.length === 2) monthRef.current?.focus()
          emit(v, month, year)
        }}
      />
      <span className="date-sep">/</span>
      <input
        ref={monthRef}
        className="date-part"
        type="text"
        inputMode="numeric"
        placeholder="MM"
        maxLength={2}
        value={month}
        onChange={e => {
          const v = e.target.value.replace(/\D/g, '')
          setMonth(v)
          if (v.length === 2) yearRef.current?.focus()
          emit(day, v, year)
        }}
      />
      <span className="date-sep">/</span>
      <input
        ref={yearRef}
        className="date-part date-year"
        type="text"
        inputMode="numeric"
        placeholder="AAAA"
        maxLength={4}
        value={year}
        onChange={e => {
          const v = e.target.value.replace(/\D/g, '')
          setYear(v)
          emit(day, month, v)
        }}
      />
    </div>
  )
}

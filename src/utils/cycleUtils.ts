export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export const PHASE_CONFIG: Record<CyclePhase, {
  label: string
  color: string
  textColor: string
  description: string
  tips: string[]
}> = {
  menstrual: {
    label: 'Menstruación',
    color: '#FFD5D5',
    textColor: '#B03050',
    description: 'Tu cuerpo libera el revestimiento uterino. Es normal sentir calambres, fatiga y cambios de humor.',
    tips: ['Descansa más de lo habitual', 'Aplica calor en el abdomen', 'Mantente hidratada', 'Evita el ejercicio intenso'],
  },
  follicular: {
    label: 'Folicular',
    color: '#FFF3C4',
    textColor: '#8B7000',
    description: 'Los folículos ováricos maduran. Tu energía aumenta progresivamente y el estado de ánimo mejora.',
    tips: ['Es buen momento para nuevos proyectos', 'Tu energía está en aumento', 'Buen momento para ejercicio moderado', 'Aprovecha tu creatividad'],
  },
  ovulation: {
    label: 'Ovulación',
    color: '#D4F5E0',
    textColor: '#1A6A40',
    description: 'Se libera el óvulo. Es tu pico de fertilidad, energía y vitalidad. Te sientes más sociable.',
    tips: ['Pico de energía y bienestar', 'Alta fertilidad estos días', 'Excelente para ejercicio intenso', 'Tu piel puede lucir más radiante'],
  },
  luteal: {
    label: 'Lútea',
    color: '#ECE8F0',
    textColor: '#6B5080',
    description: 'El cuerpo se prepara para el siguiente ciclo. Puedes experimentar síntomas premenstruales.',
    tips: ['Reduce el azúcar y la cafeína', 'Practica técnicas de relajación', 'El ejercicio suave ayuda', 'Cuida tu alimentación'],
  },
}

export function dateToString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayString(): string {
  return dateToString(new Date())
}

export function calculateCycleDay(lastPeriodStart: string, cycleLength: number): number {
  const start = new Date(lastPeriodStart + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000)
  if (diff < 0) return 1
  return (diff % cycleLength) + 1
}

export function getPhaseForCycleDay(
  cycleDay: number,
  cycleLength: number,
  bleedingDuration: number
): CyclePhase {
  const ovulationDay = cycleLength - 14
  const ovulationStart = Math.max(ovulationDay - 1, bleedingDuration + 1)
  const ovulationEnd = Math.min(ovulationDay + 1, cycleLength - 1)

  if (cycleDay <= bleedingDuration) return 'menstrual'
  if (cycleDay >= ovulationStart && cycleDay <= ovulationEnd) return 'ovulation'
  if (cycleDay > ovulationEnd) return 'luteal'
  return 'follicular'
}

export function getPhaseForDate(
  date: Date,
  lastPeriodStart: string,
  cycleLength: number,
  bleedingDuration: number
): CyclePhase | null {
  if (!lastPeriodStart) return null
  const start = new Date(lastPeriodStart + 'T00:00:00')
  const d = new Date(date)
  start.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const diff = Math.floor((d.getTime() - start.getTime()) / 86400000)
  if (diff < 0) return null
  const cycleDay = (diff % cycleLength) + 1
  return getPhaseForCycleDay(cycleDay, cycleLength, bleedingDuration)
}

export function getCurrentPhaseInfo(
  lastPeriodStart: string | null,
  cycleLength: number,
  bleedingDuration: number
): { phase: CyclePhase; cycleDay: number } | null {
  if (!lastPeriodStart) return null
  const cycleDay = calculateCycleDay(lastPeriodStart, cycleLength)
  const phase = getPhaseForCycleDay(cycleDay, cycleLength, bleedingDuration)
  return { phase, cycleDay }
}

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const DAYS_SHORT = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

export const FLOW_LEVELS = [
  { id: 'bajo', label: 'Bajo' },
  { id: 'regular', label: 'Regular' },
  { id: 'abundante', label: 'Abundante' },
  { id: 'muy_abundante', label: 'Muy abundante' },
]

export const SYMPTOMS = ['Dolores corporales', 'Mareo', 'Indigestión', 'Vómito']

export const MOODS = [
  { emoji: '😊', label: 'Feliz' },
  { emoji: '🥰', label: 'Amorosa' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😔', label: 'Triste' },
  { emoji: '😣', label: 'Con dolor' },
]

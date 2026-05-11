import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface MedicalFormData {
  personal_data: {
    full_name: string
    age: string
    birth_date: string
    allergies: string
    blood_type: string
    vaginal_infections: string
    surgeries: string
  }
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
  menstrual_history: {
    menarche_age: string
    cycle_duration: string
    cycle_regularity: string
    last_pap_smear: string
    last_ultrasound: string
  }
}

function wrapText(text: string, maxWidth: number, size: number, font: Awaited<ReturnType<PDFDocument['embedFont']>>): string[] {
  const str = text?.trim() || '—'
  if (font.widthOfTextAtSize(str, size) <= maxWidth) return [str]
  const words = str.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['—']
}

export async function generateMedicalPDF(formData: MedicalFormData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()

  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)

  const M = 50
  const W = width - M * 2

  const cBrand   = rgb(0.753, 0.471, 0.408)
  const cDark    = rgb(0.165, 0.102, 0.055)
  const cLight   = rgb(0.608, 0.545, 0.447)
  const cSec     = rgb(0.961, 0.933, 0.898)
  const cDivider = rgb(0.878, 0.851, 0.816)

  let y = height - M

  // Header
  page.drawText('Diana', { x: M, y, font: bold, size: 32, color: cBrand })
  page.drawText('Historial Médico Personal', { x: M, y: y - 26, font: regular, size: 12, color: cLight })
  const dateStr = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  page.drawText(dateStr, {
    x: width - M - regular.widthOfTextAtSize(dateStr, 10),
    y: y - 6, font: regular, size: 10, color: cLight,
  })
  y -= 52
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 1.5, color: cBrand })
  y -= 22

  const drawSection = (title: string) => {
    y -= 4
    page.drawRectangle({ x: M, y: y - 7, width: W, height: 26, color: cSec })
    page.drawRectangle({ x: M, y: y - 7, width: 3,  height: 26, color: cBrand })
    page.drawText(title.toUpperCase(), { x: M + 10, y, font: bold, size: 9, color: cBrand })
    y -= 28
  }

  const drawRow = (fields: { label: string; value: string; w: number }[]) => {
    const LINE_H = 13
    const wrapped = fields.map(f => wrapText(f.value, f.w - 14, 10, regular))
    const maxLines = Math.max(...wrapped.map(l => l.length), 1)
    let x = M
    fields.forEach((f, i) => {
      page.drawText(f.label.toUpperCase(), { x, y, font: bold, size: 7.5, color: cLight })
      wrapped[i].forEach((line, li) => {
        page.drawText(line, { x, y: y - LINE_H - li * LINE_H, font: regular, size: 10, color: cDark })
      })
      x += f.w
    })
    y -= LINE_H + maxLines * LINE_H + 10
  }

  const divider = () => {
    y -= 4
    page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.4, color: cDivider })
    y -= 10
  }

  const s = (v: string) => v?.trim() || '—'
  const p = formData.personal_data
  const o = formData.obstetric_history
  const c = formData.current_symptoms
  const m = formData.menstrual_history

  // 1. Datos Personales
  drawSection('1. Datos Personales')
  y -= 8
  drawRow([
    { label: 'Nombre completo',     value: s(p.full_name),  w: W * 0.50 },
    { label: 'Edad',                value: p.age ? `${p.age} años` : '—', w: W * 0.18 },
    { label: 'Fecha de nacimiento', value: s(p.birth_date), w: W * 0.32 },
  ])
  divider()
  drawRow([
    { label: 'Tipo de sangre', value: s(p.blood_type), w: W * 0.25 },
    { label: 'Alergias',       value: s(p.allergies),  w: W * 0.75 },
  ])
  divider()
  drawRow([
    { label: 'Infecciones vaginales', value: s(p.vaginal_infections), w: W * 0.50 },
    { label: 'Cirugías previas',      value: s(p.surgeries),          w: W * 0.50 },
  ])
  y -= 14

  // 2. Historial Obstétrico
  drawSection('2. Historial Obstétrico')
  y -= 8
  drawRow([
    { label: 'Embarazos',          value: s(o.pregnancies), w: W * 0.25 },
    { label: 'Partos vaginales',   value: s(o.deliveries),  w: W * 0.25 },
    { label: 'Cesáreas',           value: s(o.cesareans),   w: W * 0.25 },
    { label: 'Abortos / pérdidas', value: s(o.abortions),   w: W * 0.25 },
  ])
  y -= 14

  // 3. Síntomas Actuales
  drawSection('3. Síntomas Actuales')
  y -= 8
  drawRow([
    { label: 'Dolor pélvico',    value: s(c.pelvic_pain),      w: W * 0.50 },
    { label: 'Sangrado anormal', value: s(c.abnormal_bleeding), w: W * 0.50 },
  ])
  divider()
  drawRow([{ label: 'Otros síntomas', value: s(c.other_symptoms), w: W }])
  y -= 14

  // 4. Historial Menstrual
  drawSection('4. Historial Menstrual y Estudios')
  y -= 8
  drawRow([
    { label: 'Edad de menarquía',  value: m.menarche_age    ? `${m.menarche_age} años`   : '—', w: W * 0.33 },
    { label: 'Duración del ciclo', value: m.cycle_duration  ? `${m.cycle_duration} días`  : '—', w: W * 0.33 },
    { label: 'Regularidad',        value: s(m.cycle_regularity), w: W * 0.34 },
  ])
  divider()
  drawRow([
    { label: 'Último Papanicolaou', value: s(m.last_pap_smear),  w: W * 0.50 },
    { label: 'Último ultrasonido',  value: s(m.last_ultrasound), w: W * 0.50 },
  ])

  // Footer
  const footerY = M - 12
  page.drawLine({ start: { x: M, y: footerY + 16 }, end: { x: width - M, y: footerY + 16 }, thickness: 0.5, color: cDivider })
  page.drawText(
    'Generado por Diana · Solo para referencia personal · Consulta a tu médico para interpretación profesional.',
    { x: M, y: footerY, font: regular, size: 7.5, color: cLight },
  )

  return await doc.save()
}

export async function downloadMedicalPDF(formData: MedicalFormData): Promise<void> {
  const pdfBytes = await generateMedicalPDF(formData)
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'historial-medico-diana.pdf'
  a.click()
  URL.revokeObjectURL(url)
}

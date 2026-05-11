import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1?target=deno&no-check'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

// deno-lint-ignore no-explicit-any
function wrapText(text: string, maxWidth: number, size: number, font: any): string[] {
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

// deno-lint-ignore no-explicit-any
async function buildPDF(d: Record<string, any>): Promise<Uint8Array> {
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

  const s = (v: unknown) => (v != null && v !== '') ? String(v) : '—'

  // 1. Datos Personales
  drawSection('1. Datos Personales')
  y -= 8
  drawRow([
    { label: 'Nombre completo',     value: s(d.full_name),  w: W * 0.50 },
    { label: 'Edad',                value: d.age ? `${d.age} años` : '—', w: W * 0.18 },
    { label: 'Fecha de nacimiento', value: s(d.birth_date), w: W * 0.32 },
  ])
  divider()
  drawRow([
    { label: 'Tipo de sangre', value: s(d.blood_type), w: W * 0.25 },
    { label: 'Alergias',       value: s(d.allergies),  w: W * 0.75 },
  ])
  divider()
  drawRow([
    { label: 'Infecciones vaginales', value: s(d.vaginal_infections_detail), w: W * 0.50 },
    { label: 'Cirugías previas',      value: s(d.surgeries_detail),          w: W * 0.50 },
  ])
  y -= 14

  // 2. Historial Obstétrico
  drawSection('2. Historial Obstétrico')
  y -= 8
  drawRow([
    { label: 'Embarazos',          value: s(d.pregnancy_count),     w: W * 0.25 },
    { label: 'Partos vaginales',   value: s(d.delivery_count),      w: W * 0.25 },
    { label: 'Cesáreas',           value: s(d.c_section_count),     w: W * 0.25 },
    { label: 'Abortos / pérdidas', value: s(d.abortion_loss_count), w: W * 0.25 },
  ])
  y -= 14

  // 3. Síntomas Actuales
  drawSection('3. Síntomas Actuales')
  y -= 8
  drawRow([
    { label: 'Dolor pélvico',    value: s(d.pelvic_pain),      w: W * 0.50 },
    { label: 'Sangrado anormal', value: s(d.abnormal_bleeding), w: W * 0.50 },
  ])
  divider()
  drawRow([{ label: 'Otros síntomas', value: s(d.other_symptoms), w: W }])
  y -= 14

  // 4. Historial Menstrual
  drawSection('4. Historial Menstrual y Estudios')
  y -= 8
  drawRow([
    { label: 'Edad de menarquía',  value: d.menarche_age    ? `${d.menarche_age} años`   : '—', w: W * 0.33 },
    { label: 'Duración del ciclo', value: d.cycle_duration  ? `${d.cycle_duration} días`  : '—', w: W * 0.33 },
    { label: 'Regularidad',        value: s(d.cycle_regularity), w: W * 0.34 },
  ])
  divider()
  drawRow([
    { label: 'Último Papanicolaou', value: s(d.last_pap_smear),  w: W * 0.50 },
    { label: 'Último ultrasonido',  value: s(d.last_ultrasound), w: W * 0.50 },
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { user_id } = body
    console.log('[send-medical-email] user_id:', user_id)

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get user email
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id)
    console.log('[send-medical-email] user email:', user?.email, 'error:', userError?.message)
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: 'Could not retrieve user email', detail: userError?.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get medical record
    const { data: record, error: dbError } = await supabaseAdmin
      .from('medical_history')
      .select('*')
      .eq('user_id', user_id)
      .single()
    console.log('[send-medical-email] db record found:', !!record, 'error:', dbError?.message)
    if (dbError || !record) {
      return new Response(JSON.stringify({ error: 'Medical record not found', detail: dbError?.message }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('[send-medical-email] RESEND_API_KEY not set')
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build PDF
    console.log('[send-medical-email] building PDF...')
    const pdfBytes  = await buildPDF(record)
    const pdfBase64 = toBase64(pdfBytes)
    console.log('[send-medical-email] PDF size (bytes):', pdfBytes.length)

    const name    = record.full_name ? record.full_name.split(' ')[0] : 'Diana'
    const dateStr = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

    const emailPayload = {
      from: 'Diana <onboarding@resend.dev>',
      to: ['tech.4.her.diana@gmail.com'], // TODO: cambiar a user.email una vez verificado el dominio

      subject: 'Tu historial médico — Diana',
      html: `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F5EFE6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table style="max-width:520px;width:100%;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:linear-gradient(160deg,#C07868 0%,#C4917E 40%,#B0A898 75%,#9BAD98 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:400;color:#fff;letter-spacing:-1px;">Diana</p>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.82);">Tu compañera de salud y bienestar personal</p>
          </td>
        </tr>
        <tr>
          <td style="background:#FEFCF9;padding:36px 40px;border-left:1px solid #EDE4D8;border-right:1px solid #EDE4D8;">
            <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#2A1A0E;">Hola, ${name} 👋</p>
            <p style="margin:0 0 20px;font-size:15px;color:#9B8B72;line-height:1.6;">Adjunto encontrarás tu historial médico completo en formato PDF.</p>
            <div style="background:#FFF8F0;border:1px solid #FFD4A8;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#9B6840;">📄 <strong>historial-medico-diana.pdf</strong><br/>Generado el ${dateStr}</p>
            </div>
            <p style="margin:0;font-size:13px;color:#C4B49E;line-height:1.6;">Consulta siempre a un profesional de la salud para interpretación médica.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F0E8DC;border-radius:0 0 16px 16px;border:1px solid #EDE4D8;border-top:none;padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#B8A898;">© 2025 Diana · Hecho con cuidado para tu bienestar</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      attachments: [{ filename: 'historial-medico-diana.pdf', content: pdfBase64 }],
    }

    console.log('[send-medical-email] sending email to:', user.email)
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload),
    })

    const resendBody = await resendRes.json()
    console.log('[send-medical-email] Resend response:', resendRes.status, JSON.stringify(resendBody))

    if (!resendRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to send email', detail: resendBody }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[send-medical-email] Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

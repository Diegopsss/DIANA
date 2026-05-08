import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, medical_data } = await req.json()

    if (!user_id || !medical_data) {
      return new Response(JSON.stringify({ error: 'Missing user_id or medical_data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the user's email from Supabase Auth
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id)
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: 'Could not retrieve user email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { personal_data, obstetric_history, current_symptoms, menstrual_history } = medical_data

    const htmlBody = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Georgia, serif; color: #3D2B1F; background: #FDF6EE; margin: 0; padding: 24px; }
    h1 { color: #C07868; font-size: 22px; margin-bottom: 4px; }
    h2 { color: #8B6352; font-size: 15px; border-bottom: 1px solid #EDE3D5; padding-bottom: 6px; margin-top: 24px; }
    .row { display: flex; gap: 16px; margin-bottom: 8px; }
    .field { flex: 1; }
    .label { font-size: 11px; color: #9B8B72; text-transform: uppercase; letter-spacing: 0.8px; }
    .value { font-size: 14px; color: #3D2B1F; margin-top: 2px; }
    .footer { margin-top: 32px; font-size: 12px; color: #9B8B72; text-align: center; }
  </style>
</head>
<body>
  <h1>📋 Información Médica — Diana</h1>
  <p style="color:#7A6352;font-size:13px;">Generado el ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

  <h2>Datos Personales y Ginecológicos</h2>
  <div class="row">
    <div class="field"><div class="label">Nombre completo</div><div class="value">${personal_data?.full_name || '—'}</div></div>
    <div class="field"><div class="label">Edad</div><div class="value">${personal_data?.age || '—'}</div></div>
    <div class="field"><div class="label">Fecha de nacimiento</div><div class="value">${personal_data?.birth_date || '—'}</div></div>
  </div>
  <div class="row">
    <div class="field"><div class="label">Tipo de sangre</div><div class="value">${personal_data?.blood_type || '—'}</div></div>
    <div class="field"><div class="label">Alergias</div><div class="value">${personal_data?.allergies || '—'}</div></div>
  </div>
  <div class="row">
    <div class="field"><div class="label">Infecciones vaginales</div><div class="value">${personal_data?.vaginal_infections || '—'}</div></div>
    <div class="field"><div class="label">Cirugías previas</div><div class="value">${personal_data?.surgeries || '—'}</div></div>
  </div>

  <h2>Historial Obstétrico</h2>
  <div class="row">
    <div class="field"><div class="label">Embarazos</div><div class="value">${obstetric_history?.pregnancies || '—'}</div></div>
    <div class="field"><div class="label">Partos</div><div class="value">${obstetric_history?.deliveries || '—'}</div></div>
    <div class="field"><div class="label">Cesáreas</div><div class="value">${obstetric_history?.cesareans || '—'}</div></div>
    <div class="field"><div class="label">Abortos</div><div class="value">${obstetric_history?.abortions || '—'}</div></div>
  </div>

  <h2>Síntomas Actuales</h2>
  <div class="row">
    <div class="field"><div class="label">Dolor pélvico</div><div class="value">${current_symptoms?.pelvic_pain || '—'}</div></div>
    <div class="field"><div class="label">Sangrado anormal</div><div class="value">${current_symptoms?.abnormal_bleeding || '—'}</div></div>
  </div>
  <div class="field"><div class="label">Otros síntomas</div><div class="value">${current_symptoms?.other_symptoms || '—'}</div></div>

  <h2>Historial Menstrual</h2>
  <div class="row">
    <div class="field"><div class="label">Edad de menarquía</div><div class="value">${menstrual_history?.menarche_age || '—'}</div></div>
    <div class="field"><div class="label">Duración del ciclo</div><div class="value">${menstrual_history?.cycle_duration || '—'} días</div></div>
    <div class="field"><div class="label">Regularidad</div><div class="value">${menstrual_history?.cycle_regularity || '—'}</div></div>
  </div>
  <div class="row">
    <div class="field"><div class="label">Último Papanicolaou</div><div class="value">${menstrual_history?.last_pap_smear || '—'}</div></div>
    <div class="field"><div class="label">Último ultrasonido</div><div class="value">${menstrual_history?.last_ultrasound || '—'}</div></div>
  </div>

  <div class="footer">Este resumen fue generado por Diana. Consulta a tu médico para interpretación profesional.</div>
</body>
</html>`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Diana App <noreply@tudominio.com>',
        to: [user.email],
        subject: '📋 Tu información médica — Diana',
        html: htmlBody,
      }),
    })

    if (!resendRes.ok) {
      const errText = await resendRes.text()
      console.error('Resend error:', errText)
      return new Response(JSON.stringify({ error: 'Failed to send email', details: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

import { useNavigate } from 'react-router-dom'

export const Policies = () => {
  const navigate = useNavigate()

  return (
    <div className="app-page">
      <div className="diana-topbar">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#2A1A0E' }}>Políticas de Privacidad</span>
        <div style={{ width: 40 }} />
      </div>

      <div className="app-content" style={{ padding: '20px 20px 40px', overflowY: 'auto' }}>
        <p style={{ fontSize: 13, color: '#9B8B72', marginBottom: 20 }}>
          Última actualización: Enero 2025
        </p>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 400, color: '#2A1A0E', margin: '0 0 8px' }}>
            1. Información que recopilamos
          </h2>
          <p style={{ fontSize: 14, color: '#5D4E37', lineHeight: 1.7, margin: 0 }}>
            Diana recopila información que tú proporcionas directamente: datos de perfil (nombre, fecha de nacimiento, peso, talla), datos del ciclo menstrual (fechas de periodo, duración del ciclo), registros diarios (flujo, síntomas, estado de ánimo), entradas del diario personal, e historial médico ginecológico.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 400, color: '#2A1A0E', margin: '0 0 8px' }}>
            2. Cómo usamos tu información
          </h2>
          <p style={{ fontSize: 14, color: '#5D4E37', lineHeight: 1.7, margin: 0 }}>
            Utilizamos tu información exclusivamente para brindarte el servicio de seguimiento de ciclo menstrual, predicciones de fases, recomendaciones personalizadas de bienestar y respuestas de la IA de Diana. No vendemos ni compartimos tu información personal con terceros.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 400, color: '#2A1A0E', margin: '0 0 8px' }}>
            3. Seguridad de los datos
          </h2>
          <p style={{ fontSize: 14, color: '#5D4E37', lineHeight: 1.7, margin: 0 }}>
            Toda tu información se almacena de forma segura con cifrado en tránsito y en reposo. Utilizamos Supabase como proveedor de base de datos con Row Level Security (RLS), garantizando que solo tú puedas acceder a tus propios datos.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 400, color: '#2A1A0E', margin: '0 0 8px' }}>
            4. Tus derechos
          </h2>
          <p style={{ fontSize: 14, color: '#5D4E37', lineHeight: 1.7, margin: 0 }}>
            Tienes derecho a acceder, corregir o eliminar tu información en cualquier momento. Puedes hacerlo desde la sección de Configuración de la aplicación. Para solicitudes adicionales, contáctanos en soporte@diana-app.com.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 400, color: '#2A1A0E', margin: '0 0 8px' }}>
            5. Datos de salud
          </h2>
          <p style={{ fontSize: 14, color: '#5D4E37', lineHeight: 1.7, margin: 0 }}>
            Diana maneja datos de salud con especial cuidado. La información de tu ciclo y síntomas se usa solo para la funcionalidad de la app. Diana no es un dispositivo médico y sus predicciones no sustituyen el consejo médico profesional.
          </p>
        </section>

        <section>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 400, color: '#2A1A0E', margin: '0 0 8px' }}>
            6. Cambios a esta política
          </h2>
          <p style={{ fontSize: 14, color: '#5D4E37', lineHeight: 1.7, margin: 0 }}>
            Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos a través de la aplicación. El uso continuado de Diana después de los cambios constituye tu aceptación de la política actualizada.
          </p>
        </section>
      </div>
    </div>
  )
}

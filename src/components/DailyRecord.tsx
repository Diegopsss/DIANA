import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DailyRecordProps {
  onFlowSelect?: (flow: number) => void;
  onSymptomSelect?: (symptom: string) => void;
}

interface DiaryEntry {
  date: Date;
  content: string;
}

const DailyRecord: React.FC<DailyRecordProps> = ({ onFlowSelect, onSymptomSelect }) => {
  const navigate = useNavigate();
  const [selectedFlow, setSelectedFlow] = useState<number>(0);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());

  const flowLevels = [1, 2, 3, 4, 5];
  
  const symptoms = [
    { id: 'mareo', label: 'Mareo', icon: 'dizzy' },
    { id: 'indigestion', label: 'Indigestión', icon: 'stomach' },
    { id: 'dolor-cabeza', label: 'Dolor de cabeza', icon: 'headache' },
    { id: 'calambres', label: 'Calambres', icon: 'cramps' },
    { id: 'fatiga', label: 'Fatiga', icon: 'tired' },
    { id: 'ansiedad', label: 'Ansiedad', icon: 'anxious' },
    { id: 'acne', label: 'Acné', icon: 'acne' },
    { id: 'sensibilidad', label: 'Sensibilidad', icon: 'sensitivity' }
  ];

  const mockDiaryEntries: DiaryEntry[] = [
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), content: "Hoy me sentí muy bien durante la mañana, pero por la tarde tuve algunos calambres leves." },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), content: "El flujo fue más ligero de lo normal y no tuve síntomas molestos, lo cual fue un alivio." },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), content: "Experimenté un poco de fatiga y dolor de cabeza, probablemente por los cambios hormonales." },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), content: "Me desperté con mucha energía y logré hacer ejercicio sin problemas, me siento genial." },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), content: "Tuve un episodio de mareo durante la tarde, pero pasó rápido después de descansar un poco." },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), content: "El día fue bastante tranquilo, solo algunos calambres leves por la mañana." },
    { date: new Date(), content: "Hoy me siento bien, aunque un poco cansada, pero nada fuera de lo normal." }
  ];

  const getFirstSentence = (text: string): string => {
    const sentences = text.split('.');
    return sentences[0]?.trim() + (sentences.length > 1 ? '...' : '');
  };

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const handleFlowClick = (level: number) => {
    setSelectedFlow(level);
    onFlowSelect?.(level);
  };

  const handleSymptomClick = (symptomId: string) => {
    const newSymptoms = new Set(selectedSymptoms);
    if (newSymptoms.has(symptomId)) {
      newSymptoms.delete(symptomId);
    } else {
      newSymptoms.add(symptomId);
    }
    setSelectedSymptoms(newSymptoms);
    onSymptomSelect?.(symptomId);
  };

  
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Sección de Récord */}
      <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-diana-medium p-6 border border-diana-border/20">
        <h2 className="text-2xl font-semibold text-diana-text mb-6">Récord</h2>
        
        {/* Iconos de gotas para flujo */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-diana-text-light mb-4">Flujo del día</h3>
          <div className="flex justify-center gap-3">
            {flowLevels.map((level) => (
              <button
                key={level}
                onClick={() => handleFlowClick(level)}
                className={`relative w-12 h-12 rounded-full transition-all duration-300 transform hover:scale-110 ${
                  selectedFlow >= level 
                    ? 'bg-white shadow-lg border-2 border-diana-orange' 
                    : 'bg-diana-soft border-2 border-diana-border'
                }`}
                aria-label={`Nivel de flujo ${level}`}
              >
                <svg 
                  className="w-6 h-6 mx-auto" 
                  fill={selectedFlow >= level ? '#FF8C42' : '#8B7355'} 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-2 text-xs text-diana-text-light">
            <span>Muy ligero</span>
            <span>Muy fuerte</span>
          </div>
        </div>

        {/* Botones de síntomas */}
        <div>
          <h3 className="text-lg font-medium text-diana-text-light mb-4">Síntomas</h3>
          <div className="grid grid-cols-4 gap-3">
            {symptoms.map((symptom) => (
              <button
                key={symptom.id}
                onClick={() => handleSymptomClick(symptom.id)}
                className={`relative p-3 rounded-2xl transition-all duration-300 transform ${
                  selectedSymptoms.has(symptom.id)
                    ? 'bg-diana-orange text-white scale-105 animate-pulse'
                    : 'bg-diana-soft text-diana-text hover:bg-diana-warm hover:scale-105'
                } border border-diana-border/30`}
              >
                <div className="flex flex-col items-center gap-1">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    {symptom.icon === 'dizzy' && (
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                    )}
                    {symptom.icon === 'stomach' && (
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2-4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                    )}
                    {symptom.icon === 'headache' && (
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    )}
                    {symptom.icon === 'cramps' && (
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 11 5.5 13.5 8 11 10.5 13.5 13 11 15.5 8.5 13 11 10.5 8.5 8 11 5.5 13.5 8z"/>
                    )}
                    {symptom.icon === 'tired' && (
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-5.5 9c.83 0 1.5.67 1.5 1.5S7.33 14 6.5 14 5 13.33 5 12.5 5.67 11 6.5 11zm11 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"/>
                    )}
                    {symptom.icon === 'anxious' && (
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    )}
                    {symptom.icon === 'acne' && (
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 8c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm4 0c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm4 0c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z"/>
                    )}
                    {symptom.icon === 'sensitivity' && (
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    )}
                  </svg>
                  <span className="text-xs font-medium">{symptom.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sección de Diario */}
      <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-diana-medium p-6 border border-diana-border/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-diana-text">Diario</h2>
          <button
            onClick={() => navigate('/diario')}
            className="text-diana-orange hover:text-diana-orange/80 transition-colors"
          >
            Ver todo
          </button>
        </div>
        
        <div className="space-y-4">
          {mockDiaryEntries.map((entry, index) => (
            <div 
              key={index}
              className="p-4 bg-white/40 rounded-2xl border border-diana-border/20 hover:bg-white/60 transition-all duration-300 cursor-pointer"
              onClick={() => navigate('/diario/entry', { state: { date: entry.date } })}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-diana-text-light">
                  {formatDate(entry.date)}
                </span>
                {index === 0 && (
                  <span className="text-xs bg-diana-orange text-white px-2 py-1 rounded-full">
                    Hoy
                  </span>
                )}
              </div>
              <p className="text-diana-text line-clamp-2">
                {getFirstSentence(entry.content)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Botón flotante para añadir nueva entrada */}
      <button
        onClick={() => navigate('/diario/new')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-diana-orange text-white rounded-full shadow-diana-large flex items-center justify-center hover:bg-diana-orange/90 transition-all duration-300 transform hover:scale-110"
        aria-label="Añadir nueva entrada"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default DailyRecord;

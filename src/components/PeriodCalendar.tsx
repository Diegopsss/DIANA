import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PeriodCalendarProps {
  lastPeriodStart: Date;
  avgCycleDuration: number;
  bleedingDuration?: number;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  phase: 'menstruation' | 'follicular' | 'ovulation' | 'luteal' | 'outside';
  isToday: boolean;
}

const PeriodCalendar: React.FC<PeriodCalendarProps> = ({
  lastPeriodStart,
  avgCycleDuration,
  bleedingDuration = 5
}) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getPhaseForDay = (date: Date): 'menstruation' | 'follicular' | 'ovulation' | 'luteal' | 'outside' => {
    const daysDiff = Math.floor((date.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = ((daysDiff % avgCycleDuration) + avgCycleDuration) % avgCycleDuration;
    
    if (cycleDay < bleedingDuration) {
      return 'menstruation';
    }
    
    const ovulationDay = Math.floor(avgCycleDuration * 0.5);
    const ovulationWindow = 2;
    
    if (Math.abs(cycleDay - ovulationDay) <= ovulationWindow) {
      return 'ovulation';
    }
    
    if (cycleDay < ovulationDay - ovulationWindow) {
      return 'follicular';
    }
    
    return 'luteal';
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      
      let phase: CalendarDay['phase'] = 'outside';
      if (isCurrentMonth) {
        phase = getPhaseForDay(date);
      }
      
      days.push({
        date,
        isCurrentMonth,
        phase,
        isToday
      });
    }
    
    return days;
  };

  const handleDayClick = (day: CalendarDay) => {
    if (day.isCurrentMonth) {
      navigate('/period/edit', { state: { date: day.date } });
    }
  };

  const getDayClasses = (day: CalendarDay): string => {
    const baseClasses = 'w-10 h-10 flex items-center justify-center text-sm rounded-full transition-all duration-200 cursor-pointer relative';
    
    if (!day.isCurrentMonth) {
      return `${baseClasses} text-gray-400 cursor-not-allowed`;
    }
    
    const phaseColors = {
      menstruation: 'bg-pink-200 text-pink-800 hover:bg-pink-300',
      follicular: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      ovulation: 'bg-green-200 text-green-800 hover:bg-green-300',
      luteal: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      outside: 'text-gray-400 cursor-not-allowed'
    };
    
    const colorClass = phaseColors[day.phase];
    const todayClass = day.isToday ? 'ring-2 ring-black ring-offset-2' : '';
    
    return `${baseClasses} ${colorClass} ${todayClass}`;
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const days = generateCalendarDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="diana-card max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-lg hover:bg-diana-soft transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-xl font-semibold text-diana-text">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-lg hover:bg-diana-soft transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-diana-text-light py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            onClick={() => handleDayClick(day)}
            className={getDayClasses(day)}
          >
            {day.date.getDate()}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-diana-border">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-pink-200 rounded-full"></div>
            <span className="text-diana-text-light">Menstruación</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
            <span className="text-diana-text-light">Folicular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-200 rounded-full"></div>
            <span className="text-diana-text-light">Ovulación</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
            <span className="text-diana-text-light">Lútea</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeriodCalendar;

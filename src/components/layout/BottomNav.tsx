import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const ITEMS = [
  {
    path: '/calendar',
    label: 'Calendario',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
        <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    path: '/phases',
    label: 'Fases',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="7.5" cy="16.5" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16.5" cy="16.5" r="3" stroke="currentColor" strokeWidth="1.8" />
        <line x1="10.5" y1="7.5" x2="13.5" y2="7.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="7.5" y1="10.5" x2="7.5" y2="13.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="16.5" y1="10.5" x2="16.5" y2="13.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="10.5" y1="16.5" x2="13.5" y2="16.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    path: '/medical-registry',
    label: '',
    center: true,
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="22" r="20" fill="#FF8C42" />
        <line x1="22" y1="13" x2="22" y2="31" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <line x1="13" y1="22" x2="31" y2="22" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    path: '/diary',
    label: 'Diario',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2" />
        <line x1="9" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    path: '/tips',
    label: 'Consejos',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.3 6V17a1 1 0 01-1 1h-5.4a1 1 0 01-1-1v-2C6.3 13.7 5 11.5 5 9a7 7 0 017-7z" stroke="currentColor" strokeWidth="2" />
        <line x1="9.8" y1="21" x2="14.2" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
]

export const BottomNav = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => {
        const active = pathname === item.path
        return (
          <motion.button
            key={item.path}
            className={`bottom-nav-btn${item.center ? ' center' : ''}${active && !item.center ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
            whileTap={{ scale: 0.88 }}
          >
            {item.icon}
            {item.label && <span className="bottom-nav-label">{item.label}</span>}
          </motion.button>
        )
      })}
    </nav>
  )
}

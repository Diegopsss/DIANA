import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { BottomNav } from '../components/layout/BottomNav'
import { HamburgerMenu } from '../components/layout/HamburgerMenu'
import { PhaseWheel } from '../components/PhaseWheel'
import { getCurrentPhaseInfo } from '../utils/cycleUtils'
import type { CyclePhase } from '../utils/cycleUtils'

export const Phases = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<CyclePhase | null>(null)

  const loadPhase = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('avg_cycle_duration, avg_bleeding_duration, last_period_start')
      .eq('id', user.id)
      .maybeSingle()
    if (data?.last_period_start) {
      const info = getCurrentPhaseInfo(data.last_period_start, data.avg_cycle_duration, data.avg_bleeding_duration)
      if (info) setCurrentPhase(info.phase)
    }
  }, [user])

  useEffect(() => { loadPhase() }, [loadPhase])

  return (
    <div className="app-page">
      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="diana-topbar">
        <button className="icon-btn" onClick={() => setMenuOpen(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button className="diana-topbar-logo" onClick={() => navigate('/home')}>Diana</button>
        <div style={{ width: 40 }} />
      </div>

      <div className="app-content" style={{ padding: '20px 16px' }}>
        <PhaseWheel currentPhase={currentPhase} />
      </div>

      <BottomNav />
    </div>
  )
}

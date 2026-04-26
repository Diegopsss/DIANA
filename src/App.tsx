import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SplashScreen, Login, SignUp, ForgotPassword,
  Home, Calendar, Phases, Diary, Tips, Forum, Settings,
  DailyRecord, MedicalRegistry, Policies,
} from './pages'
import './styles/globals/App.css'
import './styles/components/AppLayout.css'
import './styles/components/SplashScreen.css'
import './styles/components/Login.css'
import './styles/components/Home.css'
import './styles/components/Calendar.css'
import './styles/components/Phases.css'
import './styles/components/Diary.css'
import './styles/components/Tips.css'
import './styles/components/Forum.css'
import './styles/components/Settings.css'
import './styles/components/DailyRecord.css'
import './styles/components/MedicalRegistry.css'
import './styles/components/Loading.css'
import './styles/components/PhaseWheel.css'

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

const AnimatedRoutes = () => {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/home" element={<ProtectedRoute><PageTransition><Home /></PageTransition></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><PageTransition><Calendar /></PageTransition></ProtectedRoute>} />
        <Route path="/phases" element={<ProtectedRoute><PageTransition><Phases /></PageTransition></ProtectedRoute>} />
        <Route path="/diary" element={<ProtectedRoute><PageTransition><Diary /></PageTransition></ProtectedRoute>} />
        <Route path="/tips" element={<ProtectedRoute><PageTransition><Tips /></PageTransition></ProtectedRoute>} />
        <Route path="/forum" element={<ProtectedRoute><PageTransition><Forum /></PageTransition></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
        <Route path="/daily-record" element={<ProtectedRoute><PageTransition><DailyRecord /></PageTransition></ProtectedRoute>} />
        <Route path="/medical-registry" element={<ProtectedRoute><PageTransition><MedicalRegistry /></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
      <SpeedInsights />
    </AuthProvider>
  )
}

export default App

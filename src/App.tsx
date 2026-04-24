import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import {
  SplashScreen, Login, SignUp, ForgotPassword,
  Home, Calendar, Phases, Diary, Tips, Settings,
  DailyRecord, MedicalRegistry, DianaChat, Policies,
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
import './styles/components/Settings.css'
import './styles/components/DailyRecord.css'
import './styles/components/MedicalRegistry.css'
import './styles/components/DianaChat.css'
import './styles/components/Loading.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/phases" element={<ProtectedRoute><Phases /></ProtectedRoute>} />
          <Route path="/diary" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
          <Route path="/tips" element={<ProtectedRoute><Tips /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/daily-record" element={<ProtectedRoute><DailyRecord /></ProtectedRoute>} />
          <Route path="/medical-registry" element={<ProtectedRoute><MedicalRegistry /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><DianaChat /></ProtectedRoute>} />
        </Routes>
      </Router>
      <SpeedInsights />
    </AuthProvider>
  )
}

export default App

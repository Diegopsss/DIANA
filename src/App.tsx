import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { SplashScreen, Login, Calendar } from './pages'
import './styles/globals/App.css'
import './styles/components/SplashScreen.css'
import './styles/components/Login.css'
import './styles/components/Calendar.css'
import './styles/components/Loading.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
      <SpeedInsights />
    </AuthProvider>
  )
}

export default App

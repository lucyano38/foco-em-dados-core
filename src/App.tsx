import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/precos" element={<Pricing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<Dashboard />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/privacidade" element={<PrivacyPolicy onBack={() => window.history.back()} />} />
      <Route path="/termos" element={<TermsOfService onBack={() => window.history.back()} />} />
      <Route path="*" element={<NotFound onBack={() => window.history.back()} />} />
    </Routes>
  )
}

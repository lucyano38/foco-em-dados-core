import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import NotFound from './pages/NotFound'
import AdminAutomacao from './pages/AdminAutomacao'
import Admin from './pages/Admin'
import AdminProspeccao from './pages/AdminProspeccao'
import PreviewProposta from './pages/PreviewProposta'
import DashboardIndicadores from './pages/DashboardIndicadores'
import ProtectedRoute from './components/ProtectedRoute'
import ProtectedRouteMaster from './components/ProtectedRouteMaster'
import AdminRoute from './components/AdminRoute'
import SiteChat from './components/SiteChat'
import CookieConsent from './components/CookieConsent'
import AnimatedBackground from './components/AnimatedBackground'
import WhatsAppButton from './components/WhatsAppButton'
import ComparadorRedesign from './components/ComparadorRedesign'
import ProspeccaoCnae from './pages/ProspeccaoCnae'
import OpenSquadMonitor from './pages/OpenSquadMonitor'

export default function App() {
  return (
    <div className="min-h-screen text-[#e3e2e2] font-sans antialiased bg-[#0B1220]">
      <AnimatedBackground />
      <WhatsAppButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/indicadores" element={<DashboardIndicadores />} />
        <Route path="/comparador" element={<ComparadorRedesign />} />
        <Route path="/prospeccao" element={<ProspeccaoCnae />} />
        <Route path="/monitor" element={<OpenSquadMonitor />} />
        <Route path="/precos" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/privacidade" element={<PrivacyPolicy onBack={() => window.history.back()} />} />
        <Route path="/politica-de-privacidade" element={<PrivacyPolicy onBack={() => window.history.back()} />} />
        <Route path="/termos" element={<TermsOfService onBack={() => window.history.back()} />} />
        <Route path="/termos-de-uso" element={<TermsOfService onBack={() => window.history.back()} />} />

        <Route path="/preview/:id" element={<PreviewProposta />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/prospeccao"
          element={
            <AdminRoute>
              <AdminProspeccao />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/automacao"
          element={
            <ProtectedRouteMaster>
              <AdminAutomacao />
            </ProtectedRouteMaster>
          }
        />

        <Route path="*" element={<NotFound onBack={() => window.history.back()} />} />
      </Routes>
      <SiteChat />
      <CookieConsent />
    </div>
  )
}

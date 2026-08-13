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
import ProtectedRoute from './components/ProtectedRoute'
import ProtectedRouteMaster from './components/ProtectedRouteMaster'
import AdminRoute from './components/AdminRoute'
import SiteChat from './components/SiteChat'

export default function App() {
  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] font-sans antialiased">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/precos" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/privacidade" element={<PrivacyPolicy onBack={() => window.history.back()} />} />
        <Route path="/termos" element={<TermsOfService onBack={() => window.history.back()} />} />

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
    </div>
  )
}

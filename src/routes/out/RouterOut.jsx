import { Navigate, Route, Routes } from 'react-router-dom'
import IniciarSesion from '../../pages/out/IniciarSesion'
import Registro from '../../pages/out/Registro'
import RecuperarContrasena from '../../pages/out/RecuperarContrasena'
import Landing from '../../pages/public/Landing'
import Pricing from '../../pages/public/Pricing'
import PublicInfo from '../../pages/public/PublicInfo'
import Features from '../../pages/public/Features'
import Contact from '../../pages/public/Contact'
import ConfirmarQr from '../../pages/out/ConfirmarQr'
import Legal from '../../pages/public/Legal'

export default function RouterOut() {
  return (
    <Routes>
      <Route index element={<Landing />} />
      <Route path="login" element={<IniciarSesion />} />
      <Route path="qr-login" element={<ConfirmarQr />} />
      <Route path="register" element={<Registro />} />
      <Route path="recover-password" element={<RecuperarContrasena />} />
      <Route path="recuperar-contrasena" element={<Navigate to="/recover-password" replace />} />
      <Route path="registro" element={<Navigate to="/register" replace />} />
      <Route path="pricing" element={<Pricing />} />
      <Route path="features" element={<Features />} />
      <Route path="about" element={<PublicInfo type="about" />} />
      <Route path="contact" element={<Contact />} />
      <Route path="help" element={<PublicInfo type="help" />} />
      <Route path="terms" element={<Legal type="terms" />} />
      <Route path="privacy" element={<Legal type="privacy" />} />
      <Route path="complaints" element={<Contact complaint />} />
      <Route path="status" element={<Legal type="status" />} />
      <Route path="api-docs" element={<Legal type="api" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

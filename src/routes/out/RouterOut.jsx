import { Navigate, Route, Routes } from 'react-router-dom'
import IniciarSesion from '../../pages/out/IniciarSesion'
import Registro from '../../pages/out/Registro'
import RecuperarContrasena from '../../pages/out/RecuperarContrasena'
import Contact from '../../pages/public/Contact'
import PublicHub from '../../pages/public/PublicHub'
import ConfirmarQr from '../../pages/out/ConfirmarQr'
import FirmarConsentimiento from '../../pages/out/FirmarConsentimiento'
import Legal from '../../pages/public/Legal'

export default function RouterOut() {
  return (
    <Routes>
      <Route index element={<PublicHub />} />
      <Route path="login" element={<IniciarSesion />} />
      <Route path="qr-login" element={<ConfirmarQr />} />
      <Route path="firmar-consentimiento" element={<FirmarConsentimiento />} />
      <Route path="register" element={<Registro />} />
      <Route path="recover-password" element={<RecuperarContrasena />} />
      <Route path="recuperar-contrasena" element={<Navigate to="/recover-password" replace />} />
      <Route path="registro" element={<Navigate to="/register" replace />} />
      <Route path="pricing" element={<Navigate replace state={{ publicTab: "pricing" }} to="/" />} />
      <Route path="features" element={<Navigate replace state={{ publicTab: "features" }} to="/" />} />
      <Route path="about" element={<Navigate replace state={{ publicTab: "about" }} to="/" />} />
      <Route path="contact" element={<Navigate replace state={{ publicTab: "contact" }} to="/" />} />
      <Route path="help" element={<Navigate replace state={{ publicTab: "help" }} to="/" />} />
      <Route path="terms" element={<Legal type="terms" />} />
      <Route path="privacy" element={<Legal type="privacy" />} />
      <Route path="complaints" element={<Contact complaint />} />
      <Route path="status" element={<Legal type="status" />} />
      <Route path="api-docs" element={<Legal type="api" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth, AuthProvider } from './context/AuthContext'
import Login from './componentes/Login'
import Home from './componentes/Home'
import Header from './componentes/Header'
import Footer from './componentes/Footer'
import Configuracion from './componentes/modulo/Configuracion'
import RecursosHumanos from './componentes/modulo/RecursosHumanos'
import Operaciones from './componentes/modulo/Operaciones'
import Usuario from './componentes/configuracion/Usuario'
import CoberturaDePuesto from './componentes/seguridadpatrimonial/CoberturaDePuesto'
import SeguridadPatrimonial from './componentes/modulo/SeguridadPatrimonial'
import NovedadDeGuardia from './componentes/seguridadpatrimonial/NovedadDeGuardia'
import SolicitudComensalInterno from './componentes/recursoshumanos/SolicitudComensalInterno'
import RelacionSolicitudComensalInterno from './componentes/operaciones/RelacionSolicitudComensalInterno'
import ControlComensal from './componentes/modulo/ControlComensal'
import ControlMenu from './componentes/modulo/ControlMenu'
import PlanificacionMenu from './componentes/operaciones/PlanificacionMenu'
import RelacionInsumoPlanificacionMenu from './componentes/operaciones/RelacionInsumoPlanificacionMenu'
import NoInternet from './componentes/modal/NoInternet'
import { useEffect, useState } from 'react'

function AppRoutes() {
  const { session } = useAuth()
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  let Ver=true

  useEffect(() => {
    function updateOnlineStatus() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Limpieza al desmontar el componente
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  if (!isOnline) {
    return <NoInternet />
  }

  if (!session) {
    return <Login />
  }
  
  if (location.pathname === '/controlcomensal' || location.pathname === '/controlmenu') {
    Ver=false;  
  }
  
  return (
    <>
      {Ver ? (<Header />):(null)}
      <Routes>
        <Route path="/home" element={<Home />}>
          <Route path="configuracion" element={<Configuracion />}>
            <Route path="usuario" element={<Usuario />} />
          </Route>
          <Route path="recursoshumanos" element={<RecursosHumanos />}>
            <Route path="solicitudcomensalinterno" element={<SolicitudComensalInterno />} />
          </Route>
          <Route path="seguridadpatrimonial" element={<SeguridadPatrimonial />}>
            <Route path="coberturadepuesto" element={<CoberturaDePuesto />} />
            <Route path="novedadesdeguardia" element={<NovedadDeGuardia />} />
          </Route>
          <Route path="operaciones" element={<Operaciones />}>
              <Route path="relacionsolicitudcomensalinterno" element={<RelacionSolicitudComensalInterno />} />
              <Route path="planificacionmenu" element={<PlanificacionMenu />} />
              <Route path="relacioninsumoplanificacionmenu" element={<RelacionInsumoPlanificacionMenu />} />
          </Route>
        </Route>
        <Route path="/controlcomensal" element={<ControlComensal />} />
        <Route path="/controlmenu" element={<ControlMenu />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      {Ver ? (<Footer />):(null)}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

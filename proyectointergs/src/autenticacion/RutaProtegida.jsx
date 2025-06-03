// src/autenticacion/RutaProtegida.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './ContextoAutenticacion';

export default function RutaProtegida({ rolRequerido, children }) {
  const { usuario, rol, cargando } = useAuth();

  if (cargando) {
    // Mientras siga cargando el estado de Auth → no renderizamos nada
    return null;
  }
  if (!usuario) {
    // Si no hay usuario → forzamos login
    return <Navigate to="/login" replace />;
  }
  if (rolRequerido && rol !== rolRequerido) {
    // Si el rol no coincide con el rol requerido, lo redirigimos a su panel
    return <Navigate to={rol === 'admin' ? '/admin' : '/paciente'} replace />;
  }
  return children;
}

// src/autenticacion/RutaProtegida.jsx

import { Navigate } from 'react-router-dom';       // Componente para redirecciones
import { useAuth } from './ContextoAutenticacion';  // Hook propio que expone usuario, rol y cargando

/**
 * RutaProtegida:
 *  - Permite envolver cualquier ruta que deba protegerse según el estado de autenticación y rol.
 *  - Si el usuario no está autenticado o no tiene el rol adecuado, realiza una redirección.
 *
 * Props:
 *  - rolRequerido (string opcional): por ejemplo 'admin' o 'paciente'.
 *  - children: los componentes internos que solo se muestran si se cumplen las condiciones.
 */
export default function RutaProtegida({ rolRequerido, children }) {
 
  // Extraemos del contexto de autenticación tres valores clave:
  //  • usuario: objeto de Firebase Auth (o null si no hay sesión)
  //  • rol: valor 'admin' o 'paciente' (obtenido de Firestore)
  //  • cargando: booleano que indica si Firebase aún está determinando si hay sesión activa
  const { usuario, rol, cargando } = useAuth();

  // 1) Si aún estamos en proceso de cargar el estado de autenticación,
  //    no mostramos nada.
  if (cargando) {
    return null;
  }

  // 2) Si no existe un usuario autenticado, forzamos a la página de login:
  //    el componente <Navigate> de React Router redirige a "/login"
  //    y el prop `replace` evita que el usuario regrese con "Atrás" a esta ruta.
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // 3) Si se especificó un rol requerido (rolRequerido) y el rol actual NO coincide,
  //    redirigimos al panel que sí le corresponde: 
  //      • Si rol === 'admin', enviamos a "/admin"
  //      • Si rol ≠ 'admin' (asumimos que es 'paciente'), enviamos a "/paciente"
  if (rolRequerido && rol !== rolRequerido) {
    return <Navigate to={rol === 'admin' ? '/admin' : '/paciente'} replace />;
  }

  // 4) Si llegamos hasta aquí, el usuario está autenticado y (si había rolRequerido) cumple dicho rol.
  //    Por tanto, devolvemos `children`, que hace que el componente envuelto se renderice.
  return children;
}

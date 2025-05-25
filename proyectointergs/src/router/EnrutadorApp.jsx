// src/router/EnrutadorApp.jsx
import PaginaLogin     from "../paginas/PaginaLogin";
import PaginaAdmin     from "../paginas/PaginaAdmin";
import PaginaPaciente  from "../paginas/PaginaPaciente";
import RutaProtegida   from "../autenticacion/RutaProtegida";
import { useAuth }     from "../autenticacion/ContextoAutenticacion";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* Redirige según rol si ya hay sesión */
function RedirSegunRol() {
  const { rol } = useAuth();
  if (rol === "admin")    return <Navigate to="/admin"    replace />;
  if (rol === "paciente") return <Navigate to="/paciente" replace />;
  return null; // aún cargando
}

export default function EnrutadorApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PaginaLogin />} />

        <Route
          path="/admin/*"
          element={
            <RutaProtegida rolRequerido="admin">
              <PaginaAdmin />
            </RutaProtegida>
          }
        />

        <Route
          path="/paciente/*"
          element={
            <RutaProtegida rolRequerido="paciente">
              <PaginaPaciente />
            </RutaProtegida>
          }
        />

        {/* raíz */}
        <Route
          path="/"
          element={
            <RutaProtegida>
              <RedirSegunRol />
            </RutaProtegida>
          }
        />

        {/* cualquier ruta inexistente */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { Navigate } from "react-router-dom";
import { useAuth }  from "./ContextoAutenticacion";

export default function RutaProtegida({ rolRequerido, children }) {
  const { usuario, rol, cargando } = useAuth();

  if (cargando)      return <p className="p-8">Cargando…</p>;
  if (!usuario)      return <Navigate to="/login" replace />;

  if (rolRequerido && rol !== rolRequerido) {
    return <Navigate to={rol === "admin" ? "/admin" : "/paciente"} replace />;
  }
  return children;
}

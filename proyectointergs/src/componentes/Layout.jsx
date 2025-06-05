// src/componentes/Layout.jsx

import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../autenticacion/ContextoAutenticacion";

/**
 * Layout:
 *  - Estructura de página con sidebar y área principal.
 *  - Muestra distintos menús según el rol (admin o paciente).
 *  - Incluye botón para cerrar sesión.
 *
 *  - tipo: "admin" o "paciente", determina qué menú mostrar.
 */
export default function Layout({ tipo }) {
  // Extraemos usuario actual y función logout del contexto de autenticación
  const { usuario, logout } = useAuth();
  // Hook de React Router para redireccionar programáticamente
  const navigate = useNavigate();

  /**
   * handleLogout:
   *  - Llama a logout() para cerrar sesión en Firebase Auth.
   *  - Luego redirige al usuario a "/login" (reemplazando historial).
   */
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // Definición del menú para administrador: rutas y etiquetas
  const menuAdmin = [
    { to: "/admin", label: "Inicio" },
    { to: "/admin/medicos", label: "Médicos" },
    { to: "/admin/usuarios", label: "Usuarios" },
    { to: "/admin/citas", label: "Citas" },
  ];

  // Definición del menú para paciente: rutas y etiquetas
  const menuPaciente = [
    { to: "/paciente", label: "Inicio" },
    // Nota: esta ruta debe coincidir exactamente con la configuración del router
    { to: "/paciente/solicitar-cita", label: "Solicitar Cita" },
    { to: "/paciente/mis-citas", label: "Mis Citas" },
    { to: "/paciente/perfil", label: "Mi Perfil" },
  ];

  // Elegimos el menú según el tipo recibido como prop
  const menu = tipo === "admin" ? menuAdmin : menuPaciente;

  return (
    <div className="app-container">
      {/* ====== Sidebar ====== */}
      <aside className="sidebar">
        <div className="sidebar-header">Consultorio</div>
        <nav>
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              // Aplica clase "active" si la ruta coincide con la URL actual
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ====== Contenido principal ====== */}
      <div className="main-wrapper">
        <header className="header">
          {/* Muestra mensaje de bienvenida con nombre del usuario si está autenticado */}
          <h1>
            {usuario ? `Bienvenido, ${usuario.displayName}` : "Consultorio"}
          </h1>
          {/* Botón para cerrar sesión */}
          <button className="btn btn-danger btn-logout" onClick={handleLogout}>
            Salir
          </button>
        </header>

        <main className="main-content">
          {/* <Outlet> renderiza la ruta hija correspondiente */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

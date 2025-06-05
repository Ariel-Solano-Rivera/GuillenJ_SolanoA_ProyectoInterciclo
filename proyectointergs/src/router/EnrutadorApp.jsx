// src/router/EnrutadorApp.jsx

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../autenticacion/ContextoAutenticacion";

import Layout from "../componentes/Layout";
import RutaProtegida from "../autenticacion/RutaProtegida";

import PaginaLogin from "../paginas/PaginaLogin";
import PaginaAdminInicio from "../paginas/PaginaAdminInicio";
import PaginaMedicos from "../paginas/PaginaMedicos";
import PaginaUsuarios from "../paginas/PaginaUsuarios";
import PaginaCitasAdmin from "../paginas/PaginaCitasAdmin";

import PaginaPaciente from "../paginas/PaginaPaciente";
import PaginaSolicitarCita from "../paginas/PaginaSolicitarCita";
import PaginaCitasPaciente from "../paginas/PaginaCitasPaciente";
import PaginaPerfilPaciente from "../paginas/PaginaPerfilPaciente";

/**
 * RedirSegunRol:
 *  - Lee el rol del usuario autenticado desde el contexto de auth.
 *  - Mientras cargan datos (cargando === true), retorna null para no mostrar nada.
 *  - Si rol === "admin", redirige a "/admin".
 *  - Si rol === "paciente", redirige a "/paciente".
 *  - En cualquier otro caso (no autenticado), redirige a "/login".
 */
function RedirSegunRol() {
  const { rol, cargando } = useAuth(); // Obtenemos rol y estado de carga del hook de auth
  if (cargando) return null;           // Mientras se verifica sesión, no renderizar nada
  if (rol === "admin") return <Navigate to="/admin" />;       // Si es admin, navegar a panel de admin
  if (rol === "paciente") return <Navigate to="/paciente" />; // Si es paciente, navegar a panel de paciente
  return <Navigate to="/login" />;     // Si no hay rol válido, redirigir a login
}

/**
 * EnrutadorApp:
 *  - Define todas las rutas de la aplicación utilizando react-router-dom.
 *  - Utiliza <BrowserRouter> como contenedor de rutas.
 *  - Configura rutas públicas (login) y rutas protegidas (admin/paciente).
 */
export default function EnrutadorApp() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── PÁGINA DE LOGIN ──────────────────────────────────────── */}
        <Route path="/login" element={<PaginaLogin />} />

        {/* ── RUTAS ADMIN ──────────────────────────────────────────── */}
        <Route
          path="/admin/*"
          element={
            // RutaProtegida asegura que sólo un usuario con rol "admin" acceda
            <RutaProtegida rolRequerido="admin">
              {/* Layout con tipo="admin" envuelve las rutas hijas */}
              <Layout tipo="admin" />
            </RutaProtegida>
          }
        >
          {/* Ruta por defecto de /admin (index) → PaginaAdminInicio */}
          <Route index element={<PaginaAdminInicio />} />
          {/* /admin/medicos → PaginaMedicos */}
          <Route path="medicos" element={<PaginaMedicos />} />
          {/* /admin/usuarios → PaginaUsuarios */}
          <Route path="usuarios" element={<PaginaUsuarios />} />
          {/* /admin/citas → PaginaCitasAdmin */}
          <Route path="citas" element={<PaginaCitasAdmin />} />
          {/* Cualquier otra subruta bajo /admin redirige a /admin */}
          <Route path="*" element={<Navigate to="/admin" />} />
        </Route>

        {/* ── RUTAS PACIENTE ───────────────────────────────────────── */}
        <Route
          path="/paciente/*"
          element={
            // RutaProtegida asegura que sólo un usuario con rol "paciente" acceda
            <RutaProtegida rolRequerido="paciente">
              {/* Layout con tipo="paciente" envuelve las rutas hijas */}
              <Layout tipo="paciente" />
            </RutaProtegida>
          }
        >
          {/* Ruta por defecto de /paciente (index) → PaginaPaciente */}
          <Route index element={<PaginaPaciente />} />
          {/* /paciente/solicitar-cita → PaginaSolicitarCita */}
          <Route path="solicitar-cita" element={<PaginaSolicitarCita />} />
          {/* /paciente/mis-citas → PaginaCitasPaciente */}
          <Route path="mis-citas" element={<PaginaCitasPaciente />} />
          {/* /paciente/perfil → PaginaPerfilPaciente */}
          <Route path="perfil" element={<PaginaPerfilPaciente />} />
          {/* Cualquier otra subruta bajo /paciente redirige a /paciente */}
          <Route path="*" element={<Navigate to="/paciente" />} />
        </Route>

        {/* ── RAÍZ: redirige según sesión/rol ───────────────────────── */}
        <Route path="/" element={<RedirSegunRol />} />
        {/* Cualquier ruta no definida redirige a "/" */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

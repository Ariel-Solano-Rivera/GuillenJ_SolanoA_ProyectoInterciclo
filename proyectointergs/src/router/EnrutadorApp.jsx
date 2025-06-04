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

// Redirige según rol
function RedirSegunRol() {
  const { rol, cargando } = useAuth();
  if (cargando) return null;
  if (rol === "admin") return <Navigate to="/admin" />;
  if (rol === "paciente") return <Navigate to="/paciente" />;
  return <Navigate to="/login" />;
}

export default function EnrutadorApp() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PÁGINA DE LOGIN */}
        <Route path="/login" element={<PaginaLogin />} />

        {/* RUTAS ADMIN */}
        <Route
          path="/admin/*"
          element={
            <RutaProtegida rolRequerido="admin">
              <Layout tipo="admin" />
            </RutaProtegida>
          }
        >
          <Route index element={<PaginaAdminInicio />} />
          <Route path="medicos" element={<PaginaMedicos />} />
          <Route path="usuarios" element={<PaginaUsuarios />} />
          <Route path="citas" element={<PaginaCitasAdmin />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Route>

        {/* RUTAS PACIENTE */}
        <Route
          path="/paciente/*"
          element={
            <RutaProtegida rolRequerido="paciente">
              <Layout tipo="paciente" />
            </RutaProtegida>
          }
        >
          <Route index element={<PaginaPaciente />} />
          <Route path="solicitar-cita" element={<PaginaSolicitarCita />} />
          <Route path="mis-citas" element={<PaginaCitasPaciente />} />
          <Route path="perfil" element={<PaginaPerfilPaciente />} />
          <Route path="*" element={<Navigate to="/paciente" />} />
        </Route>

        {/* RAÍZ: redirige según sesión/rol */}
        <Route path="/" element={<RedirSegunRol />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

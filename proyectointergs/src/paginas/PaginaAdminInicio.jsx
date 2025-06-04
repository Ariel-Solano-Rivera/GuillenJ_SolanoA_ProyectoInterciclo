// src/paginas/PaginaAdminInicio.jsx

import React, { useMemo } from "react";
import useMedicos from "../data/useMedicos";
import useUsuarios from "../data/useUsuarios";
import { useCitasAdmin } from "../data/useCitas";

export default function PaginaAdminInicio() {
  // Hook para obtener lista de médicos
  const { medicos } = useMedicos();

  // Hook para obtener lista de usuarios
  const usuarios = useUsuarios();

  // Hook para obtener lista de todas las citas y la función confirmar (no la usamos aquí pero la necesitamos para cargar las citas)
  const { citas } = useCitasAdmin();

  // Calculamos totales de citas pendientes y confirmadas
  const { totalPendientes, totalConfirmadas } = useMemo(() => {
    let pendientes = 0;
    let confirmadas = 0;
    citas.forEach((c) => {
      if (c.estado === "pendiente") pendientes++;
      if (c.estado === "confirmada") confirmadas++;
    });
    return { totalPendientes: pendientes, totalConfirmadas: confirmadas };
  }, [citas]);

  return (
    <div style={{ padding: "1rem" }}>
      {/* ====== Bienvenida ====== */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="section-title">Panel de Administrador</h2>
        <p>
          ¡Bienvenido al sistema de gestión de citas! Aquí podrás ver de un
          vistazo las métricas más importantes de tu plataforma y acceder a las
          secciones de Médicos, Usuarios y Citas desde el menú lateral.
        </p>
        <p style={{ marginTop: "0.5rem", color: "#555" }}>
          Usa el menú para:
          <ul style={{ marginTop: "0.25rem", paddingLeft: "1.25rem" }}>
            <li>Registrar, editar o eliminar médicos.</li>
            <li>Gestionar horarios disponibles de cada médico.</li>
            <li>Promover usuarios a administradores.</li>
            <li>Ver, confirmar, editar o eliminar citas.</li>
          </ul>
        </p>
      </div>

      {/* ====== Cuadros de Estadísticas ====== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* 1) Total Médicos */}
        <div className="card" style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#1D4ED8" }}>
            {medicos.length}
          </div>
          <div style={{ marginTop: "0.5rem", color: "#1E40AF", fontWeight: "500" }}>
            Total Médicos
          </div>
        </div>

        {/* 2) Total Usuarios */}
        <div className="card" style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#047857" }}>
            {usuarios.length}
          </div>
          <div style={{ marginTop: "0.5rem", color: "#065F46", fontWeight: "500" }}>
            Total Usuarios
          </div>
        </div>

        {/* 3) Citas Pendientes */}
        <div className="card" style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#D97706" }}>
            {totalPendientes}
          </div>
          <div style={{ marginTop: "0.5rem", color: "#92400E", fontWeight: "500" }}>
            Citas Pendientes
          </div>
        </div>

        {/* 4) Citas Confirmadas */}
        <div className="card" style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#059669" }}>
            {totalConfirmadas}
          </div>
          <div style={{ marginTop: "0.5rem", color: "#047857", fontWeight: "500" }}>
            Citas Confirmadas
          </div>
        </div>
      </div>

      {/* ====== Tips Rápidos ====== */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 className="section-title">Tips Rápidos</h3>
        <ul style={{ paddingLeft: "1.25rem", color: "#444", marginTop: "0.5rem" }}>
          <li>
            Para crear un médico nuevo, ve a <strong>Médicos</strong> y completa el
            formulario con su información y especialidad.
          </li>
          <li>
            Asigna horarios a cada médico en la sección de <strong>Médicos</strong>,
            seleccionando un médico y definiendo días y horas.
          </li>
          <li>
            Revisa las citas pendientes en <strong>Citas</strong>. Desde ahí puedes
            confirmar, editar o eliminar cualquier cita.
          </li>
          <li>
            Si necesitas promocionar a un paciente a administrador, hazlo en la
            sección de <strong>Usuarios</strong>.
          </li>
        </ul>
      </div>
    </div>
  );
}

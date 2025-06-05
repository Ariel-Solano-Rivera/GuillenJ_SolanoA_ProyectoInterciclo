// src/paginas/PaginaPaciente.jsx

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../autenticacion/ContextoAutenticacion";
import { useMisCitas } from "../data/useCitas";
import useMedicos from "../data/useMedicos";

/**
 * PaginaPaciente:
 *  - Muestra un resumen para el paciente autenticado:
 *      • Estadísticas de citas pendientes y confirmadas.
 *      • Información de la próxima cita futura.
 *      • Botones de navegación rápida (solicitar cita, ver citas y perfil).
 */
export default function PaginaPaciente() {
  // 1) Obtenemos el objeto `usuario` desde el contexto de autenticación
  const { usuario } = useAuth();
  // 2) Navegación programática
  const navigate = useNavigate();

  // 3) useMisCitas: hook que retorna en tiempo real todas las citas del paciente actual
  const citas = useMisCitas();

  // 4) useMedicos: hook que carga TODA la lista de médicos en tiempo real
  //    Lo necesitamos para mostrar el nombre del médico en la próxima cita
  const { medicos } = useMedicos();

  /**
   * 5) Calcular estadísticas y determinar la próxima cita futura.
   */
  const { totalPendientes, totalConfirmadas, proximaCita } = useMemo(() => {
    let pendientes = 0;
    let confirmadas = 0;
    const ahora = new Date().getTime();
    const futuras = [];

    // Recorremos cada cita para contar estados y armar un arreglo de futuras fechas
    citas.forEach((c) => {
      if (c.estado === "pendiente") pendientes++;
      if (c.estado === "confirmada") confirmadas++;
      // Si `c.slot` existe y tiene método toDate(), verificamos si es futura
      if (c.slot && typeof c.slot.toDate === "function") {
        const ts = c.slot.toDate().getTime();
        if (ts > ahora) {
          // Agregamos timestamp y datos de la cita para ordenar luego
          futuras.push({ ...c, fechaMs: ts });
        }
      }
    });

    // Ordenamos las citas futuras por `fechaMs` ascendente y tomamos la primera
    futuras.sort((a, b) => a.fechaMs - b.fechaMs);
    const proxima = futuras.length > 0 ? futuras[0] : null;

    return {
      totalPendientes: pendientes,
      totalConfirmadas: confirmadas,
      proximaCita: proxima,
    };
  }, [citas]);

  /**
   * 6) Helper para convertir `medicoId` a nombre de médico.
   *    Busca en `medicos` y si no lo encuentra, muestra un guion.
   */
  const obtenerNombreMedico = (id) => {
    const m = medicos.find((x) => x.id === id);
    return m ? m.nombre : "—";
  };

  return (
    <div style={{ padding: "1rem" }}>
      {/* ====== Bienvenida y descripción ====== */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="section-title">
          Bienvenido, {usuario.displayName || "Paciente"}
        </h2>
        <p>
          En tu portal de paciente puedes gestionar tus citas, consultar tu
          historial y actualizar tu perfil. A continuación verás un resumen de
          tu información de citas.
        </p>
      </div>

      {/* ====== Cuadros de Estadísticas ====== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* 5a) Total de Citas Pendientes */}
        <div className="card" style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#D97706" }}>
            {totalPendientes}
          </div>
          <div style={{ marginTop: "0.5rem", color: "#92400E", fontWeight: "500" }}>
            Citas Pendientes
          </div>
        </div>

        {/* 5b) Total de Citas Confirmadas */}
        <div className="card" style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#047857" }}>
            {totalConfirmadas}
          </div>
          <div style={{ marginTop: "0.5rem", color: "#065F46", fontWeight: "500" }}>
            Citas Confirmadas
          </div>
        </div>

        {/* 5c) Información de la Próxima Cita Futura */}
        <div className="card" style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1D4ED8" }}>
            Próxima Cita
          </div>
          {proximaCita ? (
            <div style={{ marginTop: "0.5rem", color: "#444", textAlign: "left" }}>
              <p>
                <strong>Médico:</strong> {obtenerNombreMedico(proximaCita.medicoId)}
              </p>
              <p>
                <strong>Fecha:</strong> {proximaCita.fechaISO}
              </p>
              <p>
                <strong>Hora:</strong> {proximaCita.hora}
              </p>
              <p>
                <strong>Estado:</strong>{" "}
                <span
                  style={{
                    color: proximaCita.estado === "confirmada" ? "#059669" : "#D97706",
                  }}
                >
                  {proximaCita.estado}
                </span>
              </p>
            </div>
          ) : (
            <p style={{ marginTop: "0.5rem", color: "#666" }}>
              No tienes citas programadas
            </p>
          )}
        </div>
      </div>

      {/* ====== Acciones Rápidas ====== */}
      <div className="card">
        <h3 className="section-title">Acciones Rápidas</h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginTop: "0.75rem",
          }}
        >
          {/* 6a) Botón para redirigir a la página de solicitar nueva cita */}
          <button
            onClick={() => navigate("/paciente/solicitar-cita")}
            style={{
              backgroundColor: "#1D4ED8",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Solicitar nueva cita
          </button>

          {/* 6b) Botón para redirigir a la página de ver mis citas */}
          <button
            onClick={() => navigate("/paciente/mis-citas")}
            style={{
              backgroundColor: "#047857",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Ver mis citas
          </button>

          {/* 6c) Botón para redirigir a la página de perfil del paciente */}
          <button
            onClick={() => navigate("/paciente/perfil")}
            style={{
              backgroundColor: "#6B7280",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Ver/Editar mi perfil
          </button>
        </div>
      </div>
    </div>
  );
}

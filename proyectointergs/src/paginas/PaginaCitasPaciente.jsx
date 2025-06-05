// src/paginas/PaginaCitasPaciente.jsx

import React, { useState, useMemo } from "react";
import { useMisCitas } from "../data/useCitas"; // Hook para obtener las citas del paciente actual
import useMedicos from "../data/useMedicos";     // Hook para obtener lista de médicos

/**
 * PaginaCitasPaciente:
 *  - Muestra las citas del paciente autenticado.
 *  - Permite filtrar por estado y buscar por nombre de médico.
 */
export default function PaginaCitasPaciente() {
  // 1) Obtenemos el array de citas del paciente en tiempo real
  const citas = useMisCitas();

  // 2) Obtenemos lista de todos los médicos para convertir ID → nombre
  const { medicos } = useMedicos();

  // ── Estados para filtros ───────────────────────────────────────────────
  // Filtrar por estado: "todas", "pendiente" o "confirmada"
  const [estadoFilter, setEstadoFilter] = useState("todas");
  // Buscar por término: compara con nombre de médico
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * medicoPorId:
   *  Dado un ID de médico, busca en el arreglo `medicos` y devuelve su nombre.
   *  Si no lo encuentra, retorna "…".
   */
  const medicoPorId = (id) =>
    medicos.find((m) => m.id === id)?.nombre || "…";

  /**
   * filteredCitas:
   *  - Se recalcula cuando cambian citas, medicos, estadoFilter o searchTerm.
   *  - Filtra `citas` según:
   *      • Si estadoFilter != "todas", solo incluye citas cuyo estado coincide.
   *      • Si hay searchTerm, convierte a minúsculas y verifica que el nombre
   *        del médico contenga ese término.
   */
  const filteredCitas = useMemo(() => {
    return citas.filter((c) => {
      if (estadoFilter !== "todas" && c.estado !== estadoFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        return medicoPorId(c.medicoId).toLowerCase().includes(term);
      }
      return true;
    });
  }, [citas, medicos, estadoFilter, searchTerm]);

  return (
    <div>
      <h2 className="section-title">Mis citas</h2>

      {/* ── Controles de filtrado ──────────────────────────────────────────── */}
      <div className="filter-container">
        {/* Selector de estado */}
        <div className="filter-group">
          <label>Estado:</label>
          <select
            className="filter-select"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
          </select>
        </div>

        {/* Input de búsqueda por nombre de médico */}
        <div className="filter-group" style={{ flex: 1 }}>
          <label>Buscar:</label>
          <input
            type="text"
            placeholder="Buscar por médico..."
            className="filter-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── Listado de citas filtradas ─────────────────────────────────────── */}
      {filteredCitas.length > 0 ? (
        filteredCitas.map((c) => (
          <div key={c.id} className="item-card">
            {/* Detalles de cada cita */}
            <div className="item-details">
              <p>
                <strong>Médico:</strong> {medicoPorId(c.medicoId)}
              </p>
              <p>
                <strong>Especialidad:</strong> {c.especialidad || "—"}
              </p>
              <p>
                <strong>Día:</strong> {c.dia || "(no definido)"}
              </p>
              <p>
                <strong>Hora:</strong> {c.hora || "(no definido)"}
              </p>
              <p>
                <strong>Estado:</strong>{" "}
                <span
                  className={
                    c.estado === "confirmada"
                      ? "status-confirmada"
                      : "status-pendiente"
                  }
                >
                  {c.estado}
                </span>
              </p>
            </div>
            {/* No mostramos botones de edición/eliminación para el paciente */}
          </div>
        ))
      ) : (
        /* Mensaje si no hay citas que coincidan con los filtros */
        <p style={{ color: "var(--color-gris-600)" }}>
          No tienes citas que coincidan con los filtros.
        </p>
      )}
    </div>
  );
}

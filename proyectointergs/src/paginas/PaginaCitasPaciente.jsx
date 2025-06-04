// src/paginas/PaginaCitasPaciente.jsx

import React, { useState, useMemo } from "react";
import { useMisCitas } from "../data/useCitas";
import useMedicos from "../data/useMedicos";

export default function PaginaCitasPaciente() {
  const citas = useMisCitas();
  const { medicos } = useMedicos();

  const [estadoFilter, setEstadoFilter] = useState("todas");
  const [searchTerm, setSearchTerm] = useState("");

  const medicoPorId = (id) => medicos.find((m) => m.id === id)?.nombre || "…";

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

      {/* FILTROS */}
      <div className="filter-container">
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

      {/* LISTADO */}
      {filteredCitas.length > 0 ? (
        filteredCitas.map((c) => (
          <div key={c.id} className="item-card">
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
            {/* NO mostramos botones de editar/eliminar para el paciente */}
          </div>
        ))
      ) : (
        <p style={{ color: "var(--color-gris-600)" }}>
          No tienes citas que coincidan con los filtros.
        </p>
      )}
    </div>
  );
}

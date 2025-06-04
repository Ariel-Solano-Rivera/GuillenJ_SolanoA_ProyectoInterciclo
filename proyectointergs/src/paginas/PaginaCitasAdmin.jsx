// src/paginas/PaginaCitasAdmin.jsx

import React, { useState, useMemo } from "react";
import { useCitasAdmin, eliminarCita } from "../data/useCitas";
import useMedicos from "../data/useMedicos";
import useUsuarios from "../data/useUsuarios";

export default function PaginaCitasAdmin() {
  // useCitasAdmin devuelve { citas, confirmar } 
  const { citas, confirmar } = useCitasAdmin();
  const { medicos } = useMedicos();
  const usuarios = useUsuarios();

  const [estadoFilter, setEstadoFilter] = useState("todas");
  const [searchTerm, setSearchTerm] = useState("");

  const medicoPorId = (id) => medicos.find((m) => m.id === id)?.nombre || "—";
  const pacienteInfo = (id) => {
    const u = usuarios.find((x) => x.id === id);
    return u ? `${u.displayName || "(sin nombre)"} · ${u.email}` : id;
  };

  const filteredCitas = useMemo(() => {
    return citas.filter((c) => {
      if (estadoFilter !== "todas" && c.estado !== estadoFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const pac = pacienteInfo(c.pacienteUid).toLowerCase();
        const med = medicoPorId(c.medicoId).toLowerCase();
        return pac.includes(term) || med.includes(term);
      }
      return true;
    });
  }, [citas, usuarios, medicos, estadoFilter, searchTerm]);

  return (
    <div>
      <h2 className="section-title">Citas</h2>

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
            placeholder="Paciente o médico..."
            className="filter-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LISTADO DE CITAS */}
      {filteredCitas.length > 0 ? (
        filteredCitas.map((c) => (
          <div key={c.id} className="item-card">
            <div className="item-details">
              <p>
                <strong>Paciente:</strong> {pacienteInfo(c.pacienteUid)}
              </p>
              <p>
                <strong>Médico:</strong> {medicoPorId(c.medicoId)}
              </p>
              <p>
                <strong>Día:</strong> {c.dia || "(no definido)"}
              </p>
              <p>
                <strong>Hora:</strong> {c.hora || "(no definido)"}
              </p>
              <p>
                <strong>Especialidad:</strong> {c.especialidad || "—"}
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
            <div className="item-actions">
              {c.estado === "pendiente" && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => confirmar(c.id)}
                    style={{ marginRight: "0.5rem", fontSize: "0.85rem" }}
                  >
                    Confirmar
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => eliminarCita(c.id)}
                    style={{ fontSize: "0.85rem" }}
                  >
                    Eliminar
                  </button>
                </>
              )}
              {c.estado === "confirmada" && (
                <span className="text-gray-500" style={{ fontSize: "0.85rem" }}>
                  (No se puede eliminar)
                </span>
              )}
            </div>
          </div>
        ))
      ) : (
        <p style={{ color: "var(--color-gris-600)" }}>
          No hay citas que coincidan con los filtros.
        </p>
      )}
    </div>
  );
}

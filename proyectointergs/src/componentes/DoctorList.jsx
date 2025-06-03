// src/componentes/DoctorList.jsx
import React from "react";

export default function DoctorList({ medicos, onDelete }) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Especialidad</th>
            <th>Teléfono</th>
            <th style={{ textAlign: "center" }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {medicos.map((m) => (
            <tr key={m.id}>
              <td>{m.nombre}</td>
              <td>{m.especialidad}</td>
              <td>{m.telefono || "—"}</td>
              <td style={{ textAlign: "center" }}>
                <button
                  className="btn btn-danger"
                  onClick={() => onDelete(m.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {medicos.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: "1rem" }}>
                No hay médicos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

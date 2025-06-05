// src/componentes/DoctorList.jsx

import React from "react";

/**
 * DoctorList:
 *  - Recibe un arreglo `medicos` y un callback `onDelete`.
 *  - Muestra en una tabla cada médico con sus datos y un botón para eliminar.
 
 */
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
              {/* Columna Nombre: muestra m.nombre */}
              <td>{m.nombre}</td>
              {/* Columna Especialidad: muestra m.especialidad */}
              <td>{m.especialidad}</td>
              {/* Columna Teléfono: si m.telefono existe, lo muestra; si no, "—" */}
              <td>{m.telefono || "—"}</td>
              {/* Columna Acción: botón para eliminar */}
              <td style={{ textAlign: "center" }}>
                <button
                  className="btn btn-danger"
                  onClick={() => onDelete(m.id)} // Invoca callback onDelete con el id del médico
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {medicos.length === 0 && (
            <tr>
              {/* Si no hay médicos en el arreglo, mostrar fila indicándolo */}
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

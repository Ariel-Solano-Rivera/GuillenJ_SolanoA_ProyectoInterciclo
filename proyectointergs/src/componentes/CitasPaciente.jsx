// src/componentes/CitasPaciente.jsx

import React from "react";
import { useMisCitas } from "../data/useCitas";

/**
 * Componente que lista en tiempo real las citas del paciente autenticado.
 */
export default function CitasPaciente() {
  const citas = useMisCitas();

  return (
    <div>
      <h3>Mis Citas</h3>
      {citas.length === 0 ? (
        <p>No tienes citas pendientes.</p>
      ) : (
        <ul>
          {citas.map((c) => (
            <li key={c.id} style={{ marginBottom: "8px" }}>
              <strong>Fecha:</strong> {c.dia}, {c.slot.toDate().toLocaleDateString("es-ES")}
              <br />
              <strong>Hora:</strong> {c.hora}
              <br />
              <strong>Médico:</strong> {c.medicoId}
              <br />
              <strong>Especialidad:</strong> {c.especialidad}
              <br />
              <strong>Estado:</strong> {c.estado}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
  
// src/paginas/PaginaSolicitarCita.jsx

import React from "react";
import CitaForm from "../componentes/CitaForm";

/**
 * PáginaSolicitarCita:
 *  - Muestra el formulario para que el paciente solicite una nueva cita.
 *  - Utiliza el componente CitaForm, que maneja toda la lógica de selección
 *    de especialidad, médico, fecha y hora.
 */
export default function PaginaSolicitarCita() {
  return (
    <div>
      {/* Título de la página */}
      <h2 className="section-title">Solicitar cita</h2>

      {/* Card que contiene el formulario de solicitud de cita */}
      <div className="card" style={{ marginTop: "1rem" }}>
        {/* El componente CitaForm ya incluye:
            - Selección de especialidad
            - Filtrado de médicos según la especialidad seleccionada
            - Cálculo de fechas válidas según el horario del médico
            - Exclusión de horas ocupadas
            - Validaciones y envío de la cita a Firestore */}
        <CitaForm />
      </div>
    </div>
  );
}

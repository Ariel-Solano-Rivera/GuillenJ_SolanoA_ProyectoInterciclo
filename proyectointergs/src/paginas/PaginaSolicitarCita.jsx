// src/paginas/PaginaSolicitarCita.jsx
import React from "react";
import CitaForm from "../componentes/CitaForm";

export default function PaginaSolicitarCita() {
  return (
    <div>
      <h2 className="section-title">Solicitar cita</h2>
      <div className="card">
        <CitaForm />
      </div>
    </div>
  );
}

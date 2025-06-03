// src/paginas/PaginaAdminInicio.jsx
import React from "react";

export default function PaginaAdminInicio() {
  return (
    <div>
      <div className="card">
        <h2 className="section-title">Panel de Administrador</h2>
        <p style={{ color: "var(--color-gris-600)", marginBottom: "0.75rem" }}>
          Bienvenido al sistema de gestión de citas. Usa el menú lateral para navegar entre:
        </p>
        <ul style={{ paddingLeft: "1.25rem", color: "var(--color-gris-600)" }}>
          <li>Médicos</li>
          <li>Usuarios</li>
          <li>Citas</li>
        </ul>
      </div>
    </div>
  );
}

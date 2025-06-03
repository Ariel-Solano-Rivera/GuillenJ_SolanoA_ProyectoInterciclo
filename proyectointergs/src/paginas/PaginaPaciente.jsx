// src/paginas/PaginaPaciente.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function PaginaPaciente() {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="section-title">Portal Paciente</h2>
      <p style={{ color: "var(--color-gris-600)", marginBottom: "0.75rem" }}>
        Bienvenido. Usa el menú lateral para:
      </p>
      <ul style={{ paddingLeft: "1.25rem", color: "var(--color-gris-600)" }}>
        <li>
          <button
            onClick={() => navigate("/paciente/solicitar")}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-azul-principal)",
              cursor: "pointer",
              fontSize: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            • Solicitar nueva cita
          </button>
        </li>
        <li>
          <button
            onClick={() => navigate("/paciente/mis-citas")}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-azul-principal)",
              cursor: "pointer",
              fontSize: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            • Ver mis citas
          </button>
        </li>
        <li>
          <button
            onClick={() => navigate("/paciente/perfil")}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-azul-principal)",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            • Ver/Editar mi perfil
          </button>
        </li>
      </ul>
    </div>
  );
}

// src/paginas/PaginaMedicos.jsx
import React, { useState } from "react";
import useMedicos from "../data/useMedicos";
import useHorarios from "../data/useHorarios";

import DoctorForm from "../componentes/DoctorForm";
import DoctorList from "../componentes/DoctorList";
import HorarioForm from "../componentes/HorarioForm";

export default function PaginaMedicos() {
  const { medicos, crear: crearMedico, eliminar: eliminarMedico } = useMedicos();
  const [medicoSel, setMedicoSel] = useState("");
  const { horarios, crear: crearHorario, eliminar: eliminarHorario } =
    useHorarios(medicoSel);

  const handleSelectMedico = (e) => {
    setMedicoSel(e.target.value);
  };

  return (
    <div>
      {/* 1) Card: Formulario para agregar médico */}
      <div className="card">
        <h2 className="section-title">Agregar nuevo médico</h2>
        <DoctorForm onSave={(data) => crearMedico(data)} />
      </div>

      {/* 2) Card: Listado de médicos */}
      <div className="card">
        <h2 className="section-title">Listado de médicos</h2>
        <DoctorList medicos={medicos} onDelete={(id) => eliminarMedico(id)} />
      </div>

      {/* 3) Card: Seleccionar médico y mostrar/añadir horarios */}
      <div className="card">
        <h2 className="section-title">Horarios por médico</h2>
        <div className="form-group">
          <label>Selecciona médico</label>
          <select
            value={medicoSel}
            onChange={handleSelectMedico}
            className="form-group"
            style={{ padding: "0.5rem", marginTop: "0.25rem" }}
          >
            <option value="">-- Selecciona médico --</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} · {m.especialidad}
              </option>
            ))}
          </select>
        </div>

        {medicoSel && (
          <div style={{ marginTop: "1rem" }}>
            <HorarioForm onSave={(dias, slots) => crearHorario(dias, slots)} />

            <div style={{ marginTop: "1rem" }}>
              {horarios.map((h) => (
                <div
                  key={h.id}
                  className="item-card"
                  style={{ justifyContent: "space-between" }}
                >
                  <div className="item-details">
                    <p>
                      <strong>Días:</strong>{" "}
                      {h.dias
                        .map((d) => ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d])
                        .join(", ")}
                    </p>
                    <p>
                      <strong>Slots:</strong> {h.slots.join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => eliminarHorario(h.id)}
                    className="btn btn-danger"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              {horarios.length === 0 && (
                <p style={{ color: "var(--color-gris-600)" }}>
                  No hay horarios para este médico.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

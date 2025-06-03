// src/componentes/HorarioForm.jsx
import React, { useState } from "react";

const DIAS = [
  { idx: 1, label: "Lunes" },
  { idx: 2, label: "Martes" },
  { idx: 3, label: "Miércoles" },
  { idx: 4, label: "Jueves" },
  { idx: 5, label: "Viernes" },
  { idx: 6, label: "Sábado" },
  { idx: 0, label: "Domingo" },
];

export default function HorarioForm({ onSave }) {
  const [dias, setDias] = useState([]);
  const [slots, setSlots] = useState("");

  const toggleDia = (d) =>
    setDias((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    const arrSlots = slots
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!dias.length || !arrSlots.length) return;
    onSave(dias, arrSlots);
    setDias([]);
    setSlots("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group" style={{ marginBottom: "0.5rem" }}>
        <label>Días</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {DIAS.map((d) => (
            <label key={d.idx} style={{ fontSize: "0.9rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={dias.includes(d.idx)}
                onChange={() => toggleDia(d.idx)}
                style={{ marginRight: "0.25rem" }}
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Horas (separadas por coma)</label>
        <textarea
          value={slots}
          onChange={(e) => setSlots(e.target.value)}
          placeholder="Ej: 09:00,09:30,10:00"
          required
        ></textarea>
      </div>

      <button type="submit" className="btn btn-primary">
        Guardar horario
      </button>
    </form>
  );
}

// src/componentes/HorarioForm.jsx

import React, { useState } from "react";

/**
 * DIAS:
 *  - Array con índices de días de la semana (0=domingo, 1=lunes, … 6=sábado).
 *  - Cada objeto tiene:
 *      • idx: índice de día (número)
 *      • label: nombre a mostrar (string)
 */
const DIAS = [
  { idx: 1, label: "Lunes" },
  { idx: 2, label: "Martes" },
  { idx: 3, label: "Miércoles" },
  { idx: 4, label: "Jueves" },
  { idx: 5, label: "Viernes" },
  { idx: 6, label: "Sábado" },
  { idx: 0, label: "Domingo" },
];

/**
 * HorarioForm:
 *  - Formulario para definir los días de atención de un médico y sus franjas horarias.
 *  - Recibe prop `onSave(diasArray, slotsArray)` que se llama al enviar el formulario.
 *
 
 */
export default function HorarioForm({ onSave }) {
  // Estado local para los índices de días seleccionados (p. ej. [1,3,5])
  const [dias, setDias] = useState([]);
  // Estado local para la cadena de texto con horas separadas por comas
  const [slots, setSlots] = useState("");

  /**
   * toggleDia(d):
   *  - Agrega o quita un índice de día del arreglo `dias`.
   *  - Si `d` ya estaba dentro de `dias`, lo elimina; en caso contrario, lo agrega.
   */
  const toggleDia = (d) =>
    setDias((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  /**
   * handleSubmit:
   *  - Se ejecuta al enviar el formulario.
   *  - Evita la recarga de página con e.preventDefault().
   *  - Convierte `slots` (string con comas) en un arreglo `arrSlots`:
   *      • split(",") → array de strings potencialmente con espacios
   *      • map(s => s.trim()) → quita espacios al inicio/fin
   *      • filter(Boolean) → elimina elementos vacíos
   *  - Si no hay ningún día seleccionado o no hay ninguna hora válida, no hace nada.
   *  - Llama a onSave(dias, arrSlots) para que el componente padre procese la información.
   *  - Finalmente, resetea ambos estados a valores vacíos.
   */
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
      {/* ── Selección de Días ───────────────────────────────────────── */}
      <div className="form-group" style={{ marginBottom: "0.5rem" }}>
        <label>Días</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {DIAS.map((d) => (
            <label
              key={d.idx}
              style={{ fontSize: "0.9rem", cursor: "pointer" }}
            >
              {/* Checkbox para cada día */}
              <input
                type="checkbox"
                checked={dias.includes(d.idx)}        // Marcado si `d.idx` está en el estado `dias`
                onChange={() => toggleDia(d.idx)}     // Alterna el índice en `dias`
                style={{ marginRight: "0.25rem" }}
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      {/* ── Campo para ingresar horas separadas por comas ───────────── */}
      <div className="form-group">
        <label>Horas (separadas por coma)</label>
        <textarea
          value={slots}                       // Controlado por el estado `slots`
          onChange={(e) => setSlots(e.target.value)} // Actualiza `slots` con el texto del textarea
          placeholder="Ej: 09:00,09:30,10:00"
          required
        ></textarea>
      </div>

      {/* ── Botón para enviar el formulario ──────────────────────────── */}
      <button type="submit" className="btn btn-primary">
        Guardar horario
      </button>
    </form>
  );
}

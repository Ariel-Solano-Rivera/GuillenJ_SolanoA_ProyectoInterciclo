// src/componentes/DoctorForm.jsx

import React, { useState } from "react";

/**
 * DoctorForm:
 *  - Formulario para crear o editar un médico.
 *  
 */
export default function DoctorForm({ onSave }) {
  // ── Estado local para almacenar los valores de los inputs ──
  // f: { nombre, especialidad, telefono }
  const [f, setF] = useState({ nombre: "", especialidad: "", telefono: "" });

  /**
   * handleChange:
   *  - Se dispara cuando cambia cualquier input.
   *  - Actualiza el estado `f` sobrescribiendo solo la propiedad cuyo nombre coincide.
   *
   * e.target.name  → cadena "nombre" o "especialidad" o "telefono"
   * e.target.value → valor actual del input
   */
  const handleChange = (e) => {
    setF({ ...f, [e.target.name]: e.target.value });
  };

  /**
   * handleSubmit:
   *  - Se dispara al hacer submit en el <form>.
   *  - Evita el comportamiento por defecto (recarga de la página).
   *  - Llama a `onSave(f)`, pasando los datos recogidos.
   *  - Luego resetea el formulario vaciando el estado `f`.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(" [DoctorForm] handleSubmit → datos enviados:", f);
    onSave(f); 
    setF({ nombre: "", especialidad: "", telefono: "" });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Campo Nombre ─────────────────────────────────────────── */}
      <div className="form-group">
        <label>Nombre</label>
        <input
          name="nombre"                  // atributo name coincide con la propiedad en estado f
          value={f.nombre}               // controlado por f.nombre
          onChange={handleChange}        // actualiza f cuando cambia
          placeholder="Nombre del médico"
          required                       // campo obligatorio
        />
      </div>

      {/* ── Campo Especialidad ───────────────────────────────────── */}
      <div className="form-group">
        <label>Especialidad</label>
        <input
          name="especialidad"            // atributo name coincide con f.especialidad
          value={f.especialidad}         // controlado por f.especialidad
          onChange={handleChange}        // actualiza f cuando cambia
          placeholder="Especialidad (ej. Cardiología)"
          required                       // campo obligatorio
        />
      </div>

      {/* ── Campo Teléfono ───────────────────────────────────────── */}
      <div className="form-group">
        <label>Teléfono</label>
        <input
          name="telefono"                // atributo name coincide con f.telefono
          value={f.telefono}             // controlado por f.telefono
          onChange={handleChange}        // actualiza f cuando cambia
          placeholder="Opcional: número de contacto"
        />
      </div>

      {/* ── Botón Guardar ────────────────────────────────────────── */}
      <button type="submit" className="btn btn-primary">
        Guardar médico
      </button>
    </form>
  );
}

// src/componentes/DoctorForm.jsx
import React, { useState } from "react";

export default function DoctorForm({ onSave }) {
  const [f, setF] = useState({ nombre: "", especialidad: "", telefono: "" });

  const handleChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(f);
    setF({ nombre: "", especialidad: "", telefono: "" });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Nombre</label>
        <input
          name="nombre"
          value={f.nombre}
          onChange={handleChange}
          placeholder="Nombre del médico"
          required
        />
      </div>

      <div className="form-group">
        <label>Especialidad</label>
        <input
          name="especialidad"
          value={f.especialidad}
          onChange={handleChange}
          placeholder="Especialidad (ej. Cardiología)"
          required
        />
      </div>

      <div className="form-group">
        <label>Teléfono</label>
        <input
          name="telefono"
          value={f.telefono}
          onChange={handleChange}
          placeholder="Opcional: número de contacto"
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Guardar médico
      </button>
    </form>
  );
}

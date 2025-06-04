// src/componentes/DoctorForm.jsx
import React, { useState } from "react";

export default function DoctorForm({ onSave }) {
  // Estado local para los campos del formulario
  const [f, setF] = useState({ nombre: "", especialidad: "", telefono: "" });

  // Cada vez que cambias un campo, actualizamos f
  const handleChange = (e) => {
    setF({ ...f, [e.target.name]: e.target.value });
  };

  // Al hacer submit llamamos a onSave
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(" [DoctorForm] handleSubmit → datos enviados:", f);
    onSave(f);                  // <–– Aquí es donde le pasamos { nombre, especialidad, telefono }
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

import { useState } from "react";

export default function DoctorForm({ onSave }) {
  const [f, setF] = useState({ nombre: "", especialidad: "", telefono: "" });

  const handle = (e) => setF({ ...f, [e.target.name]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    onSave(f);
    setF({ nombre: "", especialidad: "", telefono: "" });
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <input name="nombre" placeholder="Nombre"
             className="input" onChange={handle} value={f.nombre} required />
      <input name="especialidad" placeholder="Especialidad"
             className="input" onChange={handle} value={f.especialidad} required />
      <input name="telefono" placeholder="Teléfono"
             className="input" onChange={handle} value={f.telefono} />
      <button className="btn">Guardar médico</button>
    </form>
  );
}

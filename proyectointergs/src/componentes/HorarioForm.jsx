import { useState } from "react";

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

  const submit = (e) => {
    e.preventDefault();
    const arrSlots = slots.split(",").map((s) => s.trim()).filter(Boolean);
    if (!dias.length || !arrSlots.length) return;
    onSave(dias, arrSlots);
    setDias([]);
    setSlots("");
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {DIAS.map((d) => (
          <label key={d.idx} className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={dias.includes(d.idx)}
              onChange={() => toggleDia(d.idx)}
            />
            {d.label}
          </label>
        ))}
      </div>

      <input
        placeholder="09:00, 09:30, 10:00"
        className="input"
        value={slots}
        onChange={(e) => setSlots(e.target.value)}
        required
      />
      <button className="btn">Guardar horario</button>
    </form>
  );
}

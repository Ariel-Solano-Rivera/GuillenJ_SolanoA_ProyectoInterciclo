import { useState } from "react";
import useMedicos from "../data/useMedicos";
import useHorarios from "../data/useHorarios";
import { crearCita } from "../data/useCitas";
import { useAuth } from "../autenticacion/ContextoAutenticacion";

export default function CitaForm() {
  const { usuario } = useAuth();
  const { medicos } = useMedicos();

  const [medicoId, setMedicoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  const { horarios } = useHorarios(medicoId);

  const dayIdx = fecha ? new Date(fecha).getDay() : null;
  const slotsDisponibles =
    horarios
      .filter((h) => h.dias.includes(dayIdx))
      .flatMap((h) => h.slots) || [];

  const reservar = async (e) => {
    e.preventDefault();
    await crearCita({ pacienteUid: usuario.uid, medicoId, fechaISO: fecha, hora });
    setMedicoId(""); setFecha(""); setHora("");
    alert("Cita solicitada. Espera confirmación.");
  };

  return (
    <form onSubmit={reservar} className="space-y-3">
      <select value={medicoId} onChange={(e)=>setMedicoId(e.target.value)} className="input" required>
        <option value="">-- Selecciona médico --</option>
        {medicos.map(m=>(
          <option key={m.id} value={m.id}>
            {m.nombre} · {m.especialidad}
          </option>
        ))}
      </select>

      <input type="date" className="input"
             value={fecha} onChange={(e)=>setFecha(e.target.value)} required />

      <select value={hora} onChange={(e)=>setHora(e.target.value)}
              className="input" required>
        <option value="">-- Hora --</option>
        {slotsDisponibles.map(s=><option key={s}>{s}</option>)}
      </select>

      <button className="btn">Reservar cita</button>
    </form>
  );
}

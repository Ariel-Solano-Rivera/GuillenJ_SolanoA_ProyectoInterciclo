import { useAuth } from "../autenticacion/ContextoAutenticacion";
import { useCitasPaciente } from "../data/useCitas";
import useMedicos from "../data/useMedicos";

export default function CitasPaciente() {
  const { usuario } = useAuth();
  const citas = useCitasPaciente(usuario.uid);
  const { medicos } = useMedicos();
  const medicoPorId = id => medicos.find(m=>m.id===id)?.nombre || "...";

  return (
    <ul className="space-y-2">
      {citas.map(c=>(
        <li key={c.id} className="border p-3 rounded">
          <p><b>Médico:</b> {medicoPorId(c.medicoId)}</p>
          <p><b>Fecha:</b> {c.slot.toDate().toLocaleString()}</p>
          <p><b>Estado:</b> {c.estado}</p>
        </li>
      ))}
    </ul>
  );
}

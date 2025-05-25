import { useCitasAdmin } from "../data/useCitas";
import useMedicos from "../data/useMedicos";
import useUsuarios from "../data/useUsuarios";

export default function CitasAdmin() {
  const { citas, confirmar } = useCitasAdmin();
  const { medicos }  = useMedicos();
  const   usuarios   = useUsuarios();

  const medicoPorId   = id => medicos.find(m=>m.id===id)?.nombre || "...";
  const pacienteInfo  = id => {
    const u = usuarios.find(x=>x.id===id);
    return u ? `${u.displayName || "(sin nombre)"} · ${u.email}` : id;
  };

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left">
          <th>Paciente</th><th>Médico</th><th>Fecha</th><th>Estado</th><th></th>
        </tr>
      </thead>
      <tbody>
        {citas.map(c=>(
          <tr key={c.id} className="border-t">
            <td>{pacienteInfo(c.pacienteUid)}</td>
            <td>{medicoPorId(c.medicoId)}</td>
            <td>{c.slot.toDate().toLocaleString()}</td>
            <td>{c.estado}</td>
            <td>
              {c.estado==="pendiente" &&
                <button onClick={()=>confirmar(c.id)} className="btn-xs">Confirmar</button>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

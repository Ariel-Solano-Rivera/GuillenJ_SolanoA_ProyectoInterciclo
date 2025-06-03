// src/componentes/CitasPaciente.jsx
import { useCitasPaciente } from '../data/useCitas';
import useMedicos from '../data/useMedicos';

export default function CitasPaciente() {
  const { medicos } = useMedicos();
  const citas = useCitasPaciente(); // devuelve las citas del paciente actual, usa el uid internamente

  const medicoPorId = (id) => medicos.find((m) => m.id === id)?.nombre || '…';

  return (
    <ul className="space-y-2">
      {citas.map((c) => (
        <li key={c.id} className="border p-3 rounded">
          <p>
            <b>Médico:</b> {medicoPorId(c.medicoId)}
          </p>
          <p>
            <b>Fecha:</b> {c.slot.toDate().toLocaleString()}
          </p>
          <p>
            <b>Estado:</b>{' '}
            <span
              className={c.estado === 'confirmada' ? 'text-green-600' : 'text-yellow-600'}
            >
              {c.estado}
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}

// src/componentes/CitasAdmin.jsx

import { useCitasAdmin } from '../data/useCitas'; // Hook que retorna lista de citas y función para confirmar
import useMedicos from '../data/useMedicos';       // Hook que retorna lista de médicos
import useUsuarios from '../data/useUsuarios';     // Hook que retorna lista de usuarios

/**
 * CitasAdmin:
 *  - Muestra en una tabla todas las citas (para el administrador).
 *  - Permite confirmar aquellas que estén en estado "pendiente".
 */
export default function CitasAdmin() {
  // 1) Obtenemos las citas y la función para confirmar una cita
  //    • citas: arreglo [{ id, pacienteUid, medicoId, slot: Timestamp, estado }, …]
  //    • confirmar: función que recibe un ID de cita y la actualiza a "confirmada"
  const { citas, confirmar } = useCitasAdmin();

  // 2) Obtenemos lista de todos los médicos ({ id, nombre, especialidad, … })
  const { medicos } = useMedicos();

  // 3) Obtenemos lista de todos los usuarios ({ id, displayName, email, role, … })
  const usuarios = useUsuarios();

  /**
   * medicoPorId:
   *  Dado un ID de médico, busca en el arreglo de medicos y regresa su nombre.
   *  Si no lo encuentra, retorna '…' como marcador.
   */
  const medicoPorId = (id) =>
    medicos.find((m) => m.id === id)?.nombre || '…';

  /**
   * pacienteInfo:
   *  Dado un ID de paciente (pacienteUid), busca en el arreglo de usuarios.
   *  Si lo encuentra, retorna "Nombre · Email"; si no, retorna el mismo ID.
   */
  const pacienteInfo = (id) => {
    const u = usuarios.find((x) => x.id === id);
    return u ? `${u.displayName || '(sin nombre)'} · ${u.email}` : id;
  };

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left">
          <th>Paciente</th>
          <th>Médico</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th></th> {/* Columna para el botón “Confirmar” */}
        </tr>
      </thead>
      <tbody>
        {citas.map((c) => (
          <tr key={c.id} className="border-t">
            {/* Columna Paciente: muestra nombre y correo */}
            <td>{pacienteInfo(c.pacienteUid)}</td>

            {/* Columna Médico: muestra nombre del médico */}
            <td>{medicoPorId(c.medicoId)}</td>

            {/* Columna Fecha: convierte el Timestamp `c.slot` a objeto Date y lo formatea */}
            <td>{c.slot.toDate().toLocaleString()}</td>

            {/* Columna Estado: texto verde si “confirmada”, amarillo si “pendiente” */}
            <td>
              <span
                className={
                  c.estado === 'confirmada'
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }
              >
                {c.estado}
              </span>
            </td>

            {/* Columna Acción: solo muestra botón si el estado es “pendiente” */}
            <td>
              {c.estado === 'pendiente' && (
                <button
                  onClick={() => confirmar(c.id)}             // Invoca la función confirmar con el ID de la cita
                  className="btn-xs bg-green-600 text-white"  // Estilos: pequeño botón verde
                >
                  Confirmar
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

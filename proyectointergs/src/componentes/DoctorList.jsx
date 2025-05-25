export default function DoctorList({ medicos }) {
  return (
    <table className="w-full text-sm">
      <thead><tr><th>Nombre</th><th>Especialidad</th><th>Teléfono</th></tr></thead>
      <tbody>
        {medicos.map(m=>(
          <tr key={m.id} className="border-t">
            <td>{m.nombre}</td><td>{m.especialidad}</td><td>{m.telefono}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

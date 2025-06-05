// src/componentes/CitasPaciente.jsx

import React from "react";
import { useMisCitas } from "../data/useCitas";

/**
 * CitasPaciente:
 *  - Lista en tiempo real las citas asociadas al paciente autenticado.
 *  - Utiliza el hook useMisCitas para obtener el arreglo de citas desde Firestore.
 */
export default function CitasPaciente() {
  // 1) Obtenemos la lista de citas del paciente actual
  //    • useMisCitas() suscribe al paciente a las citas donde pacienteUid == su UID
  //    • Devuelve un array de objetos { id, pacienteUid, medicoId, slot: Timestamp, dia, hora, especialidad, estado, … }
  const citas = useMisCitas();

  return (
    <div>
      <h3>Mis Citas</h3>

      {/* 
        2) Si no hay citas, mostramos un mensaje indicándolo.
            Esto cubre tanto 'pendientes' como 'confirmadas', todo lo que devuelve el hook.
      */}
      {citas.length === 0 ? (
        <p>No tienes citas pendientes.</p>
      ) : (
        <ul>
          {citas.map((c) => (
            <li key={c.id} style={{ marginBottom: "8px" }}>
              {/* 
                3) Mostramos cada campo relevante de la cita:  
                  • Fecha: usamos c.dia (string) y c.slot (Timestamp convertido a fecha local)  
                  • Hora  
                  • Médico (por simplicidad, aquí se muestra el ID; idealmente se reemplazaría por nombre)  
                  • Especialidad  
                  • Estado (pendiente o confirmada) 
              */}
              <strong>Fecha:</strong> {c.dia},{" "}
              {c.slot.toDate().toLocaleDateString("es-ES")}
              <br />
              <strong>Hora:</strong> {c.hora}
              <br />
              <strong>Médico:</strong> {c.medicoId}
              <br />
              <strong>Especialidad:</strong> {c.especialidad}
              <br />
              <strong>Estado:</strong> {c.estado}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

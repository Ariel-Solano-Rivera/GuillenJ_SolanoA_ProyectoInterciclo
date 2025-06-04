// src/componentes/CitaForm.jsx

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../autenticacion/ContextoAutenticacion";
import { crearCita } from "../data/useCitas";
import useEspecialidades from "../data/useEspecialidades";
import useMedicos from "../data/useMedicos";
import useHorarios from "../data/useHorarios";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../api/firebase";

/**
 * Formulario para que el paciente solicite una cita.
 * - Trae especialidades en tiempo real.
 * - Trae médicos filtrados por el nombre de especialidad.
 * - Trae horarios filtrados por el médico seleccionado.
 * - Excluye horas ya ocupadas (confirmadas) para ese médico en esa fecha.
 * - Si no hay horas para el día elegido, muestra un mensaje.
 */
export default function CitaForm({ onCitaGuardada }) {
  const { usuario } = useAuth();

  // Estados del formulario
  const [especialidadSel, setEspecialidadSel] = useState("");
  const [medicoSel, setMedicoSel] = useState("");
  const [fechaSel, setFechaSel] = useState("");
  const [horaSel, setHoraSel] = useState("");
  const [error, setError] = useState("");

  // Hooks a Firestore
  const especialidades = useEspecialidades(); // [{ id, name }]
  const { medicos } = useMedicos(especialidadSel); // lista de médicos filtrados por nombre de especialidad
  const { horarios } = useHorarios(medicoSel); // horarios del médico seleccionado

  // Estado para las horas ya confirmadas (ocupadas) en base a medicoSel + fechaSel
  const [takenSlots, setTakenSlots] = useState([]);

  // Cuando cambia medicoSel o fechaSel, recargo las horas confirmadas de Firestore
  useEffect(() => {
    if (!medicoSel || !fechaSel) {
      setTakenSlots([]);
      return;
    }
    const cargarTakenSlots = async () => {
      try {
        const q = query(
          collection(db, "citas"),
          where("medicoId", "==", medicoSel),
          where("fechaISO", "==", fechaSel),
          where("estado", "==", "confirmada")
        );
        const snap = await getDocs(q);
        const horasOcupadas = snap.docs.map((d) => d.data().hora);
        setTakenSlots(horasOcupadas);
      } catch (err) {
        console.error("Error cargando horas ocupadas:", err);
        setTakenSlots([]);
      }
    };
    cargarTakenSlots();
  }, [medicoSel, fechaSel]);

  // 1) Calcular “días disponibles” en los próximos 30 días según el array de horarios
  //    (usamos new Date(año, mesIndex, día) para evitar desplazamientos de zona horaria)
  const validDates = useMemo(() => {
    if (!horarios || horarios.length === 0) return [];

    // Recojo en un Set todos los índices de día de la semana en que el médico trabaja
    const diasTrabajo = new Set();
    horarios.forEach((h) => {
      if (Array.isArray(h.dias)) {
        h.dias.forEach((d) => diasTrabajo.add(d));
      }
    });
    if (diasTrabajo.size === 0) return [];

    const arrFechas = [];
    const hoy = new Date();
    for (let i = 0; i < 30; i++) {
      // Creo un objeto Date ajustado a las componentes locales
      const fechaActual = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
      const indice = fechaActual.getDay(); // 0=domingo,1=lunes,...6=sábado
      if (diasTrabajo.has(indice)) {
        // Formato YYYY-MM-DD para el input type="date"
        const yyyy = fechaActual.getFullYear();
        const mm = String(fechaActual.getMonth() + 1).padStart(2, "0"); // mesIndex +1
        const dd = String(fechaActual.getDate()).padStart(2, "0");
        arrFechas.push(`${yyyy}-${mm}-${dd}`);
      }
    }
    return arrFechas;
  }, [horarios]);

  // 2) Calcular “horas disponibles” para la fecha elegida, excluyendo las tomadas
  const horasDisponibles = useMemo(() => {
    if (!horarios || horarios.length === 0 || !fechaSel) return [];

    // Descompongo la fechaSel "YYYY-MM-DD" para crear un Date local
    const [yyyy, mm, dd] = fechaSel.split("-").map((str) => Number(str));
    const fechaObj = new Date(yyyy, mm - 1, dd);
    const diaIdx = fechaObj.getDay(); // índice del día de la semana

    // Busco el objeto de horario que incluya ese día (h.dias contiene diaIdx)
    const horarioParaDia = horarios.find(
      (h) => Array.isArray(h.dias) && h.dias.includes(diaIdx)
    );
    if (!horarioParaDia || !Array.isArray(horarioParaDia.slots)) return [];

    // De los slots de ese día, excluyo los que estén en takenSlots
    return horarioParaDia.slots.filter((h) => !takenSlots.includes(h));
  }, [horarios, fechaSel, takenSlots]);

  // 3) Manejar envío del formulario
  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!especialidadSel) {
      setError("Debe seleccionar una especialidad.");
      return;
    }
    if (!medicoSel) {
      setError("Debe seleccionar un médico.");
      return;
    }
    if (!fechaSel) {
      setError("Debe seleccionar una fecha válida.");
      return;
    }
    if (!horaSel) {
      setError("Debe seleccionar una hora válida.");
      return;
    }
    if (!usuario || !usuario.uid) {
      setError("No se detectó usuario autenticado.");
      return;
    }

    // Verifico de nuevo que la hora no esté en takenSlots
    if (takenSlots.includes(horaSel)) {
      setError("Lo siento, esa hora ya está ocupada. Elige otro horario.");
      return;
    }

    try {
      await crearCita({
        pacienteUid: usuario.uid,
        medicoId: medicoSel,
        especialidad: especialidadSel,
        fechaISO: fechaSel,
        hora: horaSel,
      });
      if (onCitaGuardada) onCitaGuardada();
      // Limpio el formulario
      setEspecialidadSel("");
      setMedicoSel("");
      setFechaSel("");
      setHoraSel("");
      alert("Cita guardada correctamente.");
    } catch (err) {
      console.error("Error guardando cita:", err);
      setError(err.message || "Ocurrió un error al guardar la cita. Intenta de nuevo.");
    }
  };

  return (
    <form onSubmit={handleGuardar} style={{ maxWidth: "400px", margin: "auto" }}>
      <h3>Solicitar cita</h3>

      {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

      {/* 1) Selección de Especialidad */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Especialidad:
          <select
            value={especialidadSel}
            onChange={(e) => {
              setEspecialidadSel(e.target.value);
              setMedicoSel("");
              setFechaSel("");
              setHoraSel("");
            }}
          >
            <option value="">-- Seleccione --</option>
            {especialidades.map((esp) => (
              <option key={esp.id} value={esp.name}>
                {esp.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 2) Selección de Médico */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Médico:
          <select
            value={medicoSel}
            onChange={(e) => {
              setMedicoSel(e.target.value);
              setFechaSel("");
              setHoraSel("");
            }}
            disabled={!especialidadSel}
          >
            <option value="">-- Seleccione --</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 3) Selección de Fecha */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Fecha:
          <input
            type="date"
            value={fechaSel}
            onChange={(e) => {
              setFechaSel(e.target.value);
              setHoraSel("");
            }}
            // Usamos validDates para limitar el rango y el datalist
            min={validDates.length > 0 ? validDates[0] : undefined}
            max={validDates.length > 0 ? validDates[validDates.length - 1] : undefined}
            disabled={!medicoSel}
            list="fechasDisponibles"
          />
          <datalist id="fechasDisponibles">
            {validDates.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </label>
      </div>

      {/* 4) Selección de Hora */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Hora:
          <select
            value={horaSel}
            onChange={(e) => setHoraSel(e.target.value)}
            disabled={!fechaSel}
          >
            <option value="">-- Seleccione --</option>
            {horasDisponibles.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
        {fechaSel && horasDisponibles.length === 0 && (
          <div style={{ color: "orange", marginTop: "4px" }}>
            No hay horas disponibles para esa fecha.
          </div>
        )}
      </div>

      {/* 5) Botones Guardar / Cancelar */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button type="submit">Guardar Cita</button>
        <button
          type="button"
          onClick={() => {
            setEspecialidadSel("");
            setMedicoSel("");
            setFechaSel("");
            setHoraSel("");
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

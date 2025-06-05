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
 * CitaForm:
 *  - Permite al paciente solicitar una nueva cita.
 *  - Carga especialidades, médicos y horarios según las selecciones.
 *  - Bloquea cualquier hora que ya exista en Firestore (sin importar estado)
 *    para ese médico y esa fecha, de modo que no pueda repetirse.
 */
export default function CitaForm({ onCitaGuardada }) {
  const { usuario } = useAuth();

  // ── Estados locales para el formulario ──
  const [especialidadSel, setEspecialidadSel] = useState(""); // especialidad elegida
  const [medicoSel, setMedicoSel] = useState("");             // ID del médico elegido
  const [fechaSel, setFechaSel] = useState("");               // fecha en "YYYY-MM-DD"
  const [horaSel, setHoraSel] = useState("");                 // hora en "HH:MM"
  const [error, setError] = useState("");                     // mensaje de error

  // ── Datos en tiempo real de Firestore ──
  const especialidades = useEspecialidades();
  const { medicos } = useMedicos(especialidadSel);
  const { horarios } = useHorarios(medicoSel);

  // ── Estado para horas ya registradas (cualquier estado) ──
  const [takenSlots, setTakenSlots] = useState([]);

  /**
   * Cada vez que cambian medicoSel o fechaSel:
   *  1) Consultamos todas las citas para ese médico y esa fecha en Firestore.
   *  2) Sin filtrar por estado, recogemos todas las horas que ya existen.
   *  3) Así nos aseguramos de bloquear tanto pendientes como confirmadas.
   */
  useEffect(() => {
    if (!medicoSel || !fechaSel) {
      setTakenSlots([]);
      return;
    }

    const cargarTakenSlots = async () => {
      try {
        // 1) Consulta todas las citas que coincidan en médico + fecha
        const q = query(
          collection(db, "citas"),
          where("medicoId", "==", medicoSel),
          where("fechaISO", "==", fechaSel)
        );
        const snapshot = await getDocs(q);

        // 2) Extraemos todas las horas sin importar el estado
        const horasOcupadas = snapshot.docs.map((docSnap) => docSnap.data().hora);

        // 3) Eliminamos duplicados
        const horasUnicas = Array.from(new Set(horasOcupadas));
        setTakenSlots(horasUnicas);
      } catch (err) {
        console.error("Error cargando horas ocupadas:", err);
        setTakenSlots([]);
      }
    };

    cargarTakenSlots();
  }, [medicoSel, fechaSel]);

  /**
   * validDates:
   *  - Calcula las próximas 30 fechas en las que el médico atiende.
   *  - Mapea el campo `horarios` (días de la semana + slots) para generar "YYYY-MM-DD".
   */
  const validDates = useMemo(() => {
    if (!horarios || horarios.length === 0) return [];

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
      const fechaActual = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
      const idx = fechaActual.getDay(); // 0 = domingo, …, 6 = sábado
      if (diasTrabajo.has(idx)) {
        const y = fechaActual.getFullYear();
        const m = String(fechaActual.getMonth() + 1).padStart(2, "0");
        const d = String(fechaActual.getDate()).padStart(2, "0");
        arrFechas.push(`${y}-${m}-${d}`);
      }
    }
    return arrFechas;
  }, [horarios]);

  /**
   * horasDisponibles:
   *  - Para la fechaSel, buscamos el objeto `horario` que cubra ese día (0–6).
   *  - Filtramos sus `slots` excluyendo los que estén en takenSlots.
   */
  const horasDisponibles = useMemo(() => {
    if (!horarios || horarios.length === 0 || !fechaSel) return [];

    const [y, m, d] = fechaSel.split("-").map(Number);
    const fechaObj = new Date(y, m - 1, d);
    const idx = fechaObj.getDay();

    const objHorario = horarios.find((h) => Array.isArray(h.dias) && h.dias.includes(idx));
    if (!objHorario || !Array.isArray(objHorario.slots)) return [];

    return objHorario.slots.filter((h) => !takenSlots.includes(h));
  }, [horarios, fechaSel, takenSlots]);

  /**
   * handleGuardar:
   *  - Valida que existan especialidad, médico, fecha y hora.
   *  - Verifica que horaSel no esté en takenSlots (cualquier cita existente).
   *  - Si todo OK, crea la cita con estado "pendiente".
   */
  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");

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

    // Bloquear si ya existe cualquier cita (sin importar su estado) en esa hora
    if (takenSlots.includes(horaSel)) {
      setError(
        "Lo siento, esa hora ya está ocupada. Elige otro horario o elimina la cita existente."
      );
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
      // Limpiar formulario
      setEspecialidadSel("");
      setMedicoSel("");
      setFechaSel("");
      setHoraSel("");
      alert("Cita guardada correctamente.");
    } catch (err) {
      console.error("Error guardando cita:", err);
      setError(
        err.message || "Ocurrió un error al guardar la cita. Intenta de nuevo."
      );
    }
  };

  // ── Renderizado del formulario ─────────────────────────────────────
  return (
    <form onSubmit={handleGuardar} style={{ maxWidth: "400px", margin: "auto" }}>
      <h3>Solicitar cita</h3>

      {/* Mensaje de error si existe */}
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

      {/* 5) Botones: Guardar y Cancelar */}
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

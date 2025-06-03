// src/componentes/CitaForm.jsx
import React, { useState } from "react";
import { useAuth } from "../autenticacion/ContextoAutenticacion";
import useMedicos from "../data/useMedicos";
import useHorarios from "../data/useHorarios";
import { crearCita } from "../data/useCitas";

export default function CitaForm() {
  const { usuario } = useAuth();
  const { medicos } = useMedicos();

  const [medicoId, setMedicoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  const { horarios } = useHorarios(medicoId);

  const dayIdx = fecha ? new Date(fecha).getDay() : null;

  const slotsDisponibles = Array.isArray(horarios)
    ? horarios
        .filter((h) => h.dias.includes(dayIdx))
        .flatMap((h) => h.slots)
    : [];

  const reservar = async (e) => {
    e.preventDefault();
    if (!medicoId || !fecha || !hora) {
      alert("Completa todos los campos");
      return;
    }
    try {
      await crearCita({
        pacienteUid: usuario.uid,
        medicoId,
        fechaISO: fecha,
        hora,
      });
      setMedicoId("");
      setFecha("");
      setHora("");
      alert("Cita solicitada. Espera confirmación.");
    } catch (err) {
      console.error("Error creando cita:", err);
      alert("No se pudo solicitar la cita");
    }
  };

  return (
    <form onSubmit={reservar}>
      <div className="form-group">
        <label>Médico</label>
        <select
          value={medicoId}
          onChange={(e) => setMedicoId(e.target.value)}
          required
        >
          <option value="">-- Selecciona médico --</option>
          {medicos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre} · {m.especialidad}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Hora</label>
        <select
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          required
        >
          <option value="">-- Selecciona hora --</option>
          {slotsDisponibles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
          Guardar
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ flex: 1 }}
          onClick={() => {
            setMedicoId("");
            setFecha("");
            setHora("");
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

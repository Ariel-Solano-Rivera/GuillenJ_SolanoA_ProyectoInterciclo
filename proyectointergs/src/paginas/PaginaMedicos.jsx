// src/paginas/PaginaMedicos.jsx

import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "../api/firebase";

import useMedicos from "../data/useMedicos";
import useHorarios from "../data/useHorarios";
import useEspecialidades from "../data/useEspecialidades";

import DoctorForm from "../componentes/DoctorForm";
import DoctorList from "../componentes/DoctorList";
import HorarioForm from "../componentes/HorarioForm";

export default function PaginaMedicos() {
  // 1) Traer todas las especialidades (para el dropdown)
  const especialidades = useEspecialidades(); // [{ id, name }, ...]

  // 2) Estados locales para la especialidad y el médico seleccionado
  const [especialidadSel, setEspecialidadSel] = useState("");
  const [medicoSel, setMedicoSel] = useState("");

  // 3) Hook para traer médicos filtrados por nombre de especialidad
  //    (pasa null si no hay especialidad; de ese modo trae todos)
  const { medicos, crear: crearMedico, eliminar: eliminarMedico } =
    useMedicos(especialidadSel || null);

  // 4) Hook para traer horarios asociados al médico seleccionado
  const {
    horarios,
    crear: crearHorario,
    eliminar: eliminarHorario,
  } = useHorarios(medicoSel);

  /**
   * Función para salvar un médico.
   * Recibe data = { nombre, especialidad, telefono }.
   * - Verifica si la especialidad existe en Firestore.
   *   Si no existe, la crea.
   * - Luego crea el médico con campo "especialidad" = nombre de la especialidad.
   */
  const salvarMedico = async (data) => {
    const { nombre, especialidad, telefono } = data;
    try {
      // 5a) Verificar si existe esa especialidad por su name
      const q = query(
        collection(db, "especialidades"),
        where("name", "==", especialidad)
      );
      const snap = await getDocs(q);

      // 5b) Si no existe, la agregamos
      if (snap.empty) {
        await addDoc(collection(db, "especialidades"), {
          name: especialidad,
        });
      }
    } catch (err) {
      console.error(
        "[PaginaMedicos] Error al verificar o crear especialidad:",
        err
      );
      alert("Error al crear/verificar la especialidad. Revisa la consola.");
      return; // No seguimos si esto falla
    }

    // 5c) Ahora creamos el médico en Firestore
    try {
      await crearMedico({ nombre, especialidad, telefono });
      alert("Médico guardado correctamente.");
    } catch (err) {
      console.error("[PaginaMedicos] Error al crear médico:", err);
      alert("No se pudo guardar al médico. Revisa la consola.");
    }
  };

  // 6) Si cambiamos de especialidad, limpiamos el estado del médico seleccionado
  useEffect(() => {
    setMedicoSel("");
  }, [especialidadSel]);

  return (
    <div>
      {/* ====== 1. Formulario: Agregar nuevo médico ====== */}
      <div className="card">
        <h2 className="section-title">Agregar nuevo médico</h2>
        <DoctorForm onSave={(data) => salvarMedico(data)} />
      </div>

      {/* ====== 2. Listado de médicos (filtrados por especialidad) ====== */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 className="section-title">Listado de médicos</h2>
        <DoctorList medicos={medicos} onDelete={(id) => eliminarMedico(id)} />
      </div>

      {/* ====== 3. Horarios por médico ====== */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 className="section-title">Horarios por médico</h2>

        {/* 3a) Dropdown para seleccionar especialidad */}
        <div className="form-group">
          <label>Selecciona especialidad</label>
          <select
            value={especialidadSel}
            onChange={(e) => setEspecialidadSel(e.target.value)}
          >
            <option value="">-- Todas las especialidades --</option>
            {especialidades.map((esp) => (
              <option key={esp.id} value={esp.name}>
                {esp.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3b) Dropdown para seleccionar médico (filtrado) */}
        <div className="form-group" style={{ marginTop: "1rem" }}>
          <label>Selecciona médico</label>
          <select
            value={medicoSel}
            onChange={(e) => setMedicoSel(e.target.value)}
            disabled={!especialidadSel}
          >
            <option value="">-- Selecciona médico --</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} · {m.especialidad}
              </option>
            ))}
          </select>
        </div>

        {/* 3c) Si hay médicoSeleccionado, mostramos el formulario de horarios y la lista */}
        {medicoSel && (
          <div style={{ marginTop: "1.5rem" }}>
            {/* En onSave, pasamos { medicoId, dias, slots } */}
            <HorarioForm
              onSave={(dias, slots) =>
                crearHorario({ medicoId: medicoSel, dias, slots })
              }
            />

            <div style={{ marginTop: "1rem" }}>
              {horarios.map((h) => (
                <div
                  key={h.id}
                  className="item-card"
                  style={{ justifyContent: "space-between" }}
                >
                  <div className="item-details">
                    <p>
                      <strong>Días:</strong>{" "}
                      {h.dias
                        .map(
                          (d) =>
                            ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][
                              d
                            ]
                        )
                        .join(", ")}
                    </p>
                    <p>
                      <strong>Slots:</strong> {h.slots.join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => eliminarHorario(h.id)}
                    className="btn btn-danger"
                    style={{ height: "2.2rem", alignSelf: "center" }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              {horarios.length === 0 && (
                <p style={{ color: "var(--color-gris-600)" }}>
                  No hay horarios para este médico.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
import HorarioForm from "../componentes/HorarioForm";

/**
 * PaginaMedicos (Admin):
 *  - Permite al administrador:
 *      1) Agregar un nuevo médico y, al guardarlo, crear la especialidad si no existe.
 *      2) Filtrar la lista de médicos por especialidad y buscar por nombre.
 *      3) Editar inline el nombre y teléfono de un médico, o eliminarlo.
 *      4) Asignar horarios a un médico seleccionado y mostrar/eliminar esos horarios.
 */
export default function PaginaMedicos() {
  // 1) Obtenemos la lista de especialidades en tiempo real
  //    Cada elemento es { id, name }
  const especialidades = useEspecialidades();

  // 2) Estados para filtros del listado de médicos
  //    • especialidadSel: nombre de especialidad seleccionado (string vacío = todas)
  //    • searchTerm: texto para buscar en nombre de médico
  const [especialidadSel, setEspecialidadSel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // 3) useMedicos:
  //    • medicos: arreglo de médicos filtrados según `especialidadSel`
  //    • crearMedico: función para añadir un médico nuevo
  //    • editarMedico: función para modificar campos en un médico
  //    • eliminarMedico: función para borrar un médico
  const {
    medicos,
    crear: crearMedico,
    editar: editarMedico,
    eliminar: eliminarMedico,
  } = useMedicos(especialidadSel || null);

  // 4) Estados y variable para manejar los horarios del médico seleccionado
  //    • medicoSel: ID del médico actualmente elegido
  //    • horarios: arreglo de horarios que corresponden a `medicoSel`
  //    • crearHorario: función para añadir un nuevo horario
  //    • eliminarHorario: función para borrar un horario existente
  const [medicoSel, setMedicoSel] = useState("");
  const {
    horarios,
    crear: crearHorario,
    eliminar: eliminarHorario,
  } = useHorarios(medicoSel);

  // 5) Estados para edición inline de un médico
  //    • editingId: ID del médico en modo edición (null = ninguno editando)
  //    • editarNombre, editarTelefono: campos temporales para modificar
  //    • editError: mensaje de error si la validación falla
  const [editingId, setEditingId] = useState(null);
  const [editarNombre, setEditarNombre] = useState("");
  const [editarTelefono, setEditarTelefono] = useState("");
  const [editError, setEditError] = useState("");

  // 6) useEffect para limpiar el modo edición si el médico ya no existe
  //    (por ejemplo, si eliminamos ese médico en otra parte del componente)
  useEffect(() => {
    if (!medicos.find((m) => m.id === editingId)) {
      setEditingId(null);
      setEditarNombre("");
      setEditarTelefono("");
      setEditError("");
    }
  }, [medicos, editingId]);

  /**
   * handleGuardarEdicion:
   *  - Valida que el nombre no quede vacío.
   *  - Llama a editarMedico() para actualizar nombre y teléfono en Firestore.
   *  - Si tiene éxito, sale del modo edición y limpia los campos temporales.
   *  - Si falla, establece un mensaje en editError.
   */
  const handleGuardarEdicion = async (id) => {
    if (!editarNombre.trim()) {
      setEditError("El nombre no puede quedar vacío.");
      return;
    }
    try {
      await editarMedico(id, {
        nombre: editarNombre.trim(),
        telefono: editarTelefono.trim(),
      });
      setEditingId(null);
      setEditarNombre("");
      setEditarTelefono("");
      setEditError("");
    } catch (err) {
      console.error("Error al editar médico:", err);
      setEditError("No se pudo guardar los cambios. Revisa la consola.");
    }
  };

  // 8) Filtrado de la lista de médicos:
  //    - Primero se filtra por nombre (searchTerm).
  //    - El hook useMedicos ya filtró por especialidadSel si se pasó.
  const medicosFiltrados = medicos.filter((m) => {
    const nombreLower = m.nombre.toLowerCase();
    const termLower = searchTerm.trim().toLowerCase();
    return nombreLower.includes(termLower);
  });

  /**
   * salvarMedico:
   *  - Se invoca al enviar el formulario de DoctorForm.
   *  - Recibe `data` con { nombre, especialidad, telefono }.
   *  - Verifica si la `especialidad` ya existe en Firestore:
   *      • Si no existe, la crea en la colección "especialidades".
   *  - Luego llama a crearMedico() para añadir el documento en "medicos".
   *  - Muestra alertas según éxito o error.
   */
  const salvarMedico = async (data) => {
    const { nombre, especialidad, telefono } = data;

    try {
      const q = query(
        collection(db, "especialidades"),
        where("name", "==", especialidad)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        // Si no se encontró la especialidad, la creamos
        await addDoc(collection(db, "especialidades"), {
          name: especialidad,
        });
      }
    } catch (err) {
      console.error("[PaginaMedicos] Error al verificar/crear especialidad:", err);
      alert("Error al crear o verificar especialidad. Revisa la consola.");
      return;
    }

    try {
      // Finalmente, creamos el médico en la colección "medicos"
      await crearMedico({ nombre, especialidad, telefono });
      alert("Médico guardado correctamente.");
    } catch (err) {
      console.error("[PaginaMedicos] Error al crear médico:", err);
      alert("No se pudo guardar el médico. Revisa la consola.");
    }
  };

  // 10) Cuando cambia la especialidadSel, reseteamos el médico seleccionado
  useEffect(() => {
    setMedicoSel("");
  }, [especialidadSel]);

  return (
    <div style={{ padding: "1rem" }}>
      {/* ====== 1) Formulario: Agregar nuevo médico ====== */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="section-title">Agregar nuevo médico</h2>
        {/* Pasamos salvarMedico como callback a DoctorForm */}
        <DoctorForm onSave={(data) => salvarMedico(data)} />
      </div>

      {/* ====== 2) Filtros y Listado de médicos ====== */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <h2 className="section-title">Listado de médicos</h2>

        {/* ── Controles de filtrado ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          {/* 2a) Seleccionar especialidad para filtrar */}
          <div>
            <label>Filtrar por especialidad:</label>
            <select
              value={especialidadSel}
              onChange={(e) => setEspecialidadSel(e.target.value)}
              style={{ marginLeft: "0.5rem" }}
            >
              <option value="">-- Todas las especialidades --</option>
              {especialidades.map((esp) => (
                <option key={esp.id} value={esp.name}>
                  {esp.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2b) Input para buscar por nombre */}
          <div>
            <label>Buscar por nombre:</label>
            <input
              type="text"
              placeholder="Escribe nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginLeft: "0.5rem" }}
            />
          </div>
        </div>

        {/* ── Tabla de Médicos ────────────────────────────────────────────────── */}
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Nombre</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Especialidad</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Teléfono</th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {medicosFiltrados.map((m) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                {editingId === m.id ? (
                  // == Modo edición inline ==
                  <>
                    <td style={{ padding: "0.75rem" }}>
                      <input
                        type="text"
                        value={editarNombre}
                        onChange={(e) => setEditarNombre(e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td style={{ padding: "0.75rem" }}>{m.especialidad}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <input
                        type="text"
                        value={editarTelefono}
                        onChange={(e) => setEditarTelefono(e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                      <button
                        onClick={() => handleGuardarEdicion(m.id)}
                        className="btn btn-success"
                        style={{ marginRight: "0.5rem" }}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditarNombre("");
                          setEditarTelefono("");
                          setEditError("");
                        }}
                        className="btn btn-secondary"
                      >
                        Cancelar
                      </button>
                      {editError && (
                        <div style={{ color: "red", marginTop: "0.5rem" }}>
                          {editError}
                        </div>
                      )}
                    </td>
                  </>
                ) : (
                  // == Modo lectura normal ==
                  <>
                    <td style={{ padding: "0.75rem" }}>{m.nombre}</td>
                    <td style={{ padding: "0.75rem" }}>{m.especialidad}</td>
                    <td style={{ padding: "0.75rem" }}>{m.telefono || "—"}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                      <button
                        className="btn btn-warning"
                        onClick={() => {
                          // Activar modo edición y precargar datos
                          setEditingId(m.id);
                          setEditarNombre(m.nombre);
                          setEditarTelefono(m.telefono || "");
                          setEditError("");
                        }}
                        style={{ marginRight: "0.5rem" }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => eliminarMedico(m.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {medicosFiltrados.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: "center",
                    padding: "1rem",
                    color: "#666",
                  }}
                >
                  No se encontraron médicos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ====== 3) Horarios por médico ====== */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <h2 className="section-title">Horarios por médico</h2>

        {/* 3a) Selector de especialidad (para filtrar médicos) */}
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label>Selecciona especialidad</label>
          <select
            value={especialidadSel}
            onChange={(e) => setEspecialidadSel(e.target.value)}
            style={{ marginLeft: "0.5rem" }}
          >
            <option value="">-- Todas las especialidades --</option>
            {especialidades.map((esp) => (
              <option key={esp.id} value={esp.name}>
                {esp.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3b) Selector de médico, solo habilitado si hay especialidadSel */}
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label>Selecciona médico</label>
          <select
            value={medicoSel}
            onChange={(e) => setMedicoSel(e.target.value)}
            disabled={!especialidadSel}
            style={{ marginLeft: "0.5rem" }}
          >
            <option value="">-- Selecciona médico --</option>
            {medicos
              .filter((m) => !especialidadSel || m.especialidad === especialidadSel)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} · {m.especialidad}
                </option>
              ))}
          </select>
        </div>

        {/* 3c) Si hay médicoSel, mostramos formulario y listado de horarios */}
        {medicoSel && (
          <div style={{ marginTop: "1rem" }}>
            {/* Formulario para agregar un nuevo horario: recibe (dias, slots) */}
            <HorarioForm
              onSave={(dias, slots) =>
                crearHorario({ medicoId: medicoSel, dias, slots })
              }
            />

            {/* Listado de horarios actuales para este médico */}
            <div style={{ marginTop: "1rem" }}>
              {horarios.map((h) => (
                <div
                  key={h.id}
                  className="item-card"
                  style={{
                    justifyContent: "space-between",
                    display: "flex",
                    alignItems: "center",
                    padding: "0.75rem",
                    border: "1px solid #e0e0e0",
                    borderRadius: "6px",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div className="item-details">
                    <p style={{ margin: 0 }}>
                      <strong>Días:</strong>{" "}
                      {h.dias
                        .map((d) =>
                          ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d]
                        )
                        .join(", ")}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Slots:</strong> {h.slots.join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => eliminarHorario(h.id)}
                    className="btn btn-danger"
                    style={{ height: "2.2rem" }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              {horarios.length === 0 && (
                <p style={{ color: "#666" }}>No hay horarios para este médico.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

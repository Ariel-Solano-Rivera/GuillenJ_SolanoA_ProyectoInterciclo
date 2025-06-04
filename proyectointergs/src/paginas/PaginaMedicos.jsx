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
 * Página de Médicos (Admin):
 * - Filtro por especialidad
 * - Búsqueda por nombre
 * - Listado con acciones: Editar (nombre y teléfono) y Eliminar
 * - También se mantiene la sección de asignar horarios
 */
export default function PaginaMedicos() {
  // 1) Listado de especialidades para el filtro
  const especialidades = useEspecialidades(); // [{ id, name }, ...]

  // 2) Estados para filtros
  const [especialidadSel, setEspecialidadSel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // 3) Hook para traer médicos filtrados por especialidadSel (si es "" trae todos)
  const {
    medicos,
    crear: crearMedico,
    editar: editarMedico,
    eliminar: eliminarMedico,
  } = useMedicos(especialidadSel || null);

  // 4) Hook para traer horarios del médico seleccionado
  const [medicoSel, setMedicoSel] = useState("");
  const {
    horarios,
    crear: crearHorario,
    eliminar: eliminarHorario,
  } = useHorarios(medicoSel);

  // 5) Estados para edición inline de médico
  const [editingId, setEditingId] = useState(null);
  const [editarNombre, setEditarNombre] = useState("");
  const [editarTelefono, setEditarTelefono] = useState("");
  const [editError, setEditError] = useState("");

  // 6) (Opcional) Resetear campos de edición si cambia la lista de médicos
  useEffect(() => {
    if (!medicos.find((m) => m.id === editingId)) {
      setEditingId(null);
      setEditarNombre("");
      setEditarTelefono("");
      setEditError("");
    }
  }, [medicos, editingId]);

  // 7) Manejar guardar cambios en un médico
  const handleGuardarEdicion = async (id) => {
    if (!editarNombre.trim()) {
      setEditError("El nombre no puede quedar vacío.");
      return;
    }
    // Solo permitimos cambiar nombre y teléfono
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

  // 8) Filtrado por término de búsqueda (nombre) + especialidad
  const medicosFiltrados = medicos.filter((m) => {
    const nombreLower = m.nombre.toLowerCase();
    const termLower = searchTerm.trim().toLowerCase();
    return nombreLower.includes(termLower);
  });

  // 9) Función que antes validaba/creaba especialidad en Firestore
  const salvarMedico = async (data) => {
    const { nombre, especialidad, telefono } = data;

    try {
      // Verificar si existe esa especialidad en Firestore
      const q = query(
        collection(db, "especialidades"),
        where("name", "==", especialidad)
      );
      const snap = await getDocs(q);

      // Si no existe, la creamos
      if (snap.empty) {
        await addDoc(collection(db, "especialidades"), {
          name: especialidad,
        });
      }
    } catch (err) {
      console.error("[PaginaMedicos] Error al verificar/crear especialidad:", err);
      alert("Error al crear o verificar especialidad. Revisa la consola.");
      return;
    }

    // Ahora sí, creamos el médico en la colección 'medicos'
    try {
      await crearMedico({ nombre, especialidad, telefono });
      alert("Médico guardado correctamente.");
    } catch (err) {
      console.error("[PaginaMedicos] Error al crear médico:", err);
      alert("No se pudo guardar el médico. Revisa la consola.");
    }
  };

  // 10) Resetear médicoSel si cambia especialidadSel
  useEffect(() => {
    setMedicoSel("");
  }, [especialidadSel]);

  return (
    <div style={{ padding: "1rem" }}>
      {/* ====== 1) Formulario: Agregar nuevo médico ====== */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="section-title">Agregar nuevo médico</h2>
        <DoctorForm onSave={(data) => salvarMedico(data)} />
      </div>

      {/* ====== 2) Filtros y Listado de médicos ====== */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <h2 className="section-title">Listado de médicos</h2>

        {/* Filtros */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          {/* 2a) Filtro por especialidad */}
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

          {/* 2b) Búsqueda por nombre */}
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

        {/* Tabla de Médicos */}
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
                  // === Modo edición inline ===
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
                  // === Modo lectura normal ===
                  <>
                    <td style={{ padding: "0.75rem" }}>{m.nombre}</td>
                    <td style={{ padding: "0.75rem" }}>{m.especialidad}</td>
                    <td style={{ padding: "0.75rem" }}>{m.telefono || "—"}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                      <button
                        className="btn btn-warning"
                        onClick={() => {
                          // Activar edición y precargar valores
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

        {/* 3a) Seleccionar especialidad */}
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

        {/* 3b) Seleccionar médico (filtrado) */}
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

        {/* 3c) Si hay médicoSel, mostramos el form de horarios y listado */}
        {medicoSel && (
          <div style={{ marginTop: "1rem" }}>
            <HorarioForm onSave={(dias, slots) => crearHorario({ medicoId: medicoSel, dias, slots })} />

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

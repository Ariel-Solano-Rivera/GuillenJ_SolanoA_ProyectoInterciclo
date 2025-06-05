// src/paginas/PaginaCitasAdmin.jsx

import React, { useState, useMemo, useEffect } from "react";
import {
  useCitasAdmin,
  eliminarCita,
  actualizarCita,
} from "../data/useCitas";      
import useMedicos from "../data/useMedicos";   
import useUsuarios from "../data/useUsuarios"; 
import useHorarios from "../data/useHorarios"; 
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../api/firebase";          

/**
 * PaginaCitasAdmin:
 *  - Permite al administrador ver, filtrar, buscar, editar y eliminar citas.
 *  - Usa hooks para cargar datos en tiempo real y manejar el estado de edición.
 */
export default function PaginaCitasAdmin() {
  // 1) useCitasAdmin devuelve:
  //    • citas: array de todas las citas (ordenadas internamente por slot)
  //    • confirmar: función para cambiar estado a "confirmada"
  const { citas, confirmar } = useCitasAdmin();

  // 2) Cargamos lista de médicos para mostrar nombre y especialidad
  const { medicos } = useMedicos();

  // 3) Cargamos lista de usuarios para obtener datos del paciente (displayName, email)
  const usuarios = useUsuarios();

  // ── Estados para filtros de listado ─────────────────────────────────────────────────
  // Filtrar por estado: "todas", "pendiente" o "confirmada"
  const [estadoFilter, setEstadoFilter] = useState("todas");
  // Buscar por término: coincidir nombre de paciente o nombre de médico
  const [searchTerm, setSearchTerm] = useState("");

  // ── Estados para edición inline ────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null); // ID de la cita en modo edición
  const [editMedico, setEditMedico] = useState(""); // seleccionado médico durante edición
  const [editFecha, setEditFecha] = useState("");   // fecha elegida al editar (YYYY-MM-DD)
  const [editHora, setEditHora] = useState("");     // hora elegida al editar (HH:MM)
  const [editError, setEditError] = useState("");   // mensaje de error si valida fallida

  // 4) Cuando cambiamos `editMedico`, recargamos los horarios de ese médico para la edición
  const { horarios: horariosEdit } = useHorarios(editMedico);

  // 5) Estado para las horas ya ocupadas (confirmadas) durante la edición
  const [takenSlotsEdit, setTakenSlotsEdit] = useState([]);

  /**
   * useEffect para recargar `takenSlotsEdit`:
   *  - Cada vez que cambian editMedico, editFecha, citas o editingId:
   *    • Consulta Firestore para obtener citas confirmadas del médico y fecha en edición.
   *    • Extrae las horas ocupadas, excluyendo la hora de la propia cita que estamos editando.
   */
  useEffect(() => {
    // Si no hay médico o fecha, vaciamos el array
    if (!editMedico || !editFecha) {
      setTakenSlotsEdit([]);
      return;
    }

    const cargarTaken = async () => {
      try {
        // Construimos la consulta: citas donde
        //    medicoId == editMedico,
        //    fechaISO == editFecha,
        //    estado == "confirmada"
        const q = query(
          collection(db, "citas"),
          where("medicoId", "==", editMedico),
          where("fechaISO", "==", editFecha),
          where("estado", "==", "confirmada")
        );
        const snap = await getDocs(q);
        // Extraemos horas ocupadas:
        const ocupadas = snap.docs
          .map((d) => d.data().hora)
          .filter((h) => {
            // Excluimos la hora de la propia cita en edición
            const citadata = citas.find((c) => c.id === editingId);
            return citadata && h === citadata.hora ? false : true;
          });
        setTakenSlotsEdit(ocupadas);
      } catch (err) {
        console.error("Error cargando takenSlotsEdit:", err);
        setTakenSlotsEdit([]);
      }
    };

    cargarTaken();
  }, [editMedico, editFecha, citas, editingId]);

  // ── Funciones auxiliares para mostrar datos legibles ────────────────────────────────
  // Dado un ID de médico, devuelve su nombre o '—' si no existe
  const medicoPorId = (id) =>
    medicos.find((m) => m.id === id)?.nombre || "—";

  // Dado un ID de paciente, busca en usuarios y devuelve "Nombre · Email"
  // Si no encuentra, retorna el mismo id
  const pacienteInfo = (id) => {
    const u = usuarios.find((x) => x.id === id);
    return u ? `${u.displayName || "(sin nombre)"} · ${u.email}` : id;
  };

  /**
   * filteredCitas:
   *  - Filtra las citas según estadoFilter y searchTerm.
   *  - Si estadoFilter != "todas", restringe a citas cuyo c.estado == estadoFilter.
   *  - Si searchTerm no está vacío, compara (nombre paciente + email) y (nombre médico),
   *    devolviendo true si alguno incluye el término (minusculizado).
   */
  const filteredCitas = useMemo(() => {
    return citas.filter((c) => {
      if (estadoFilter !== "todas" && c.estado !== estadoFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const pac = pacienteInfo(c.pacienteUid).toLowerCase();
        const med = medicoPorId(c.medicoId).toLowerCase();
        return pac.includes(term) || med.includes(term);
      }
      return true;
    });
  }, [citas, usuarios, medicos, estadoFilter, searchTerm]);

  /**
   * validarEdicion:
   *  - Asegura que editMedico, editFecha y editHora estén completos.
   *  - Verifica que la hora seleccionada no esté en takenSlotsEdit.
   *  - Si falla, asigna mensaje a editError y regresa false; en caso contrario, limpia editError y retorna true.
   */
  const validarEdicion = () => {
    if (!editMedico || !editFecha || !editHora) {
      setEditError("Debe completar Médico, Fecha y Hora.");
      return false;
    }
    if (takenSlotsEdit.includes(editHora)) {
      setEditError("Esa hora ya está confirmada para este médico y fecha.");
      return false;
    }
    setEditError("");
    return true;
  };

  /**
   * handleGuardarEdicion:
   *  - Invoca validarEdicion; si pasa, actualiza la cita en Firestore:
   *      • Busca la especialidad actual del médico elegido
   *      • Llama a actualizarCita con los nuevos campos
   *  - Al finalizar, sale del modo edición y limpia los inputs de edición.
   *  - Captura y muestra en editError cualquier excepción que ocurra.
   */
  const handleGuardarEdicion = async () => {
    if (!validarEdicion()) return;

    try {
      // Obtener la especialidad correspondiente al médico editMedico
      const medObj = medicos.find((m) => m.id === editMedico);
      const nuevaEspecialidad = medObj ? medObj.especialidad : "";

      await actualizarCita(editingId, {
        medicoId: editMedico,
        especialidad: nuevaEspecialidad,
        fechaISO: editFecha,
        hora: editHora,
      });

      // Salir del modo edición, limpiando estados
      setEditingId(null);
      setEditMedico("");
      setEditFecha("");
      setEditHora("");
      setEditError("");
    } catch (err) {
      console.error("Error actualizando cita:", err);
      setEditError(err.message || "Error al actualizar la cita.");
    }
  };

  // ── Renderizado del componente ───────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="section-title">Citas</h2>

      {/* ── Controles de filtrado ────────────────────────────────────────────────────── */}
      <div className="filter-container">
        {/* Filtrar por estado */}
        <div className="filter-group">
          <label>Estado:</label>
          <select
            className="filter-select"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
          </select>
        </div>

        {/* Buscar por paciente o médico */}
        <div className="filter-group" style={{ flex: 1 }}>
          <label>Buscar:</label>
          <input
            type="text"
            placeholder="Paciente o médico..."
            className="filter-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── Listado de citas filtradas ────────────────────────────────────────────────── */}
      {filteredCitas.length > 0 ? (
        filteredCitas.map((c) => (
          <div key={c.id} className="item-card">
            {/* ── Modo edición para la cita con ID == editingId ───────────────────────── */}
            {editingId === c.id ? (
              <div
                style={{
                  padding: "1rem",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  background: "#f9f9f9",
                }}
              >
                <h3>Editar cita de {pacienteInfo(c.pacienteUid)}</h3>

                {/* 1) Selector de Médico (parte de editar) */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <label>
                    Médico:
                    <select
                      value={editMedico}
                      onChange={(e) => {
                        setEditMedico(e.target.value);
                        // Al cambiar médico, reseteamos fecha y hora previas
                        setEditFecha("");
                        setEditHora("");
                      }}
                    >
                      <option value="">-- Seleccione médico --</option>
                      {medicos.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} · {m.especialidad}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* 2) Selector de Fecha (parte de editar) */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <label>
                    Fecha:
                    <input
                      type="date"
                      value={editFecha}
                      onChange={(e) => {
                        setEditFecha(e.target.value);
                        setEditHora("");
                      }}
                      // Listado de fechas válidas según próximos 30 días y días de trabajo
                      list="fechasDisponiblesEdit"
                      disabled={!editMedico}
                      // Calcular min y max en línea para no requerir código extra
                      min={(() => {
                        if (!editMedico) return undefined;
                        const hoy = new Date();
                        const fechasArr = [];
                        const y = hoy.getFullYear();
                        const m = hoy.getMonth();
                        const d = hoy.getDate();
                        const diasTrab = new Set();
                        horariosEdit.forEach((h) => {
                          if (Array.isArray(h.dias)) {
                            h.dias.forEach((x) => diasTrab.add(x));
                          }
                        });
                        for (let i = 0; i < 30; i++) {
                          const tmp = new Date(y, m, d + i);
                          if (diasTrab.has(tmp.getDay())) {
                            const yy = tmp.getFullYear();
                            const mm = String(tmp.getMonth() + 1).padStart(2, "0");
                            const dd = String(tmp.getDate()).padStart(2, "0");
                            fechasArr.push(`${yy}-${mm}-${dd}`);
                          }
                        }
                        return fechasArr.length > 0 ? fechasArr[0] : undefined;
                      })()}
                      max={(() => {
                        if (!editMedico) return undefined;
                        const hoy2 = new Date();
                        const fechas2 = [];
                        const y2 = hoy2.getFullYear();
                        const m2 = hoy2.getMonth();
                        const d2 = hoy2.getDate();
                        const diasTrab2 = new Set();
                        horariosEdit.forEach((h) => {
                          if (Array.isArray(h.dias)) {
                            h.dias.forEach((x) => diasTrab2.add(x));
                          }
                        });
                        for (let i = 0; i < 30; i++) {
                          const tmp2 = new Date(y2, m2, d2 + i);
                          if (diasTrab2.has(tmp2.getDay())) {
                            const yy2 = tmp2.getFullYear();
                            const mm2 = String(tmp2.getMonth() + 1).padStart(2, "0");
                            const dd2 = String(tmp2.getDate()).padStart(2, "0");
                            fechas2.push(`${yy2}-${mm2}-${dd2}`);
                          }
                        }
                        return fechas2.length > 0 ? fechas2[fechas2.length - 1] : undefined;
                      })()}
                    />
                    <datalist id="fechasDisponiblesEdit">
                      {(() => {
                        if (!editMedico) return null;
                        const hoy3 = new Date();
                        const arr3 = [];
                        const yy3 = hoy3.getFullYear();
                        const mm3 = hoy3.getMonth();
                        const dd3 = hoy3.getDate();
                        const diasTrab3 = new Set();
                        horariosEdit.forEach((h) => {
                          if (Array.isArray(h.dias)) {
                            h.dias.forEach((x) => diasTrab3.add(x));
                          }
                        });
                        for (let i = 0; i < 30; i++) {
                          const tmp3 = new Date(yy3, mm3, dd3 + i);
                          if (diasTrab3.has(tmp3.getDay())) {
                            const yy4 = tmp3.getFullYear();
                            const mm4 = String(tmp3.getMonth() + 1).padStart(2, "0");
                            const dd4 = String(tmp3.getDate()).padStart(2, "0");
                            arr3.push(`${yy4}-${mm4}-${dd4}`);
                          }
                        }
                        return arr3.map((f) => <option key={f} value={f} />);
                      })()}
                    </datalist>
                  </label>
                </div>

                {/* 3) Selector de Hora (parte de editar) */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <label>
                    Hora:
                    <select
                      value={editHora}
                      onChange={(e) => setEditHora(e.target.value)}
                      disabled={!editFecha}
                    >
                      <option value="">-- Seleccione --</option>
                      {(() => {
                        if (!editMedico || !editFecha) return null;
                        const [añoF, mesF, diaF] = editFecha.split("-").map(Number);
                        const fechaObj = new Date(añoF, mesF - 1, diaF);
                        const idxF = fechaObj.getDay();
                        const horObj = horariosEdit.find(
                          (h) => Array.isArray(h.dias) && h.dias.includes(idxF)
                        );
                        if (!horObj || !Array.isArray(horObj.slots)) return null;
                        return horObj.slots
                          .filter((s) => !takenSlotsEdit.includes(s))
                          .map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ));
                      })()}
                    </select>
                  </label>
                </div>

                {/* 4) Mostrar error de edición si existe */}
                {editError && (
                  <div style={{ color: "red", marginBottom: "0.75rem" }}>
                    {editError}
                  </div>
                )}

                {/* 5) Botones para guardar o cancelar edición */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={handleGuardarEdicion}>Guardar cambios</button>
                  <button
                    onClick={() => {
                      // Al cancelar, limpiamos todos los estados de edición
                      setEditingId(null);
                      setEditMedico("");
                      setEditFecha("");
                      setEditHora("");
                      setEditError("");
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              /* ── Modo lectura normal (sin editar) ──────────────────────────────────── */
              <>
                <div className="item-details">
                  <p>
                    <strong>Paciente:</strong> {pacienteInfo(c.pacienteUid)}
                  </p>
                  <p>
                    <strong>Médico:</strong> {medicoPorId(c.medicoId)}
                  </p>
                  <p>
                    <strong>Especialidad:</strong> {c.especialidad}
                  </p>
                  <p>
                    <strong>Día:</strong> {c.dia}
                  </p>
                  <p>
                    <strong>Fecha:</strong> {c.fechaISO}
                  </p>
                  <p>
                    <strong>Hora:</strong> {c.hora}
                  </p>
                  <p>
                    <strong>Estado:</strong>{" "}
                    <span
                      className={
                        c.estado === "confirmada"
                          ? "status-confirmada"
                          : "status-pendiente"
                      }
                    >
                      {c.estado}
                    </span>
                  </p>
                </div>

                {/* Botones de acción para cada cita */}
                <div className="item-actions">
                  {/* Botón Editar: activa modo edición */}
                  <button
                    className="btn btn-warning"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditMedico(c.medicoId);
                      setEditFecha(c.fechaISO);
                      setEditHora(c.hora);
                      setEditError("");
                    }}
                    style={{ marginRight: "0.5rem" }}
                  >
                    Editar
                  </button>

                  {/* Botón Confirmar: solo si la cita aún está pendiente */}
                  {c.estado === "pendiente" && (
                    <button
                      className="btn btn-success"
                      onClick={() => confirmar(c.id)}
                      style={{ marginRight: "0.5rem" }}
                    >
                      Confirmar
                    </button>
                  )}

                  {/* Botón Eliminar: borra la cita sin importar su estado */}
                  <button
                    className="btn btn-danger"
                    onClick={async () => {
                      try {
                        await eliminarCita(c.id);
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      ) : (
        /* Si no hay citas que coincidan con filtros, mostrar mensaje */
        <p style={{ color: "var(--color-gris-600)" }}>
          No hay citas que coincidan con los filtros.
        </p>
      )}
    </div>
  );
}

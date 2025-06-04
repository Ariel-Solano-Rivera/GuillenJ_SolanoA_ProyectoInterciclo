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

export default function PaginaCitasAdmin() {
  const { citas, confirmar } = useCitasAdmin();
  const { medicos } = useMedicos();
  const usuarios = useUsuarios();

  const [estadoFilter, setEstadoFilter] = useState("todas");
  const [searchTerm, setSearchTerm] = useState("");

  // Para edición inline
  const [editingId, setEditingId] = useState(null);
  const [editMedico, setEditMedico] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editHora, setEditHora] = useState("");
  const [editError, setEditError] = useState("");

  // Al cambiar el médico en edición, recargamos sus horarios
  const { horarios: horariosEdit } = useHorarios(editMedico);

  // Cargar “takenSlots” para el médico y la fecha en edición
  const [takenSlotsEdit, setTakenSlotsEdit] = useState([]);
  useEffect(() => {
    if (!editMedico || !editFecha) {
      setTakenSlotsEdit([]);
      return;
    }
    const cargarTaken = async () => {
      try {
        const q = query(
          collection(db, "citas"),
          where("medicoId", "==", editMedico),
          where("fechaISO", "==", editFecha),
          where("estado", "==", "confirmada")
        );
        const snap = await getDocs(q);
        const ocupadas = snap.docs
          .map((d) => d.data().hora)
          // Excluimos la hora de la propia cita que estamos editando:
          .filter((h) => {
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

  const medicoPorId = (id) =>
    medicos.find((m) => m.id === id)?.nombre || "—";

  const pacienteInfo = (id) => {
    const u = usuarios.find((x) => x.id === id);
    return u ? `${u.displayName || "(sin nombre)"} · ${u.email}` : id;
  };

  // Filtrado de citas por estado y término de búsqueda
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

  // Validar que la nueva fecha/hora no colisione con otra cita confirmada
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

  // Guardar los cambios de edición
  const handleGuardarEdicion = async () => {
    if (!validarEdicion()) return;
    try {
      // Obtener la especialidad actual del médico seleccionado
      const medObj = medicos.find((m) => m.id === editMedico);
      const nuevaEspecialidad = medObj ? medObj.especialidad : "";

      await actualizarCita(editingId, {
        medicoId: editMedico,
        especialidad: nuevaEspecialidad,
        fechaISO: editFecha,
        hora: editHora,
      });

      // Cerrar el modo edición
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

  return (
    <div>
      <h2 className="section-title">Citas</h2>

      {/* FILTROS */}
      <div className="filter-container">
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

      {/* LISTADO DE CITAS */}
      {filteredCitas.length > 0 ? (
        filteredCitas.map((c) => (
          <div key={c.id} className="item-card">
            {/* Si estamos editando esta cita */}
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

                {/* 1) Selección de Médico */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <label>
                    Médico:
                    <select
                      value={editMedico}
                      onChange={(e) => {
                        setEditMedico(e.target.value);
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

                {/* 2) Selección de Fecha */}
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
                      // Listado de fechas según los próximos 30 días y días de trabajo del médico
                      list="fechasDisponiblesEdit"
                      disabled={!editMedico}
                      min={(() => {
                        if (!editMedico) return undefined;
                        // Construir array de próximas 30 fechas
                        const hoy = new Date();
                        const fechasArr = [];
                        const y0 = hoy.getFullYear();
                        const m0 = hoy.getMonth();
                        const d0 = hoy.getDate();
                        const diasTrab = new Set();
                        horariosEdit.forEach((h) => {
                          if (Array.isArray(h.dias)) {
                            h.dias.forEach((d) => diasTrab.add(d));
                          }
                        });
                        for (let i = 0; i < 30; i++) {
                          const tmp = new Date(y0, m0, d0 + i);
                          if (diasTrab.has(tmp.getDay())) {
                            const y1 = tmp.getFullYear();
                            const m1 = String(tmp.getMonth() + 1).padStart(2, "0");
                            const d1 = String(tmp.getDate()).padStart(2, "0");
                            fechasArr.push(`${y1}-${m1}-${d1}`);
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
                            h.dias.forEach((d) => diasTrab2.add(d));
                          }
                        });
                        for (let i = 0; i < 30; i++) {
                          const tmp2 = new Date(y2, m2, d2 + i);
                          if (diasTrab2.has(tmp2.getDay())) {
                            const y3 = tmp2.getFullYear();
                            const m3 = String(tmp2.getMonth() + 1).padStart(2, "0");
                            const d3 = String(tmp2.getDate()).padStart(2, "0");
                            fechas2.push(`${y3}-${m3}-${d3}`);
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
                        const yx0 = hoy3.getFullYear();
                        const mx0 = hoy3.getMonth();
                        const dx0 = hoy3.getDate();
                        const diasTrab3 = new Set();
                        horariosEdit.forEach((h) => {
                          if (Array.isArray(h.dias)) {
                            h.dias.forEach((d) => diasTrab3.add(d));
                          }
                        });
                        for (let i = 0; i < 30; i++) {
                          const tmp3 = new Date(yx0, mx0, dx0 + i);
                          if (diasTrab3.has(tmp3.getDay())) {
                            const y4 = tmp3.getFullYear();
                            const m4 = String(tmp3.getMonth() + 1).padStart(2, "0");
                            const d4 = String(tmp3.getDate()).padStart(2, "0");
                            arr3.push(`${y4}-${m4}-${d4}`);
                          }
                        }
                        return arr3.map((f) => <option key={f} value={f} />);
                      })()}
                    </datalist>
                  </label>
                </div>

                {/* 3) Selección de Hora */}
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

                {editError && (
                  <div style={{ color: "red", marginBottom: "0.75rem" }}>
                    {editError}
                  </div>
                )}

                {/* 4) Botones Guardar / Cancelar */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={handleGuardarEdicion}>Guardar cambios</button>
                  <button
                    onClick={() => {
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
              /* Modo lectura normal para esta cita */
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
                <div className="item-actions">
                  {/* Editar */}
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
                  {/* Confirmar (solo si está pendiente) */}
                  {c.estado === "pendiente" && (
                    <button
                      className="btn btn-success"
                      onClick={() => confirmar(c.id)}
                      style={{ marginRight: "0.5rem" }}
                    >
                      Confirmar
                    </button>
                  )}
                  {/* Eliminar */}
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
        <p style={{ color: "var(--color-gris-600)" }}>
          No hay citas que coincidan con los filtros.
        </p>
      )}
    </div>
  );
}

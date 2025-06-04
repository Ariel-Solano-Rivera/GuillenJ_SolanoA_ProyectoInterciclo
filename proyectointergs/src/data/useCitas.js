// src/data/useCitas.js

import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { db } from "../api/firebase";
import { useAuth } from "../autenticacion/ContextoAutenticacion";

/**
 * Hook para que un paciente autenticado vea SOLO sus citas.
 */
export function useMisCitas() {
  const { usuario } = useAuth();
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    if (!usuario || !usuario.uid) {
      setCitas([]);
      return;
    }

    const q = query(
      collection(db, "citas"),
      where("pacienteUid", "==", usuario.uid)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const arr = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        arr.sort((a, b) => a.slot.seconds - b.slot.seconds);
        setCitas(arr);
      },
      (error) => {
        console.error("Error leyendo citas del paciente:", error);
      }
    );
    return () => unsub();
  }, [usuario]);

  return citas;
}

/**
 * Hook para que un admin vea TODAS las citas.
 * Retorna { citas, confirmar }.
 */
export function useCitasAdmin() {
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "citas"),
      (snapshot) => {
        const arr = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        arr.sort((a, b) => a.slot.seconds - b.slot.seconds);
        setCitas(arr);
      },
      (error) => {
        console.error("Error leyendo todas las citas (Admin):", error);
      }
    );
    return () => unsub();
  }, []);

  const confirmar = async (id) => {
    try {
      await updateDoc(doc(db, "citas", id), { estado: "confirmada" });
    } catch (err) {
      console.error("Error confirmando cita:", err);
    }
  };

  return { citas, confirmar };
}

/**
 * Crea una nueva cita. Evita duplicados confirmados exactos (mismo médico, misma fecha, misma hora).
 */
export async function crearCita({ pacienteUid, medicoId, especialidad, fechaISO, hora }) {
  // 1) Verificar si ya existe una cita confirmada exactamente igual
  const qCheck = query(
    collection(db, "citas"),
    where("medicoId", "==", medicoId),
    where("fechaISO", "==", fechaISO),
    where("hora", "==", hora),
    where("estado", "==", "confirmada")
  );
  const snapCheck = await getDocs(qCheck);
  if (!snapCheck.empty) {
    throw new Error("Ya existe una cita confirmada en esa fecha y hora para este médico.");
  }

  // 2) Parsear fechaISO y hora para evitar problemas de zona horaria
  //    fechaISO: "YYYY-MM-DD", hora: "HH:MM" (24h)
  //    desglosamos:
  const [yyyy, mm, dd] = fechaISO.split("-").map(Number);
  const [hh, min] = hora.split(":").map(Number);

  // 3) Crear un objeto Date local sin corrimientos
  const fechaObj = new Date(yyyy, mm - 1, dd);
  const dia = fechaObj.toLocaleDateString("es-ES", { weekday: "short" }); // ej. "lun", "mar", ...

  // 4) Crear un objeto Date con la hora exacta para slot
  const fechaConHora = new Date(yyyy, mm - 1, dd, hh, min);
  const slot = Timestamp.fromDate(fechaConHora);

  // 5) Insertar en Firestore
  const docRef = await addDoc(collection(db, "citas"), {
    pacienteUid,
    medicoId,
    especialidad,
    fechaISO,
    hora,
    dia,
    slot,
    estado: "pendiente",
  });
  return docRef.id;
}

/**
 * Actualiza una cita existente (por ejemplo, cambiar médico, fecha o hora).
 * Recalcula `dia` y `slot` según los nuevos datos.
 * Recibe:
 *   id: string (ID del documento)
 *   datos: objeto con campos a actualizar:
 *     { medicoId, especialidad, fechaISO, hora } (al menos uno)
 */
export async function actualizarCita(id, datos) {
  // 1) Leer los datos actuales para combinar
  const ref = doc(db, "citas", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("La cita no existe.");

  const dataActual = snap.data();
  // Extraer la nueva fechaISO y hora, o mantener la anterior
  const newFechaISO = datos.fechaISO || dataActual.fechaISO;
  const newHora = datos.hora || dataActual.hora;
  const newMedicoId = datos.medicoId || dataActual.medicoId;
  const newEspecialidad = datos.especialidad || dataActual.especialidad;

  // 2) Recalcular día y slot localmente:
  const [yyyy, mm, dd] = newFechaISO.split("-").map(Number);
  const [hh, min] = newHora.split(":").map(Number);
  const fechaObj = new Date(yyyy, mm - 1, dd);
  const dia = fechaObj.toLocaleDateString("es-ES", { weekday: "short" });
  const fechaConHora = new Date(yyyy, mm - 1, dd, hh, min);
  const slot = Timestamp.fromDate(fechaConHora);

  // 3) Actualizar el documento con los nuevos campos
  await updateDoc(ref, {
    medicoId: newMedicoId,
    especialidad: newEspecialidad,
    fechaISO: newFechaISO,
    hora: newHora,
    dia,
    slot,
    // Nota: no cambiamos `estado` aquí (permanece en "pendiente" o "confirmada")
  });
}

/**
 * Elimina una cita sin importar su estado.
 */
export async function eliminarCita(id) {
  const ref = doc(db, "citas", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("La cita no existe.");
  // Ya no bloqueamos la eliminación si está confirmada.
  await deleteDoc(ref);
}

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
 * Crea una nueva cita. No permite duplicados exactos (mismo médico, misma fecha, misma hora).
 */
export async function crearCita({ pacienteUid, medicoId, especialidad, fechaISO, hora }) {
  // Primero verifico que no exista ya una cita confirmada exactamente igual
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

  // Si no hay duplicado, convertimos a Timestamp y guardamos
  const slot = Timestamp.fromDate(new Date(`${fechaISO}T${hora}:00`));
  const dia = new Date(fechaISO).toLocaleDateString("es-ES", { weekday: "short" });

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
 * Elimina una cita. Si ya está confirmada, lanza error.
 */
export async function eliminarCita(id) {
  const ref = doc(db, "citas", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("La cita no existe.");
  const data = snap.data();
  if (data.estado === "confirmada") {
    throw new Error("No puedes eliminar una cita que ya está confirmada.");
  }
  // Si está pendiente, la borramos
  await deleteDoc(ref);
}

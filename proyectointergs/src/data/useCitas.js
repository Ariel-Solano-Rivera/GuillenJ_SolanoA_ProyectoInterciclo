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
 * useMisCitas:
 *  - Hook que permite a un paciente autenticado escuchar en tiempo real todas sus citas.
 *  - Retorna un arreglo `citas` con objetos { id, pacienteUid, medicoId, slot, dia, hora, especialidad, estado, … }.
 */
export function useMisCitas() {
  // Obtenemos el usuario actual desde el contexto de autenticación
  const { usuario } = useAuth();
  // Estado local para almacenar la lista de citas
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    // Si no hay usuario o no tiene UID, limpiamos y salimos
    if (!usuario || !usuario.uid) {
      setCitas([]);
      return;
    }

    // 1) Construimos la consulta a la colección "citas" filtrando por pacienteUid == usuario.uid
    const q = query(
      collection(db, "citas"),
      where("pacienteUid", "==", usuario.uid)
    );

    // 2) onSnapshot() mantiene una suscripción en tiempo real a esa consulta
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        // Para cada cambio de snapshot, mapeamos documentos a objetos JS
        const arr = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // Ordenamos las citas por la marca de tiempo `slot.seconds` ascendente
        arr.sort((a, b) => a.slot.seconds - b.slot.seconds);
        setCitas(arr);
      },
      (error) => {
        console.error("Error leyendo citas del paciente:", error);
      }
    );

    // Cleanup: cuando el componente se desmonte o cambie usuario, cancelamos la suscripción
    return () => unsub();
  }, [usuario]);

  // Devolvemos el arreglo de citas para que el componente lo consuma
  return citas;
}

/**
 * useCitasAdmin:
 *  - Hook que permite a un administrador escuchar en tiempo real todas las citas.
 *  - Retorna { citas, confirmar }, donde:
 *      • citas: array de todas las citas ordenadas por `slot`
 *      • confirmar(id): función para cambiar el estado de una cita a "confirmada"
 */
export function useCitasAdmin() {
  // Estado local para lista de todas las citas
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    // Creamos una suscripción en tiempo real a toda la colección "citas"
    const unsub = onSnapshot(
      collection(db, "citas"),
      (snapshot) => {
        // Convertimos cada documento en un objeto JS
        const arr = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // Ordenamos por `slot.seconds` ascendente
        arr.sort((a, b) => a.slot.seconds - b.slot.seconds);
        setCitas(arr);
      },
      (error) => {
        console.error("Error leyendo todas las citas (Admin):", error);
      }
    );

    // Cleanup: abandonar suscripción al desmontar
    return () => unsub();
  }, []);

  /**
   * confirmar:
   *  - Cambia el campo `estado` de la cita (identificada por `id`) a "confirmada".
   *  - Solo el administrador debe invocar esto (las reglas de seguridad lo garantizan).
   */
  const confirmar = async (id) => {
    try {
      await updateDoc(doc(db, "citas", id), { estado: "confirmada" });
    } catch (err) {
      console.error("Error confirmando cita:", err);
    }
  };

  // Retornamos tanto la lista de citas como la función confirmar
  return { citas, confirmar };
}

/**
 * crearCita:
 *  - Inserta una nueva cita en Firestore, siempre que no exista ya una confirmada
 *    para el mismo médico, fecha y hora.
 *  - Recibe un objeto con:
 *      • pacienteUid  (string)
 *      • medicoId     (string)
 *      • especialidad (string)
 *      • fechaISO     (string "YYYY-MM-DD")
 *      • hora         (string "HH:MM")
 *  - Lanza un Error si ya existe una cita confirmada exactamente igual.
 *  - Calcula internamente `dia` y `slot` para evitar discrepancias de zona horaria.
 *  - Retorna el ID del documento recién creado.
 */
export async function crearCita({
  pacienteUid,
  medicoId,
  especialidad,
  fechaISO,
  hora,
}) {
  // 1) Verificar duplicados confirmados exactos: mismo médico, misma fechaISO, misma hora, estado "confirmada"
  const qCheck = query(
    collection(db, "citas"),
    where("medicoId", "==", medicoId),
    where("fechaISO", "==", fechaISO),
    where("hora", "==", hora),
    where("estado", "==", "confirmada")
  );
  const snapCheck = await getDocs(qCheck);
  if (!snapCheck.empty) {
    throw new Error(
      "Ya existe una cita confirmada en esa fecha y hora para este médico."
    );
  }

  // 2) Parsear fechaISO "YYYY-MM-DD" y hora "HH:MM" a números
  const [yyyy, mm, dd] = fechaISO.split("-").map(Number);
  const [hh, min] = hora.split(":").map(Number);

  // 3) Calcular `dia` (nombre corto en español) para el campo 'dia'
  const fechaObj = new Date(yyyy, mm - 1, dd);
  const dia = fechaObj.toLocaleDateString("es-ES", { weekday: "short" }); // ej. "lun", "mar", ...

  // 4) Crear un objeto Date completo con fecha + hora para el Timestamp `slot`
  const fechaConHora = new Date(yyyy, mm - 1, dd, hh, min);
  const slot = Timestamp.fromDate(fechaConHora);

  // 5) Insertar en Firestore con estado inicial "pendiente"
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
 * actualizarCita:
 *  - Actualiza campos de una cita existente; recalcula `dia` y `slot`.
 *  - Recibe:
 *      • id: ID de la cita a actualizar
 *      • datos: objeto con al menos uno de { medicoId, especialidad, fechaISO, hora }
 *  - Si la cita no existe, lanza un Error.
 *  - Combina datos antiguos y nuevos, calcula de nuevo dia/slot y ejecuta updateDoc.
 */
export async function actualizarCita(id, datos) {
  // 1) Leemos el documento actual para combinar la información
  const ref = doc(db, "citas", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("La cita no existe.");

  const dataActual = snap.data();
  // Extraer valores nuevos o mantener los existentes
  const newFechaISO = datos.fechaISO || dataActual.fechaISO;
  const newHora = datos.hora || dataActual.hora;
  const newMedicoId = datos.medicoId || dataActual.medicoId;
  const newEspecialidad = datos.especialidad || dataActual.especialidad;

  // 2) Recalcular `dia`
  const [yyyy, mm, dd] = newFechaISO.split("-").map(Number);
  const [hh, min] = newHora.split(":").map(Number);
  const fechaObj = new Date(yyyy, mm - 1, dd);
  const dia = fechaObj.toLocaleDateString("es-ES", { weekday: "short" });

  // 3) Recalcular `slot` como Timestamp
  const fechaConHora = new Date(yyyy, mm - 1, dd, hh, min);
  const slot = Timestamp.fromDate(fechaConHora);

  // 4) Actualizar el documento en Firestore con los nuevos valores
  await updateDoc(ref, {
    medicoId: newMedicoId,
    especialidad: newEspecialidad,
    fechaISO: newFechaISO,
    hora: newHora,
    dia,
    slot,
    // Nota: no modificamos `estado` aquí; queda igual (pendiente/confirmada)
  });
}

/**
 * eliminarCita:
 *  - Borra una cita de la colección sin importar su estado.
 *  - Recibe el ID de la cita; si no existe, lanza un Error.
 */
export async function eliminarCita(id) {
  const ref = doc(db, "citas", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("La cita no existe.");
  // Eliminamos el documento (deleteDoc) sin condiciones adicionales
  await deleteDoc(ref);
}

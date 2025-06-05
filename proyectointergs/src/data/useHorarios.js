// src/data/useHorarios.js

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../api/firebase";

/**
 * useHorarios:
 *  - Hook que escucha en tiempo real los documentos de "horarios" para un médico dado.
 *  - Parámetro:
 *      • medicoId (string | null): ID del médico cuyos horarios queremos obtener.
 *  - Cada documento en "horarios" se espera que tenga al menos:
 *      { medicoId: "...", dias: [0,2,4], slots: ["10:00","11:00"] }
 *
 * Retorna un objeto con:
 *  • horarios: arreglo de objetos { id, medicoId, dias, slots }
 *  • crear(data): función para añadir un nuevo horario a Firestore
 *  • eliminar(id): función para borrar un horario por su ID
 */
export default function useHorarios(medicoId = null) {
  // Estado local que almacenará la lista de horarios obtenidos de Firestore
  const [horarios, setHorarios] = useState([]);

  useEffect(() => {
    // Si no recibimos un medicoId válido, limpiamos el estado y salimos
    if (!medicoId) {
      setHorarios([]);
      return;
    }

    // 1) Construimos la consulta: colección "horarios" filtrada por medicoId
    const q = query(
      collection(db, "horarios"),
      where("medicoId", "==", medicoId)
    );

    // 2) onSnapshot() para suscripción en tiempo real a esa consulta
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        // Convertimos cada documento en un objeto con id y sus datos
        const arr = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // Guardamos el arreglo en el estado local
        setHorarios(arr);
      },
      (error) => {
        console.error("Error al leer colección 'horarios':", error);
      }
    );

    // Cleanup: cancelar la suscripción cuando cambie medicoId o se desmonte
    return () => unsub();
  }, [medicoId]);

  // Función para crear un nuevo documento en "horarios"
  // Recibe un objeto `data` con al menos { medicoId, dias, slots }
  const crear = (data) => addDoc(collection(db, "horarios"), data);

  // Función para eliminar un documento de "horarios" por su ID
  const eliminar = (id) => deleteDoc(doc(db, "horarios", id));

  // Devolvemos el arreglo de horarios y las funciones para crear/eliminar
  return { horarios, crear, eliminar };
}

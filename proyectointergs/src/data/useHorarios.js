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
 * Hook para leer en tiempo real los horarios de un médico.
 * Parámetro:
 *   - medicoId: id del médico cuyos horarios queremos escuchar.
 *
 * Asume que cada documento en "horarios" tiene:
 *   { medicoId: "...", dias: [0, 2, 4], slots: ["10:00","11:00"] }
 */
export default function useHorarios(medicoId = null) {
  const [horarios, setHorarios] = useState([]);

  useEffect(() => {
    if (!medicoId) {
      setHorarios([]);
      return;
    }

    const q = query(
      collection(db, "horarios"),
      where("medicoId", "==", medicoId)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const arr = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setHorarios(arr);
      },
      (error) => {
        console.error("Error al leer colección 'horarios':", error);
      }
    );

    return () => unsub();
  }, [medicoId]);

  // Funciones para crear y eliminar horarios
  const crear = (data) => addDoc(collection(db, "horarios"), data);
  const eliminar = (id) => deleteDoc(doc(db, "horarios", id));

  return { horarios, crear, eliminar };
}

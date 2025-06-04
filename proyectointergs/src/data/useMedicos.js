// src/data/useMedicos.js

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../api/firebase";

/**
 * Hook que escucha en tiempo real la colección "medicos".
 * Si recibe `especialidadSeleccionada` (nombre de la especialidad),
 * sólo trae aquellos médicos cuyo campo "especialidad" coincida exactamente.
 *
 * Se asume que cada documento en "medicos" tiene al menos:
 *   { nombre: string, especialidad: string, telefono: string }
 */
export default function useMedicos(especialidadSeleccionada = null) {
  const [medicos, setMedicos] = useState([]);

  useEffect(() => {
    // 1) Si no se pasó ninguna especialidad, traemos toda la colección
    let q = collection(db, "medicos");
    // 2) Si hay una especialidad seleccionada (nombre), filtramos por ese string
    if (especialidadSeleccionada) {
      q = query(
        collection(db, "medicos"),
        where("especialidad", "==", especialidadSeleccionada)
      );
    }

    // 3) Listener en tiempo real
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const arr = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // Opcional: ordenar alfabéticamente por nombre
        arr.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setMedicos(arr);
      },
      (error) => {
        console.error("Error al leer colección 'medicos':", error);
      }
    );

    return () => unsub();
  }, [especialidadSeleccionada]);

  // Funciones para crear, editar y eliminar médicos
  const crear = (data) => addDoc(collection(db, "medicos"), data);
  const editar = (id, data) => updateDoc(doc(db, "medicos", id), data);
  const eliminar = (id) => deleteDoc(doc(db, "medicos", id));

  return { medicos, crear, editar, eliminar };
}

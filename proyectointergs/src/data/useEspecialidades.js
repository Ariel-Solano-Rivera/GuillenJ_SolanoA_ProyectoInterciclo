// src/data/useEspecialidades.js

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../api/firebase";

/**
 * Hook que escucha en tiempo real la colección "especialidades"
 * y devuelve un arreglo de { id, name }.
 * Cada documento en "especialidades" asume tener al menos:
 *   { name: "Nombre de la especialidad" }
 */
export default function useEspecialidades() {
  const [especialidades, setEspecialidades] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "especialidades"),
      (snapshot) => {
        const arr = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        arr.sort((a, b) => a.name.localeCompare(b.name));
        setEspecialidades(arr);
      },
      (error) => {
        console.error("Error al leer colección 'especialidades':", error);
      }
    );
    return () => unsub();
  }, []);

  return especialidades;
}

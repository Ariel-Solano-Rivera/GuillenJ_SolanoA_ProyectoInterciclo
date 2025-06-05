// src/data/useEspecialidades.js

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../api/firebase";

/**
 * useEspecialidades:
 *  - Hook que se suscribe en tiempo real a la colección "especialidades" en Firestore.
 *  - Devuelve un arreglo de objetos { id, name } ordenado alfabéticamente por nombre.
 *  - Cada documento en "especialidades" debe tener al menos la propiedad:
 *      { name: "Nombre de la especialidad" }
 */
export default function useEspecialidades() {
  // Estado local: arreglo de especialidades
  const [especialidades, setEspecialidades] = useState([]);

  useEffect(() => {
    // 1) Creamos una suscripción en tiempo real con onSnapshot()
    const unsub = onSnapshot(
      collection(db, "especialidades"),
      (snapshot) => {
        // 2) Convertimos cada documento en un objeto { id, name }
        const arr = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        // 3) Ordenamos alfabéticamente según el campo 'name'
        arr.sort((a, b) => a.name.localeCompare(b.name));
        // 4) Actualizamos el estado con el arreglo ordenado
        setEspecialidades(arr);
      },
      (error) => {
        // Si ocurre un error al leer la colección, lo mostramos en consola
        console.error("Error al leer colección 'especialidades':", error);
      }
    );

    // 5) Al desmontar el componente o cambiar dependencias, cancelamos la suscripción
    return () => unsub();
  }, []); // Dependencias vacías → solo se ejecuta una vez al montar

  // Retornamos el arreglo de especialidades para que el componente consumidor lo use
  return especialidades;
}

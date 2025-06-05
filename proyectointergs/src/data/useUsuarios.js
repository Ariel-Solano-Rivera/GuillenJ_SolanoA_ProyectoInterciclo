// src/data/useUsuarios.js

import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../api/firebase";

/**
 * useUsuarios:
 *  - Hook que escucha en tiempo real la colección "usuarios" en Firestore.
 *  - Devuelve un arreglo con objetos { id, ...campos } para cada usuario.
 */
export default function useUsuarios() {
  // Estado local para almacenar la lista de usuarios
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    // 1) onSnapshot() crea una suscripción en tiempo real a la colección "usuarios"
    const unsub = onSnapshot(
      collection(db, "usuarios"),
      (snapshot) => {
        // 2) Convertimos cada documento en { id, ...datosDelDocumento }
        const arr = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // 3) Actualizamos el estado con el arreglo resultante
        setUsuarios(arr);
      },
      (error) => {
        // Capturamos y mostramos errores al leer la colección
        console.error("Error al leer colección 'usuarios':", error);
      }
    );

    // 4) Cleanup: al desmontar el componente, cancelamos la suscripción
    return () => unsub();
  }, []); // Dependencias vacías → solo se ejecuta al montar

  // Devolvemos el arreglo de usuarios para que el componente consumidor lo use
  return usuarios;
}

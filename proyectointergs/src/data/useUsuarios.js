// src/data/useUsuarios.js
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../api/firebase";

/**
 * Hook que escucha en tiempo real la colección "usuarios"
 * y devuelve un arreglo de { id, ...campos }.
 */
export default function useUsuarios() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "usuarios"),
      (snapshot) => {
        const arr = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setUsuarios(arr);
      },
      (error) => {
        console.error("Error al leer colección 'usuarios':", error);
      }
    );
    return () => unsub();
  }, []);

  return usuarios;
}

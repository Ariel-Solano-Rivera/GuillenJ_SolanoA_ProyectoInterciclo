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
  getDocs,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../api/firebase";

/**
 * useMedicos:
 *  - Hook que escucha en tiempo real la colección "medicos" en Firestore.
 *  - Si recibe `especialidadSeleccionada` (string), aplica un filtro exacto por ese campo.
 *  - Asume que cada documento en "medicos" tiene al menos:
 *      { nombre: string, especialidad: string, telefono: string }
 *
 * Retorna un objeto con:
 *  • medicos: arreglo de objetos { id, nombre, especialidad, telefono, … }
 *  • crear(data): función para añadir un nuevo médico
 *  • editar(id, data): función para actualizar un médico existente
 *  • eliminar(id): función para borrar un médico y sus citas asociadas
 */
export default function useMedicos(especialidadSeleccionada = null) {
  // Estado local para almacenar la lista de médicos
  const [medicos, setMedicos] = useState([]);

  useEffect(() => {
    // 1) Determinamos la consulta inicial
    //    Si no hay especialidadSeleccionada, apuntamos a toda la colección "medicos"
    let q = collection(db, "medicos");

    // 2) Si el hook recibe una especialidadSeleccionada (non-null),
    //    construimos una query con where("especialidad", "==", especialidadSeleccionada)
    if (especialidadSeleccionada) {
      q = query(
        collection(db, "medicos"),
        where("especialidad", "==", especialidadSeleccionada)
      );
    }

    // 3) Suscripción en tiempo real a la consulta (q)
    //    onSnapshot() se ejecuta cada vez que cambian los documentos que cumplen esa consulta
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        // Convertimos cada documento en un objeto { id, ...data }
        const arr = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // Ordenamos el arreglo alfabéticamente por el campo 'nombre'
        arr.sort((a, b) => a.nombre.localeCompare(b.nombre));
        // Actualizamos el estado local con la lista resultante
        setMedicos(arr);
      },
      (error) => {
        console.error("Error al leer colección 'medicos':", error);
      }
    );

    // 4) Cleanup: al desmontar o cambiar `especialidadSeleccionada`, cancelamos la suscripción
    return () => unsub();
  }, [especialidadSeleccionada]);

  /**
   * crear:
   *  - Añade un documento a la colección "medicos" con los datos recibidos en `data`.
   *  - `data` debe incluir al menos { nombre, especialidad, telefono }.
   */
  const crear = (data) => addDoc(collection(db, "medicos"), data);

  /**
   * editar:
   *  - Recibe un `id` de documento y un objeto `data` con los campos a actualizar.
   *  - Actualiza el documento en "medicos/{id}" con los nuevos valores.
   */
  const editar = (id, data) => updateDoc(doc(db, "medicos", id), data);

  /**
   * eliminar:
   *  - Borra un médico de la colección "medicos" **y** antes elimina todas las citas asociadas.
   *  - Pasos:
   *      1. Busca en colección "citas" todos los documentos donde medicoId == id.
   *      2. Borra cada uno de esos documentos de "citas".
   *      3. Borra el documento de "medicos/{id}".
   *  - Si ocurre un error en alguna etapa, se propaga la excepción.
   */
  const eliminar = async (id) => {
    try {
      // 1) Construimos la consulta para encontrar todas las citas con ese medicoId
      const citasRef = collection(db, "citas");
      const q = query(citasRef, where("medicoId", "==", id));
      const snapCitas = await getDocs(q);

      // 2) Eliminamos cada cita encontrada de forma paralela
      const borradosCitas = snapCitas.docs.map((cDoc) =>
        deleteDoc(doc(db, "citas", cDoc.id))
      );
      await Promise.all(borradosCitas);

      // 3) Finalmente, borramos el documento del médico
      await deleteDoc(doc(db, "medicos", id));
    } catch (error) {
      console.error("Error eliminando médico y sus citas:", error);
      throw error;
    }
  };

  // Devolvemos el estado y las funciones para uso en componentes consumidores
  return { medicos, crear, editar, eliminar };
}

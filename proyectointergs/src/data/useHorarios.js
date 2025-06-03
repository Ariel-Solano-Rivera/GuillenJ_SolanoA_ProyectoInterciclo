// src/data/useHorarios.js
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../api/firebase';

/*
  Esquema horario:
  {
    medicoId : "abc123",
    dias     : [1,3,5],   // 0-Dom, 1-Lun, … 6-Sáb
    slots    : ["09:00","09:30","10:00"]
  }
*/

export default function useHorarios(medicoId) {
  const [horarios, setHorarios] = useState([]);

  useEffect(() => {
    if (!medicoId) {
      // Si no hay médico seleccionado, forzamos arreglo vacío
      setHorarios([]);
      return;
    }
    // Si sí hay medicoId, suscribimos a Firestore
    const q = query(collection(db, 'horarios'), where('medicoId', '==', medicoId));
    const unsub = onSnapshot(q, (snap) =>
      setHorarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [medicoId]);

  const crear = (dias, slots) =>
    addDoc(collection(db, 'horarios'), { medicoId, dias, slots });

  const eliminar = (id) => deleteDoc(doc(db, 'horarios', id));

  return { horarios, crear, eliminar };
}

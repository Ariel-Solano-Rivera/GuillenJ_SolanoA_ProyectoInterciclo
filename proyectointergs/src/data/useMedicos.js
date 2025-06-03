// src/data/useMedicos.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../api/firebase';

export default function useMedicos() {
  const [medicos, setMedicos] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'medicos'));
    const unsub = onSnapshot(q, (snap) =>
      setMedicos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  const crear = (data) => addDoc(collection(db, 'medicos'), data);
  const editar = (id, data) => updateDoc(doc(db, 'medicos', id), data);
  const eliminar = (id) => deleteDoc(doc(db, 'medicos', id));

  return { medicos, crear, editar, eliminar };
}

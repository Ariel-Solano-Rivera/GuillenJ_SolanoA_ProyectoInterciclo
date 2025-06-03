// src/data/useCitas.js
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../api/firebase';
import { useAuth } from '../autenticacion/ContextoAutenticacion';

// Citas para paciente actual
export function useCitasPaciente() {
  const { usuario } = useAuth();
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    if (!usuario) return;
    const q = query(
      collection(db, 'citas'),
      where('pacienteUid', '==', usuario.uid)
    );
    const unsub = onSnapshot(q, (snap) =>
      setCitas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [usuario]);

  return citas;
}

// Citas para admin
export function useCitasAdmin() {
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    const q = collection(db, 'citas');
    const unsub = onSnapshot(q, (snap) =>
      setCitas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  const confirmar = (id) => updateDoc(doc(db, 'citas', id), { estado: 'confirmada' });

  return { citas, confirmar };
}

export function crearCita({ pacienteUid, medicoId, fechaISO, hora }) {
  const fecha = Timestamp.fromDate(new Date(`${fechaISO}T${hora}:00`));
  return addDoc(collection(db, 'citas'), {
    pacienteUid,
    medicoId,
    dia: new Date(fechaISO).toLocaleDateString('es-ES', { weekday: 'short' }),
    hora,
    slot: fecha,
    estado: 'pendiente',
    especialidad: '', // podrías querer guardar la especialidad directamente
  });
}

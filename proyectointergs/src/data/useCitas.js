import {
  collection, addDoc, updateDoc, doc,
  query, where, onSnapshot, Timestamp
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../api/firebase";

export function useCitasPaciente(uid) {
  const [citas, setCitas] = useState([]);
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "citas"), where("pacienteUid", "==", uid));
    return onSnapshot(q, (s) => setCitas(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [uid]);
  return citas;
}

export function useCitasAdmin() {
  const [citas, setCitas] = useState([]);
  useEffect(() => {
    const q = collection(db, "citas");
    return onSnapshot(q, (s) => setCitas(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, []);
  const confirmar = (id) => updateDoc(doc(db, "citas", id), { estado: "confirmada" });
  return { citas, confirmar };
}

export function crearCita({ pacienteUid, medicoId, fechaISO, hora }) {
  const fecha = Timestamp.fromDate(new Date(`${fechaISO}T${hora}:00`));
  return addDoc(collection(db, "citas"), {
    pacienteUid, medicoId, slot: fecha, estado: "pendiente"
  });
}

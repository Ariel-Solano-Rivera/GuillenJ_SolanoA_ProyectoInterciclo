import {
  collection, addDoc, deleteDoc,
  query, where, onSnapshot, doc
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../api/firebase";

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
    if (!medicoId) return;
    const q = query(collection(db, "horarios"), where("medicoId", "==", medicoId));
    return onSnapshot(q, (snap) =>
      setHorarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [medicoId]);

  const crear = (dias, slots) =>
    addDoc(collection(db, "horarios"), { medicoId, dias, slots });

  const eliminar = (id) => deleteDoc(doc(db, "horarios", id));

  return { horarios, crear, eliminar };
}

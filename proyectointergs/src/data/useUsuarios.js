// src/data/useUsuarios.js
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../api/firebase';

export default function useUsuarios() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'usuarios'), (snap) =>
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  return usuarios;
}

// src/paginas/PaginaPerfilPaciente.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../autenticacion/ContextoAutenticacion";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../api/firebase";

export default function PaginaPerfilPaciente() {
  const { usuario } = useAuth();
  const [phone, setPhone] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarPerfil = async () => {
      const ref = doc(db, "usuarios", usuario.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setPhone(data.phone || "");
      }
      setCargando(false);
    };
    cargarPerfil();
  }, [usuario.uid]);

  const guardarPerfil = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "usuarios", usuario.uid), { phone });
      alert("Perfil actualizado");
    } catch (err) {
      console.error("Error guardando perfil:", err);
      alert("No se pudo guardar el perfil");
    }
  };

  if (cargando) return <p>Cargando perfil…</p>;

  return (
    <div>
      <h2 className="section-title">Mi perfil</h2>
      <div className="card" style={{ maxWidth: "400px" }}>
        <form onSubmit={guardarPerfil}>
          <div className="form-group">
            <label>Nombre:</label>
            <input
              value={usuario.displayName}
              disabled
              style={{ backgroundColor: "var(--color-gris-200)" }}
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              value={usuario.email}
              disabled
              style={{ backgroundColor: "var(--color-gris-200)" }}
            />
          </div>
          <div className="form-group">
            <label>Teléfono:</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Tu número de teléfono"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}

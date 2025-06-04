// src/paginas/PaginaPerfilPaciente.jsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../autenticacion/ContextoAutenticacion";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, updateEmail } from "firebase/auth";
import { db, auth } from "../api/firebase";

export default function PaginaPerfilPaciente() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);

  // Estados para el formulario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Cargar datos iniciales: Firestore almacena el phone; 
  // la Auth trae displayName y email
  useEffect(() => {
    const cargarPerfil = async () => {
      if (!usuario) return;

      // Datos en Firebase Auth
      setNombre(usuario.displayName || "");
      setEmail(usuario.email || "");

      // Datos en Firestore (campo phone)
      try {
        const ref = doc(db, "usuarios", usuario.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setPhone(data.phone || "");
        }
      } catch (err) {
        console.error("Error leyendo perfil en Firestore:", err);
      }

      setLoading(false);
    };
    cargarPerfil();
  }, [usuario]);

  // Guardar cambios: nombre, email y phone
  const guardarPerfil = async (e) => {
    e.preventDefault();
    if (!usuario) return;

    try {
      // 1) Actualizar datos en Firebase Auth: displayName y email
      if (usuario.displayName !== nombre) {
        await updateProfile(auth.currentUser, { displayName: nombre });
      }
      if (usuario.email !== email) {
        await updateEmail(auth.currentUser, email);
      }

      // 2) Actualizar datos en Firestore: teléfono (y opcionalmente puedes sincronizar nombre/email en el doc)
      const ref = doc(db, "usuarios", usuario.uid);
      await updateDoc(ref, {
        displayName: nombre,
        email: email,
        phone: phone,
      });

      alert("Perfil actualizado correctamente.");
    } catch (err) {
      console.error("Error guardando perfil:", err);
      alert("Hubo un error al guardar tu perfil. Revisa la consola.");
    }
  };

  if (loading) return <p>Cargando perfil…</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h2 className="section-title">Mi perfil</h2>
      <div className="card" style={{ padding: "1rem", maxWidth: "400px" }}>
        <form onSubmit={guardarPerfil}>
          {/* Nombre */}
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label>Nombre:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Teléfono */}
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label>Teléfono:</label>
            <input
              type="text"
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

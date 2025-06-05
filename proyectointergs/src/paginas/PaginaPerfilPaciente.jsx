// src/paginas/PaginaPerfilPaciente.jsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../autenticacion/ContextoAutenticacion";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, updateEmail } from "firebase/auth";
import { db, auth } from "../api/firebase";

/**
 * PaginaPerfilPaciente:
 *  - Permite al paciente ver y actualizar su nombre, email y teléfono.
 *  - Sincroniza cambios tanto en Firebase Auth (displayName y email) como en Firestore (campo phone).
 */
export default function PaginaPerfilPaciente() {
  // 1) Obtenemos el usuario autenticado desde el contexto
  const { usuario } = useAuth();
  // loading = true mientras cargamos los datos iniciales desde Auth y Firestore
  const [loading, setLoading] = useState(true);

  // 2) Estados para los campos del formulario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  /**
   * useEffect → cargarPerfil:
   *  - Se ejecuta una vez al montar (o cuando `usuario` cambie).
   *  - Llenamos:
   *      • nombre y email desde usuario.displayName / usuario.email (Firebase Auth).
   *      • phone desde el documento en Firestore /usuarios/{uid}.
   *  - Finalmente, setLoading(false).
   */
  useEffect(() => {
    const cargarPerfil = async () => {
      if (!usuario) return;

      // 2a) Extraer displayName y email directamente de Firebase Auth
      setNombre(usuario.displayName || "");
      setEmail(usuario.email || "");

      // 2b) Leer documento en Firestore para obtener el campo 'phone'
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

      // 2c) Ya cargamos todo, quitamos el indicador de carga
      setLoading(false);
    };

    cargarPerfil();
  }, [usuario]);

  /**
   * guardarPerfil:
   *  - Se invoca al enviar el formulario.
   *  - Actualiza:
   *      1) Firebase Auth: displayName (si cambió) y email (si cambió).
   *      2) Firestore: campo phone (y opcionalmente sincronizar displayName/email allí también).
   *  - Muestra alertas según éxito o error.
   */
  const guardarPerfil = async (e) => {
    e.preventDefault();
    if (!usuario) return;

    try {
      // 3a) Actualizar en Firebase Auth
      if (usuario.displayName !== nombre) {
        await updateProfile(auth.currentUser, { displayName: nombre });
      }
      if (usuario.email !== email) {
        await updateEmail(auth.currentUser, email);
      }

      // 3b) Actualizar en Firestore: campo phone (y sincronizar displayName/email en el documento)
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

  // Mientras cargamos los datos iniciales, mostramos un mensaje de carga
  if (loading) return <p>Cargando perfil…</p>;

  return (
    <div style={{ padding: "1rem" }}>
      {/* Título de la sección */}
      <h2 className="section-title">Mi perfil</h2>
      <div className="card" style={{ padding: "1rem", maxWidth: "400px" }}>
        <form onSubmit={guardarPerfil}>
          {/* Campo: Nombre */}
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label>Nombre:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          {/* Campo: Email */}
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Campo: Teléfono */}
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label>Teléfono:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Tu número de teléfono"
            />
          </div>

          {/* Botón para guardar cambios */}
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}

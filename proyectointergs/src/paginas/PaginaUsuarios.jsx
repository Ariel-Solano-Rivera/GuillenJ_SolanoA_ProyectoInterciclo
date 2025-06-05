// src/paginas/PaginaUsuarios.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Funciones de Firestore para leer, actualizar y borrar documentos
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

// Importamos la instancia de Firestore desde nuestro archivo de configuración
import { db } from "../api/firebase";

/**
 * PaginaUsuarios:
 *  - Muestra todos los usuarios (pacientes y admins) registrados en Firestore.
 *  - Permite:
 *      1) Filtrar por rol (paciente, admin o todos).
 *      2) Buscar por nombre o correo.
 *      3) Cambiar el rol de un usuario (admin ↔ paciente).
 *      4) Eliminar un usuario y todas sus citas asociadas en Firestore.
 *
 *  *** ATENCIÓN: Este código NO BORRA al usuario de Firebase Authentication. ***
 *  Si solo borras su documento en Firestore, el usuario **seguirá existiendo** en
 *  la pestaña "Authentication → Usuarios" de la consola, y por ello no podrás
 *  volver a registrarlo (te dará error "El correo ya existe").
 *
 *  Para eliminarlo también de Authentication, debes:
 *    1. Ir a Firebase Console → Authentication → Usuarios.
 *    2. Buscar el correo/UID que deseas eliminar.
 *    3. Hacer clic en los “⋮” y elegir “Eliminar usuario”.
 *
 *  Solo así quedará completamente borrado (Auth + Firestore) y podrás volver a registrarlo.
 */
export default function PaginaUsuarios() {
  // Hook para navegar de forma programática (por ejemplo, volver al panel Admin)
  const navigate = useNavigate();

  // ── Estados para guardar datos locales ──────────────────────────────────────
  //  • usuarios: arreglo con todos los usuarios obtenidos de Firestore
  //  • roleFilter: rol seleccionado para filtrar ("all", "paciente", "admin")
  //  • searchTerm: término de búsqueda para nombre o correo
  const [usuarios, setUsuarios] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // ── 1) Cargar todos los usuarios ────────────────────────────────────────────
  //    Este efecto se ejecuta una sola vez al montar el componente
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // 1.1) Obtenemos snapshot de todos los docs en la colección "usuarios"
        const snap = await getDocs(collection(db, "usuarios"));
        // 1.2) Mapeamos cada documento a { id, ...datos }
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // 1.3) Actualizamos el estado local con el arreglo de usuarios
        setUsuarios(arr);
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      }
    };
    fetchUsers();
  }, []); // [] asegura que sólo corra al montar

  /**
   * toggleRole:
   *  - Cambia el campo `role` de un usuario de "admin" a "paciente" o viceversa.
   *  - Actualiza Firestore y luego actualiza estado local para reflejar el cambio.
   */
  const toggleRole = async (usuario) => {
    // 2.1) Determinamos el nuevo rol según el actual
    const nuevoRole = usuario.role === "admin" ? "paciente" : "admin";
    try {
      // 2.2) Actualizamos Firestore: colección "usuarios/{uid}"
      await updateDoc(doc(db, "usuarios", usuario.id), { role: nuevoRole });
      // 2.3) Actualizamos el estado local para reflejarlo inmediatamente
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, role: nuevoRole } : u
        )
      );
    } catch (error) {
      console.error("Error cambiando rol:", error);
      alert("No se pudo cambiar el rol. Intenta de nuevo.");
    }
  };

  /**
   * eliminarUsuario:
   *  - Borra un usuario de Firestore **y** todas sus citas en la colección "citas".
   *  - NO elimina al usuario de Firebase Authentication: hay que hacerlo manualmente
   *    desde la consola si se desea que el correo se pueda volver a registrar.
   */
  const eliminarUsuario = async (usuario) => {
    // 3.1) Confirmar acción con el usuario (modal del navegador)
    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar al usuario "${usuario.displayName ||
        usuario.email}" y todas sus citas?`
    );
    if (!confirmDelete) return;

    try {
      // ─── Paso 1: Borrar todas las citas donde pacienteUid == usuario.id ───────
      const citasRef = collection(db, "citas");
      const q = query(citasRef, where("pacienteUid", "==", usuario.id));
      const snapCitas = await getDocs(q);

      // 3.2) Eliminamos cada cita encontrada en paralelo
      const borradosCitas = snapCitas.docs.map((cDoc) =>
        deleteDoc(doc(db, "citas", cDoc.id))
      );
      await Promise.all(borradosCitas);

      // ─── Paso 2: Borrar el documento del usuario en Firestore ────────────────
      await deleteDoc(doc(db, "usuarios", usuario.id));

      // 3.3) Actualizamos estado local para removerlo de la lista visible
      setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));

      // 3.4) Mensaje final
      alert(
        "Usuario y todas sus citas se eliminaron correctamente de Firestore.\n\n" +
        "RECUERDA: Para que el correo quede libre y puedas volver a registrarlo,\n" +
        "también debes eliminar manualmente al usuario desde Firebase Console → Authentication → Usuarios."
      );
    } catch (error) {
      console.error("Error eliminando usuario y sus citas:", error);
      alert("Hubo un error al eliminar. Inténtalo de nuevo.");
    }
  };

  // ── 4) Filtrar usuarios según rol y búsqueda ────────────────────────────────
  const filtered = usuarios.filter((u) => {
    // 4.1) Si roleFilter != "all", descartamos usuarios cuyo rol no coincida
    if (roleFilter !== "all" && u.role !== roleFilter) return false;

    // 4.2) Si hay searchTerm, buscamos coincidencia en nombre o email (minuscula)
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const nombre = (u.displayName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return nombre.includes(term) || email.includes(term);
    }
    return true;
  });

  return (
    <div style={{ padding: "1rem" }}>
      {/* Botón para volver al panel principal de Admin */}
      <button
        onClick={() => navigate("/admin")}
        style={{
          marginBottom: "1rem",
          color: "#1D4ED8",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        {"<- Volver"}
      </button>

      {/* Título de la sección */}
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Usuarios</h2>

      {/* ── Controles de filtrado ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {/* Selector de rol */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: "500", marginBottom: "0.25rem" }}>
            Filtrar por rol:
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #D1D5DB",
              minWidth: "120px",
            }}
          >
            <option value="all">Todos</option>
            <option value="paciente">Paciente</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Input de búsqueda por nombre o correo */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: "500", marginBottom: "0.25rem" }}>
            Buscar:
          </label>
          <input
            type="text"
            placeholder="Nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #D1D5DB",
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* ── Tabla de usuarios filtrados ─────────────────────────────────────── */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "600px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#F3F4F6" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                Nombre
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                Email
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                Rol
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                {/* Nombre del usuario; si no hay displayName, mostramos "—" */}
                <td style={{ padding: "0.75rem 1rem" }}>
                  {u.displayName || "—"}
                </td>

                {/* Email del usuario */}
                <td style={{ padding: "0.75rem 1rem" }}>{u.email}</td>

                {/* Rol del usuario (centrado y capitalizado) */}
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "center",
                    textTransform: "capitalize",
                  }}
                >
                  {u.role}
                </td>

                {/* Botones de acción para cada usuario */}
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Botón Cambiar rol */}
                  <button
                    onClick={() => toggleRole(u)}
                    style={{
                      backgroundColor: "#1D4ED8",
                      color: "#FFF",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Cambiar a {u.role === "admin" ? "paciente" : "admin"}
                  </button>

                  {/* Botón Eliminar → llama a eliminarUsuario(u) */}
                  <button
                    onClick={() => eliminarUsuario(u)}
                    style={{
                      backgroundColor: "#DC2626",
                      color: "#FFF",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                {/* Mensaje cuando no hay usuarios que coincidan */}
                <td
                  colSpan="4"
                  style={{
                    textAlign: "center",
                    padding: "1rem",
                    color: "#6B7280",
                  }}
                >
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

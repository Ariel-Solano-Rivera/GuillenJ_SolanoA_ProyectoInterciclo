// src/paginas/PaginaUsuarios.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../api/firebase";

export default function PaginaUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "usuarios"));
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchUsers();
  }, []);

  // Cambiar rol
  const toggleRole = async (u) => {
    const newRole = u.role === "admin" ? "paciente" : "admin";
    await updateDoc(doc(db, "usuarios", u.id), { role: newRole });
    setUsuarios((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x))
    );
  };

  // Filtrar lista
  const filtered = usuarios.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const nombre = (u.displayName || "").toLowerCase();
      const mail = (u.email || "").toLowerCase();
      return nombre.includes(term) || mail.includes(term);
    }
    return true;
  });

  return (
    <div>
      <button
        onClick={() => navigate("/admin")}
        style={{ marginBottom: "1rem", color: "var(--color-azul-principal)" }}
      >
        {"<- Volver"}
      </button>
      <h2 className="section-title">Usuarios</h2>

      {/* FILTROS */}
      <div className="filter-container">
        <div className="filter-group">
          <label>Filtrar por rol:</label>
          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="paciente">Paciente</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="filter-group" style={{ flex: 1 }}>
          <label>Buscar:</label>
          <input
            type="text"
            placeholder="Nombre o correo..."
            className="filter-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th style={{ textAlign: "center" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.displayName || "—"}</td>
                <td>{u.email}</td>
                <td style={{ textTransform: "capitalize" }}>{u.role}</td>
                <td style={{ textAlign: "center" }}>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
                    onClick={() => toggleRole(u)}
                  >
                    Cambiar a {u.role === "admin" ? "paciente" : "admin"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "1rem" }}>
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

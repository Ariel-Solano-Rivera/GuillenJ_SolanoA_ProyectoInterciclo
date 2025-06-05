// src/paginas/PaginaLogin.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../autenticacion/ContextoAutenticacion";

export default function PaginaLogin() {
  // Extraemos del contexto de autenticación:
  //  • usuario: objeto con datos del usuario si ya está autenticado, o null si no.
  //  • rol: "admin" o "paciente", según el perfil en Firestore.
  //  • loginGoogle: función para iniciar sesión/registro con Google.
  //  • loginCorreo: función para iniciar sesión con email/contraseña.
  //  • registrar: función para crear un nuevo usuario con email/contraseña.
  //  • cargando: booleano que indica si aún se está determinando el estado de autenticación.
  const { usuario, rol, loginGoogle, loginCorreo, registrar, cargando } =
    useAuth();

  const navigate = useNavigate();

  // Si ya hay sesión y ya sabemos el rol (cargando == false),
  // redirigimos automáticamente al panel correspondiente.
  useEffect(() => {
    if (!cargando && usuario) {
      if (rol === "admin") navigate("/admin", { replace: true });
      else if (rol === "paciente") navigate("/paciente", { replace: true });
    }
  }, [usuario, rol, cargando, navigate]);

  // Estado local para alternar entre login y registro
  const [esRegistro, setEsRegistro] = useState(false);
  // Estado para los campos del formulario: { nombre, email, pass }
  const [form, setForm] = useState({ nombre: "", email: "", pass: "" });
  // Estado para mostrar mensajes de error al usuario
  const [err, setErr] = useState("");

  // handleChange: actualiza el estado `form` cuando el usuario escribe en un input
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // handleSubmit: se invoca al enviar el formulario (login o registro)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (esRegistro) {
        // Crear nueva cuenta con email, contraseña y nombre (modo registro)
        await registrar(form.email, form.pass, form.nombre);
      } else {
        // Iniciar sesión con email y contraseña (modo login)
        await loginCorreo(form.email, form.pass);
      }
      // Si se completa sin errores, el onAuthStateChanged se encargará de redirigir
    } catch (e) {
      const code = e.code || "";
      if (code.includes("email-already-in-use")) {
        setErr("Ese correo ya está registrado. Inicia sesión o usa otro.");
        setEsRegistro(false);
      } else if (code.includes("weak-password")) {
        setErr("La contraseña debe tener al menos 6 caracteres.");
      } else if (
        code.includes("wrong-password") ||
        code.includes("user-not-found")
      ) {
        setErr("Correo o contraseña incorrectos.");
      } else {
        setErr(e.message);
      }
    }
  };

  // ─── NUEVO MÉTODO: handleGoogle ─────────────────────────────────────────────────
  //  • Si esRegistro=true → intentamos registrar con Google; si el correo ya existe, mostramos error.
  //  • Si esRegistro=false → intentamos login con Google.
  //  • En ambos casos, envolvemos loginGoogle(...) en try/catch para capturar el mensaje de error.
  const handleGoogle = async () => {
    setErr("");
    try {
      // Se pasa esRegistro para que el Contexto distinga registro vs login
      await loginGoogle(esRegistro);
      // Si no hay error, onAuthStateChanged se encargará de redirigir según el rol
    } catch (e) {
      // Si hubo error (por ejemplo, correo ya registrado en modo registro),
      // lo mostramos al usuario en `err`.
      setErr(e.message);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="app-container"
      // Centra vertical y horizontalmente el contenido
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      <div
        className="card"
        // Limita ancho máximo, margena para centrar y agrega padding
        style={{ maxWidth: "400px", margin: "2rem auto", padding: "2rem" }}
      >
        {/* Título del formulario */}
        <h1
          style={{
            textAlign: "center",
            marginBottom: "1rem",
            fontSize: "1.5rem",
          }}
        >
          Agenda Médica
        </h1>

        {/* Si existe mensaje de error, mostrarlo en un recuadro rojo */}
        {err && (
          <p
            style={{
              backgroundColor: "#dc2626",
              color: "#fff",
              padding: "0.75rem",
              borderRadius: "4px",
              marginBottom: "1rem",
              fontSize: "0.9rem",
              textAlign: "center",
            }}
          >
            {err}
          </p>
        )}

        {/* ── FORMULARIO LOGIN/REGISTRO ──────────────────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          {/* Si estamos en modo registro, mostramos el campo “Nombre completo” */}
          {esRegistro && (
            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="pass"
              value={form.pass}
              onChange={handleChange}
              required
            />
          </div>

          {/* Botón principal: cambia el texto según si es registro o login */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            {esRegistro ? "Registrarme" : "Iniciar sesión"}
          </button>
        </form>
        {/* ──────────────────────────────────────────────────────────────────────── */}

        {/* ── BOTÓN PARA INICIAR/REGISTRAR CON GOOGLE ────────────────────────────── */}
        <button
          onClick={handleGoogle}
          className="btn"
          style={{
            width: "100%",
            backgroundColor: "#fff",
            color: "#374151",
            border: "1px solid var(--color-gris-300)",
            marginTop: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google"
            style={{ width: "20px", height: "20px", marginRight: "0.5rem" }}
          />
          <span>Continuar con Google</span>
        </button>
        {/* ──────────────────────────────────────────────────────────────────────── */}

        {/* Alternar entre modo Login y Registro */}
        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
          {esRegistro ? "¿Ya tienes cuenta?" : "¿Eres nuevo aquí?"}{" "}
          <button
            onClick={() => setEsRegistro(!esRegistro)}
            style={{
              color: "var(--color-azul-principal)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {esRegistro ? "Inicia sesión" : "Crea una cuenta"}
          </button>
        </p>

        {/* Nota: se eliminó por completo la sección "¿Olvidaste tu contraseña?" */}
      </div>
    </div>
  );
}

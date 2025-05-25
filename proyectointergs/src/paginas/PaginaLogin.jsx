import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../autenticacion/ContextoAutenticacion";

export default function PaginaLogin() {
  const {
    usuario, rol,
    loginGoogle, loginCorreo, registrar, olvidarPass, logout
  } = useAuth();

  const navigate = useNavigate();

  /* redirección si ya hay sesión */
  useEffect(() => {
    if (usuario && rol === "admin")    navigate("/admin",    { replace: true });
    if (usuario && rol === "paciente") navigate("/paciente", { replace: true });
  }, [usuario, rol, navigate]);

  /* estado del formulario */
  const [esRegistro, setRegistro] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", pass: "" });
  const [err, setErr] = useState("");

  const handle = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (esRegistro) {
        await logout();
        await registrar(form.email, form.pass, form.nombre);
      } else {
        await loginCorreo(form.email, form.pass);
      }
    } catch (e) {
      switch (e.code) {
        case "auth/email-already-in-use":
          setErr("Ese correo ya está registrado. Inicia sesión o usa otro.");
          setRegistro(false);
          break;
        case "auth/weak-password":
          setErr("La contraseña debe tener al menos 6 caracteres.");
          break;
        case "auth/invalid-login-credentials":
          setErr("Correo o contraseña incorrectos.");
          break;
        default:
          setErr(e.message);
      }
      if (e.message.includes("Google ya está registrado")) {
        setErr(e.message);
        setRegistro(false);
      }
    }
  };

  const resetPass = async () => {
    if (!form.email) return setErr("Escribe tu correo arriba primero");
    try {
      await olvidarPass(form.email);
      alert("Te enviamos el enlace para cambiar contraseña");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
      <div className="bg-black/80 p-8 rounded-lg w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Agenda&nbsp;Médica</h1>

        {err && <p className="bg-red-600 text-sm p-2 rounded">{err}</p>}

        <form onSubmit={submit} className="space-y-4">
          {esRegistro && (
            <input
              name="nombre"
              placeholder="Nombre"
              className="w-full p-3 bg-neutral-800 rounded"
              onChange={handle}
              value={form.nombre}
            />
          )}

          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full p-3 bg-neutral-800 rounded"
            onChange={handle}
            value={form.email}
          />

          <input
            name="pass"
            type="password"
            required
            placeholder="Contraseña"
            className="w-full p-3 bg-neutral-800 rounded"
            onChange={handle}
            value={form.pass}
          />

          <button className="w-full bg-red-600 hover:bg-red-700 p-3 rounded font-semibold">
            {esRegistro ? "Registrarme" : "Iniciar sesión"}
          </button>
        </form>

        {!esRegistro && (
          <button onClick={resetPass} className="text-xs underline block">
            ¿Olvidaste tu contraseña?
          </button>
        )}

        {/* Botón Google: pasa esRegistro para detectar intento de alta */}
        <button
          onClick={() => loginGoogle(esRegistro)}
          className="w-full bg-white text-black hover:bg-gray-200 p-3 rounded"
        >
          Continuar con Google
        </button>

        <p className="text-xs text-center text-gray-400">
          {esRegistro ? "¿Ya tienes cuenta?" : "¿Eres nuevo aquí?"}{" "}
          <span
            onClick={() => setRegistro(!esRegistro)}
            className="underline cursor-pointer text-white"
          >
            {esRegistro ? "Inicia sesión" : "Crea una cuenta"}
          </span>
        </p>
      </div>
    </div>
  );
}

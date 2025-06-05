// src/paginas/PaginaAdmin.jsx

import { useState } from 'react';
import { useAuth } from '../autenticacion/ContextoAutenticacion';
import useMedicos from '../data/useMedicos';
import useHorarios from '../data/useHorarios';
import CitasAdmin from '../componentes/CitasAdmin';     // Tabla que muestra todas las citas para el administrador
import useUsuarios from '../data/useUsuarios';
import DoctorForm from '../componentes/DoctorForm';
import DoctorList from '../componentes/DoctorList';
import HorarioForm from '../componentes/HorarioForm';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../api/firebase';

/**
 * PaginaAdmin:
 *  - Panel principal que ve el administrador.
 *  - Permite:
 *      1) Registrar y listar médicos
 *      2) Definir horarios para un médico
 *      3) Ver y confirmar citas
 *      4) Promover usuarios a administrador
 */
export default function PaginaAdmin() {
  // 1) Obtenemos usuario autenticado y la función logout
  const { usuario, logout } = useAuth();

  // 2) Cargamos todos los médicos en tiempo real, y obtenemos la función crearMedico
  const { medicos, crear: crearMedico } = useMedicos();

  // Estado local para saber qué médico está seleccionado al definir horarios
  const [medicoSel, setMedicoSel] = useState('');

  // 3) Cargamos los horarios del médico seleccionado, y obtenemos la función crearHorario
  const { horarios, crear: crearHorario } = useHorarios(medicoSel);

  // 4) Obtenemos todos los usuarios (con sus datos: id, displayName, email, role, etc.)
  const usuarios = useUsuarios();

  // Estado local para almacenar el correo del usuario que queremos promover a admin
  const [nuevoAdmin, setNuevoAdmin] = useState('');

  /**
   * promover:
   *  - Se ejecuta al enviar el formulario de promoción de usuario.
   *  - Busca en `usuarios` aquel cuyo email coincida con `nuevoAdmin`.
   *  - Si no existe, alerta al administrador.
   *  - Si existe, actualiza su rol en Firestore a "admin".
   *  - Finalmente, muestra confirmación o un mensaje de error según corresponda.
   */
  const promover = async (e) => {
    e.preventDefault();

    // Buscamos el usuario por email en la lista cargada
    const usr = usuarios.find(u => u.email === nuevoAdmin);
    if (!usr) {
      alert('No existe usuario con ese correo');
      return;
    }

    try {
      // Actualizamos el documento en "usuarios/{usr.id}", cambiando role a "admin"
      await updateDoc(doc(db, 'usuarios', usr.id), { role: 'admin' });
      alert('Usuario promovido a administrador');
      setNuevoAdmin(''); // Limpiamos el input
    } catch (err) {
      console.error('Error promoviendo:', err);
      alert('No se pudo promover al usuario');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ====== Header ====== */}
      <header className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
        {/* Título fijo para el panel */}
        <span className="font-semibold">Panel Administrador</span>
        <div className="flex gap-4 items-center">
          {/* Mostramos el email del administrador actual */}
          <span className="hidden sm:block">{usuario.email}</span>
          {/* Botón para cerrar sesión */}
          <button onClick={logout} className="btn-xs bg-red-600">
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* ====== Contenido principal ====== */}
      <main className="p-6 space-y-10">

        {/* ───────────────────────────────────────────────
            1. Registro de médicos
            ─────────────────────────────────────────────── */}
        <section className="space-y-4 p-4 border rounded shadow-sm">
          <h2 className="text-xl font-semibold">1. Registro de médicos</h2>
          {/* Formulario para ingresar datos de un nuevo médico */}
          <DoctorForm onSave={crearMedico} />
          {/* Lista de médicos actuales con opción de eliminar */}
          <DoctorList medicos={medicos} />
        </section>

        {/* ───────────────────────────────────────────────
            2. Horarios por médico
            ─────────────────────────────────────────────── */}
        <section className="space-y-4 p-4 border rounded shadow-sm">
          <h2 className="text-xl font-semibold">2. Horarios por médico</h2>
          {/* Select para elegir un médico; al cambiar, actualiza medicoSel */}
          <select
            value={medicoSel}
            onChange={(e) => setMedicoSel(e.target.value)}
            className="input"
          >
            <option value="">-- Selecciona médico --</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>

          {/* Sólo mostramos el formulario y la lista de horarios si hay médico seleccionado */}
          {medicoSel && (
            <>
              {/* Formulario para agregar un nuevo horario al médico seleccionado */}
              <HorarioForm onSave={crearHorario} />
              {/* Lista de horarios actuales para ese médico */}
              <ul className="list-disc pl-5 mt-2">
                {horarios.map((h) => (
                  <li key={h.id}>
                    {/* Convertimos los índices de días a etiquetas cortas y las mostramos */}
                    {h.dias
                      .map((d) => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d])
                      .join(', ')}
                    : {h.slots.join(', ')}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* ───────────────────────────────────────────────
            3. Citas
            ─────────────────────────────────────────────── */}
        <section className="space-y-4 p-4 border rounded shadow-sm">
          <h2 className="text-xl font-semibold">3. Citas</h2>
          {/* Componente que muestra todas las citas (pendientes y confirmadas) */}
          <CitasAdmin />
        </section>

        {/* ───────────────────────────────────────────────
            4. Promover usuario a admin
            ─────────────────────────────────────────────── */}
        <section className="space-y-4 p-4 border rounded shadow-sm">
          <h2 className="text-xl font-semibold">4. Promover usuario a admin</h2>
          <form onSubmit={promover} className="flex gap-2">
            {/* Input para escribir el correo del usuario a promover */}
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className="input flex-1"
              value={nuevoAdmin}
              onChange={(e) => setNuevoAdmin(e.target.value)}
              required
            />
            {/* Botón para disparar la promoción */}
            <button className="btn">Promover</button>
          </form>
        </section>

      </main>
    </div>
  );
}

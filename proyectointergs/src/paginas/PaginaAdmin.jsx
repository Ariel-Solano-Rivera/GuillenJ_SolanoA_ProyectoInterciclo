import { useState } from "react";
import { useAuth } from "../autenticacion/ContextoAutenticacion";
import useMedicos from "../data/useMedicos";
import DoctorForm from "../componentes/DoctorForm";
import DoctorList from "../componentes/DoctorList";
import HorarioForm from "../componentes/HorarioForm";
import useHorarios from "../data/useHorarios";
import CitasAdmin from "../componentes/CitasAdmin";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../api/firebase";
import useUsuarios from "../data/useUsuarios";

export default function PaginaAdmin() {
  const { usuario, logout } = useAuth();
  const { medicos, crear: crearMedico } = useMedicos();
  const usuarios = useUsuarios();

  const [medicoSel, setMedicoSel] = useState("");
  const { horarios, crear: crearHorario } = useHorarios(medicoSel);

  const [nuevoAdmin, setNuevoAdmin] = useState("");

  const promover = async (e)=>{
    e.preventDefault();
    const usr = usuarios.find(u=>u.email===nuevoAdmin);
    if(!usr) return alert("No existe usuario con ese correo");
    await updateDoc(doc(db,"usuarios",usr.id),{ role:"admin" });
    alert("Usuario promovido a administrador");
    setNuevoAdmin("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white px-6 py-3 flex justify-between">
        <span>Panel Administrador</span>
        <div className="flex gap-4">
          <span className="hidden sm:block">{usuario.email}</span>
          <button onClick={logout} className="btn-xs bg-red-600">Cerrar sesión</button>
        </div>
      </header>

      <main className="p-6 space-y-10">

        {/* Sección médicos ------------------------------------------------ */}
        <section className="space-y-4 p-4 border rounded">
          <h2 className="text-xl font-semibold">1. Registro de médicos</h2>
          <DoctorForm onSave={crearMedico} />
          <DoctorList medicos={medicos} />
        </section>

        {/* Sección horarios ---------------------------------------------- */}
        <section className="space-y-4 p-4 border rounded">
          <h2 className="text-xl font-semibold">2. Horarios por médico</h2>
          <select value={medicoSel} onChange={(e)=>setMedicoSel(e.target.value)} className="input">
            <option value="">-- Selecciona médico --</option>
            {medicos.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>

          {medicoSel && (
            <>
              <HorarioForm onSave={crearHorario} />
              <ul className="list-disc pl-5">
                {horarios.map(h=>(
                  <li key={h.id}>
                    {h.dias.map(d=>["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][d]).join(", ")}
                    : {h.slots.join(", ")}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Sección citas -------------------------------------------------- */}
        <section className="space-y-4 p-4 border rounded">
          <h2 className="text-xl font-semibold">3. Citas</h2>
          <CitasAdmin />
        </section>

        {/* Sección alta de administradores ------------------------------- */}
        <section className="space-y-4 p-4 border rounded">
          <h2 className="text-xl font-semibold">4. Crear nuevo administrador</h2>
          <form onSubmit={promover} className="flex gap-2">
            <input type="email" placeholder="correo@ejemplo.com"
                   className="input flex-1"
                   value={nuevoAdmin} onChange={(e)=>setNuevoAdmin(e.target.value)} required />
            <button className="btn">Promover</button>
          </form>
        </section>
      </main>
    </div>
  );
}

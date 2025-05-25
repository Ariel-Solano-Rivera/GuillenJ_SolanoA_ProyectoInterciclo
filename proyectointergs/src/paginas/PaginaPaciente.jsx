import { useAuth } from "../autenticacion/ContextoAutenticacion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../api/firebase";
import { useState } from "react";
import CitaForm from "../componentes/CitaForm";
import CitasPaciente from "../componentes/CitasPaciente";

export default function PaginaPaciente() {
  const { usuario, logout } = useAuth();
  const [phone, setPhone] = useState(usuario.phone || "");

  const guardarPerfil = async (e)=>{
    e.preventDefault();
    await updateDoc(doc(db,"usuarios",usuario.uid),{ phone });
    alert("Perfil actualizado");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white px-6 py-3 flex justify-between">
        <span>Portal Paciente</span>
        <button onClick={logout} className="btn-xs bg-red-600">Cerrar sesión</button>
      </header>

      <main className="p-6 space-y-8">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Mi perfil</h2>
          <form onSubmit={guardarPerfil} className="space-y-2">
            <input value={phone} onChange={(e)=>setPhone(e.target.value)}
                   placeholder="Teléfono" className="input" />
            <button className="btn">Guardar</button>
          </form>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Solicitar cita</h2>
          <CitaForm />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Mis citas</h2>
          <CitasPaciente />
        </section>
      </main>
    </div>
  );
}

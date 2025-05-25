import { useAuth } from "../autenticacion/ContextoAutenticacion";

export default function PaginaPaciente() {
  const { usuario, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra superior */}
      <header className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
        <span className="font-semibold">Portal Paciente</span>

        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-sm">{usuario.email}</span>

          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="p-8">
        <h2 className="text-2xl font-bold mb-4">
          Bienvenido&nbsp;Paciente
          {usuario.displayName && `, ${usuario.displayName}`}
        </h2>

        {/* Aquí irá el formulario para solicitar citas, etc. */}
      </main>
    </div>
  );
}

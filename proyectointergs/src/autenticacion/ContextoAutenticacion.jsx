// src/autenticacion/ContextoAutenticacion.jsx

import React, { createContext, useContext, useEffect, useState } from 'react';
// Importamos los métodos de autenticación de Firebase Auth
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getAdditionalUserInfo,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
// Importamos funciones para leer/escribir en Firestore
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase'; // Nuestra configuración de Firebase

// Creamos un Contexto para proveer estado y métodos de autenticación
const Ctx = createContext();

// Configuramos el proveedor de Google para login con popup
const googleProvider = new GoogleAuthProvider();
// Esto fuerza a que siempre muestre el selector de cuentas de Google
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * ProveedorAutenticacion:
 *  - Envuelve la aplicación y expone datos del usuario, rol, estado de carga y métodos
 *    para iniciar/cerrar sesión, registrar, resetear contraseña, etc.
 */
export function ProveedorAutenticacion({ children }) {
  // Estado local para mantener datos del usuario autenticado
  const [usuario, setUsuario]   = useState(null);
  // Estado local para guardar el rol ('admin' o 'paciente')
  const [rol, setRol]           = useState(null);
  // Indicador de carga inicial (mientras Firebase verifica si ya hay sesión)
  const [cargando, setCargando] = useState(true);

  /**
   * upsertDocUsuario:
   *  - Verifica si existe un documento en /usuarios/{uid} en Firestore
   *  - Si no existe, lo crea con role='paciente' y devuelve 'paciente'
   *  - Si ya existe, lee su campo 'role' y lo retorna (no lo sobreescribe)
   *
   *  De esta manera, la primera vez que un usuario se autentica (sea por Google
   *  o email/password), se crea automáticamente su perfil en Firestore.
   */
  const upsertDocUsuario = async (cred) => {
    const ref  = doc(db, 'usuarios', cred.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // Si no hay documento previo, creamos uno nuevo con información mínima
      await setDoc(ref, {
        displayName: cred.displayName || '',
        email:       cred.email,
        role:        'paciente',      // Por defecto, todo usuario nuevo es 'paciente'
        createdAt:   new Date(),
      });
      return 'paciente';
    } else {
      // Si ya existe el perfil, simplemente devolvemos el rol que ya está almacenado
      const data = snap.data();
      return data.role || 'paciente';
    }
  };

  /**
   * Listener de Firebase Auth (onAuthStateChanged):
   *  - Se ejecuta cada vez que cambia el estado de autenticación (login/logout, etc.)
   *  - Si no hay credenciales (cred es null), resetea usuario y rol, indica que ya terminó carga.
   *  - Si cred existe, intenta crear/leer su perfil en Firestore vía upsertDocUsuario.
   *  - En caso de error al leer/crear, cierra la sesión y deja todo en null.
   *  - Finalmente, marca que la carga inicial ya terminó (setCargando(false)).
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (cred) => {
      if (!cred) {
        // No hay usuario autenticado → reseteamos estado y terminamos carga
        setUsuario(null);
        setRol(null);
        setCargando(false);
        return;
      }

      // Hay usuario: creamos o leemos el perfil de Firestore
      try {
        const rolActual = await upsertDocUsuario(cred);
        setUsuario(cred);
        setRol(rolActual);
      } catch (err) {
        console.error('Error leyendo/creando usuario en Firestore:', err);
        // Si ocurre un fallo, forzamos cierre de sesión y reseteamos estado
        await signOut(auth);
        setUsuario(null);
        setRol(null);
      }
      // Marcamos que ya no estamos en estado "cargando"
      setCargando(false);
    });

    // Cleanup: eliminar listener al desmontar
    return () => unsubscribe();
  }, []);

  /* ─── MÉTODOS PÚBLICOS QUE EXPONEMOS A TRAVÉS DEL CONTEXTO ────────────────── */

  /**
   * loginGoogle:
   *  - Si intentoRegistro = false: intenta login con popup de Google.
   *    • Si fuera bloqueado el popup (error 'auth/popup-blocked'), recurre a redirect.
   *  - Si intentoRegistro = true: valida que sea un usuario nuevo; si no lo es, aborta.
   *  - Devuelve las credenciales que Firebase retorna.
   */
  const loginGoogle = async (intentoRegistro = false) => {
    try {
      // Intentamos iniciar sesión con popup
      const cred = await signInWithPopup(auth, googleProvider);
      const info = getAdditionalUserInfo(cred);

      if (intentoRegistro && !info.isNewUser) {
        // Si estamos en modo registro y el correo ya existe, cancelamos
        await signOut(auth);
        throw new Error('Ese correo de Google ya está registrado. Inicia sesión.');
      }
      return cred;
    } catch (err) {
      if (err.code === 'auth/popup-blocked') {
        // Si el popup está bloqueado, usamos el flujo de redirección
        const cred = await signInWithRedirect(auth, googleProvider);
        const info = getAdditionalUserInfo(cred);
        if (intentoRegistro && !info.isNewUser) {
          // Mismo chequeo en flujo de redirect
          await signOut(auth);
          throw new Error('Ese correo de Google ya está registrado. Inicia sesión.');
        }
        return cred;
      }
      // Cualquier otro error se propaga
      throw err;
    }
  };

  /**
   * loginCorreo:
   *  - Permite iniciar sesión con correo y contraseña.
   *  - Devuelve la promesa de Firebase (signInWithEmailAndPassword).
   */
  const loginCorreo = (email, pass) =>
    signInWithEmailAndPassword(auth, email, pass);

  /**
   * registrar:
   *  - Crea una cuenta con email + contraseña en Firebase Auth.
   *  - Opcionalmente, actualiza el displayName en el perfil Auth.
   *  - Luego, crea manualmente el documento en /usuarios/{newUser.uid} con role='paciente'.
   */
  const registrar = async (email, pass, nombre) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, pass);
    if (nombre) {
      // Si se pasa un nombre, lo guardamos en el perfil de autenticación
      await updateProfile(newUser, { displayName: nombre });
    }
    // Creamos el perfil en Firestore como paciente recién registrado
    await setDoc(doc(db, 'usuarios', newUser.uid), {
      displayName: newUser.displayName || '',
      email:       newUser.email,
      role:        'paciente',
      createdAt:   new Date(),
    });
  };

   /**
   * logout:
   *  - Cierra sesión en Firebase Auth.
   */
  const logout = () => signOut(auth);

  // Proveemos valor del contexto con estado y métodos disponibles
  return (
    <Ctx.Provider
      value={{
        usuario,    // objeto de credenciales de Firebase Auth (o null si no hay sesión)
        rol,        // 'admin' o 'paciente' (valor leído/creado en Firestore)
        cargando,   // booleano: true mientras verificamos estado inicial de sesión
        loginGoogle,
        loginCorreo,
        registrar,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

/**
 * useAuth:
 *  - Hook personalizado para consumir nuestro Contexto de autenticación en cualquier componente.
 *  - Permite extraer { usuario, rol, cargando, loginGoogle, ... } de forma sencilla.
 */
export const useAuth = () => useContext(Ctx);

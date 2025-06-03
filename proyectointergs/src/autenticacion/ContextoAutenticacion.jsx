// src/autenticacion/ContextoAutenticacion.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getAdditionalUserInfo,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase';

const Ctx = createContext();
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function ProveedorAutenticacion({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol]         = useState(null);   // 'admin' | 'paciente'
  const [cargando, setCargando] = useState(true);

  /** 
   * upsertDocUsuario: 
   *  - Si no existe /usuarios/{uid}, lo crea con role='paciente'.
   *  - Si ya existe, SOLO lee su campo 'role' (no lo sobreescribe).
   */
  const upsertDocUsuario = async (cred) => {
    const ref = doc(db, 'usuarios', cred.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // Primera vez: crear el documento
      await setDoc(ref, {
        displayName: cred.displayName || '',
        email:       cred.email,
        role:        'paciente',
        createdAt:   new Date(),
      });
      return 'paciente';
    } else {
      // Si existe: devolvemos el role almacenado
      const data = snap.data();
      return data.role || 'paciente';
    }
  };

  /* Listener de Firebase Auth */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (cred) => {
      if (!cred) {
        // No hay usuario autenticado
        setUsuario(null);
        setRol(null);
        setCargando(false);
        return;
      }

      // Usuario autenticado: obtener o crear su perfil en Firestore
      try {
        const rolActual = await upsertDocUsuario(cred);
        setUsuario(cred);
        setRol(rolActual);
      } catch (err) {
        console.error('Error leyendo/creando usuario en Firestore:', err);
        await signOut(auth);
        setUsuario(null);
        setRol(null);
      }
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  /* Métodos públicos */
  const loginGoogle = async (intentoRegistro = false) => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const info = getAdditionalUserInfo(cred);
      if (intentoRegistro && !info.isNewUser) {
        await signOut(auth);
        throw new Error('Ese correo de Google ya está registrado. Inicia sesión.');
      }
      return cred;
    } catch (err) {
      if (err.code === 'auth/popup-blocked') {
        const cred = await signInWithRedirect(auth, googleProvider);
        const info = getAdditionalUserInfo(cred);
        if (intentoRegistro && !info.isNewUser) {
          await signOut(auth);
          throw new Error('Ese correo de Google ya está registrado. Inicia sesión.');
        }
        return cred;
      }
      throw err;
    }
  };

  const loginCorreo = (email, pass) => signInWithEmailAndPassword(auth, email, pass);

  const registrar = async (email, pass, nombre) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, pass);
    if (nombre) await updateProfile(newUser, { displayName: nombre });
    // Creamos el doc en Firestore con role='paciente'
    await setDoc(doc(db, 'usuarios', newUser.uid), {
      displayName: newUser.displayName || '',
      email:       newUser.email,
      role:        'paciente',
      createdAt:   new Date(),
    });
  };

  const olvidarPass = (email) => sendPasswordResetEmail(auth, email);
  const logout = () => signOut(auth);

  return (
    <Ctx.Provider
      value={{
        usuario,
        rol,
        cargando,
        loginGoogle,
        loginCorreo,
        registrar,
        olvidarPass,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

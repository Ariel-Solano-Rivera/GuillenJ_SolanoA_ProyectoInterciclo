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
} from "firebase/auth";
import {
  doc, getDoc, setDoc
} from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../api/firebase";

/* ─── configuración ─────────────────────────────────────────── */
const Ctx = createContext();
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const CORREO_ADMIN = "asolanor1@gmail.com";

/* ─── componente proveedor ──────────────────────────────────── */
export function ProveedorAutenticacion({ children }) {
  const [usuario, setUsuario]  = useState(null);
  const [rol, setRol]          = useState(null);
  const [cargando, setLoad]    = useState(true);

  /* crea o actualiza documento usuario en /usuarios/{uid} */
  const upsertDocUsuario = async (cred, rolCalc) => {
    const ref  = doc(db, "usuarios", cred.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        role:        rolCalc,
        displayName: cred.displayName || "",
        email:       cred.email,
        createdAt:   new Date(),
      });
    }
  };

  /* listener de sesión */
  useEffect(() => {
    return onAuthStateChanged(auth, async (cred) => {
      if (!cred) { setUsuario(null); setRol(null); setLoad(false); return; }

      let rolCalc = cred.email === CORREO_ADMIN ? "admin" : "paciente";
      const snap = await getDoc(doc(db, "usuarios", cred.uid));
      if (snap.exists()) rolCalc = snap.data().role;
      await upsertDocUsuario(cred, rolCalc);

      setUsuario(cred);
      setRol(rolCalc);
      setLoad(false);
    });
  }, []);

  /* ─── métodos públicos ────────────────────────────────────── */
  const loginGoogle = async (intentoRegistro = false) => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const info = getAdditionalUserInfo(cred);

      if (intentoRegistro && !info.isNewUser) {
        await signOut(auth);   // aborta redirección
        throw new Error("Ese correo de Google ya está registrado. Inicia sesión.");
      }
      return cred;
    } catch (err) {
      if (err.code === "auth/popup-blocked") {
        const cred = await signInWithRedirect(auth, googleProvider);
        const info = getAdditionalUserInfo(cred);
        if (intentoRegistro && !info.isNewUser) {
          await signOut(auth);
          throw new Error("Ese correo de Google ya está registrado. Inicia sesión.");
        }
        return cred;
      }
      throw err;
    }
  };

  const loginCorreo = (email, pass) =>
    signInWithEmailAndPassword(auth, email, pass);

  const registrar = async (email, pass, nombre) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, pass);
    if (nombre) await updateProfile(user, { displayName: nombre });
    await upsertDocUsuario(user, "paciente");
  };

  const olvidarPass = (email) => sendPasswordResetEmail(auth, email);
  const logout      = () => signOut(auth);

  return (
    <Ctx.Provider value={{
      usuario, rol, cargando,
      loginGoogle, loginCorreo, registrar, olvidarPass, logout
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

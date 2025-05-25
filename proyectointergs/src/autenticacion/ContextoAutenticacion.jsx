import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
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

const Ctx = createContext();
const googleProvider = new GoogleAuthProvider();

// ⚠️ pon aquí el correo de TU cuenta administrador principal
const CORREO_ADMIN = "arisolri1@gmail.com";

export function ProveedorAutenticacion({ children }) {
  const [usuario, setUsuario]  = useState(null);
  const [rol, setRol]          = useState(null);
  const [cargando, setLoad]    = useState(true);

  /* ───────── helper para crear/actualizar doc usuario ───────── */
  const upsertDocUsuario = async (cred, rolCalculado) => {
    const ref  = doc(db, "usuarios", cred.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        role:        rolCalculado,
        displayName: cred.displayName || "",
        email:       cred.email,
        createdAt:   new Date(),
      });
    }
  };

  /* ───────── listener de sesión ───────── */
  useEffect(() => {
    return onAuthStateChanged(auth, async (cred) => {
      if (!cred) {
        setUsuario(null);
        setRol(null);
        setLoad(false);
        return;
      }

      // rol por defecto: admin si coincide correo fijo, sino paciente
      let rolCalc = cred.email === CORREO_ADMIN ? "admin" : "paciente";

      // si existe doc → usa role almacenado (permite más admins)
      const snap = await getDoc(doc(db, "usuarios", cred.uid));
      if (snap.exists()) rolCalc = snap.data().role;

      await upsertDocUsuario(cred, rolCalc);

      setUsuario(cred);
      setRol(rolCalc);
      setLoad(false);
    });
  }, []);

  /* ───────── métodos públicos ───────── */
  const loginGoogle   = () => signInWithPopup(auth, googleProvider)
                                .catch(() => signInWithRedirect(auth, googleProvider));

  const loginCorreo   = (email, pass) => signInWithEmailAndPassword(auth, email, pass);

  const registrar     = async (email, pass, nombre) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, pass);
    if (nombre) await updateProfile(user, { displayName: nombre });
    await upsertDocUsuario(user, "paciente");
  };

  const olvidarPass   = (email) => sendPasswordResetEmail(auth, email);

  const logout        = () => signOut(auth);

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

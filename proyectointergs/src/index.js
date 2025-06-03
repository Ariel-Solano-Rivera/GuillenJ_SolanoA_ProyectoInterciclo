/* src/index.jsx */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./router/EnrutadorApp";
import { ProveedorAutenticacion } from "./autenticacion/ContextoAutenticacion";
import "./styles.css"; // <-- aquí importas tu CSS tradicional

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProveedorAutenticacion>
      <App />
    </ProveedorAutenticacion>
  </React.StrictMode>
);

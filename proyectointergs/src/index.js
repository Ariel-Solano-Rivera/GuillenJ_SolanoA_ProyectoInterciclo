import React from "react";
import ReactDOM from "react-dom/client";
import EnrutadorApp from "./router/EnrutadorApp";
import { ProveedorAutenticacion } from "./autenticacion/ContextoAutenticacion";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProveedorAutenticacion>
      <EnrutadorApp />
    </ProveedorAutenticacion>
  </React.StrictMode>
);

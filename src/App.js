import "./App.css";
import GeneradorCodigos from "./components/GeneradorCodigos";
import CrudNiveles from "./components/CrudNiveles";
import React, { useState } from "react";

function App() {
  const [mostrarCrud, setMostrarCrud] = useState(false);

  return (
    <div>
      {mostrarCrud ? (
        <CrudNiveles cerrarCrud={() => setMostrarCrud(false)} />
      ) : (
        <GeneradorCodigos abrirCrud={() => setMostrarCrud(true)} />
      )}
    </div>
  );
}

export default App;

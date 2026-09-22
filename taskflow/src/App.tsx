import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { AppDataProvider } from "./context/AppDataContext";
import { ToastProvider } from "./context/ToastContext";
import { Layout } from "./components/layout/Layout";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import CalendarPage from "./pages/Calendar";
import InboxPage from "./pages/Inbox";
import Settings from "./pages/Settings";

// Un hosting estático sin fallback de historial (el build de vista previa que
// se comparte por link) necesita URLs con hash; un deploy propio usa rutas
// limpias. Lo elige la variable de entorno en tiempo de build.
const Router = import.meta.env.VITE_HASH_ROUTER === "1" ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <ToastProvider>
      <AppDataProvider>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/clientes/:clientId" element={<ClientDetail />} />
              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/bandeja" element={<InboxPage />} />
              <Route path="/configuracion" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </AppDataProvider>
    </ToastProvider>
  );
}

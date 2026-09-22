import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppDataProvider } from "./context/AppDataContext";
import { ToastProvider } from "./context/ToastContext";
import { Layout } from "./components/layout/Layout";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import CalendarPage from "./pages/Calendar";
import InboxPage from "./pages/Inbox";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <ToastProvider>
      <AppDataProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </AppDataProvider>
    </ToastProvider>
  );
}

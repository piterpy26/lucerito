import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Carga from "./components/Carga";
import useCarga from "./hooks/useCarga";
import GaleriaPage from "./pages/BaulRecuerdosPage";
import ColoresPage from "./pages/ColoresPage";
import Gift from "./pages/Gift";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import Reproductor from "./pages/Reproductor";
import SistemaSolar from "./pages/SistemaSolar";
import PrivateRoute from "./routes/PrivateRoute";

const GIFT_MODE = import.meta.env.VITE_MODE_GIFT_PREVIEW === "true";

const App = () => {
  const loading = useCarga(GIFT_MODE ? 0 : 1500);

  if (GIFT_MODE) return <Gift />;
  if (loading)   return <Carga />;

  return (
    <Router>
      <Routes>
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/"             element={<HomePage />}    />
          <Route path="/colores"      element={<ColoresPage />} />
          <Route path="/sistema-solar" element={<SistemaSolar />} />
          <Route path="/galeria"      element={<GaleriaPage />} />
          <Route path="/musica"       element={<Reproductor />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;

import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Carga from "./components/Carga";
import useCarga from "./hooks/useCarga";
import GaleriaPage from "./pages/BaulRecuerdosPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PrivateRoute from "./routes/PrivateRoute";

const App = () => {
  const loading = useCarga(1500);

  if (loading) return <Carga />;

  return (
    <Router>
      <Routes>
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/galeria" element={<GaleriaPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;

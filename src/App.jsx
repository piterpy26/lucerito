import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Carga from "./components/Carga";
import useCarga from "./hooks/useCarga";
import PrivateRoute from "./routes/PrivateRoute";
import { GlobalAudioPlayer } from "./components/GlobalAudioPlayer";
import { useMusicStore } from "./store/useMusicStore";

// Carga perezosa de páginas para optimizar el bundle inicial
const GaleriaPage  = lazy(() => import("./pages/BaulRecuerdosPage"));
const ColoresPage  = lazy(() => import("./pages/ColoresPage"));
const Gift         = lazy(() => import("./pages/Gift"));
const HomePage     = lazy(() => import("./pages/HomePage"));
const LoginPage    = lazy(() => import("./pages/LoginPage"));
const MilRazones   = lazy(() => import("./pages/MilRazones"));
const Reproductor  = lazy(() => import("./pages/Reproductor"));
const SistemaSolar = lazy(() => import("./pages/SistemaSolar"));

const GIFT_MODE = import.meta.env.VITE_MODE_GIFT_PREVIEW === "true";

// Componente para animar el contenido de las rutas
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/razones" element={<PageWrapper><MilRazones /></PageWrapper>} />
        <Route path="/login"   element={<PageWrapper><LoginPage /></PageWrapper>} />
        
        <Route element={<PrivateRoute />}>
          <Route path="/"              element={<PageWrapper><HomePage /></PageWrapper>}    />
          <Route path="/colores"       element={<PageWrapper><ColoresPage /></PageWrapper>} />
          <Route path="/sistema-solar" element={<PageWrapper><SistemaSolar /></PageWrapper>} />
          <Route path="/galeria"       element={<PageWrapper><GaleriaPage /></PageWrapper>} />
          <Route path="/musica"        element={<PageWrapper><Reproductor /></PageWrapper>} />
        </Route>

        <Route path="*" element={<Navigate to="/razones" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const loading = useCarga(GIFT_MODE ? 0 : 1500);
  const initSongs = useMusicStore(s => s.initSongs);

  useEffect(() => {
    initSongs(); // Cargar música globalmente al iniciar
  }, [initSongs]);

  if (GIFT_MODE) return <Suspense fallback={<Carga />}><Gift /></Suspense>;
  if (loading)   return <Carga />;

  return (
    <Router>
      <GlobalAudioPlayer />
      <Suspense fallback={<Carga />}>
        <AnimatedRoutes />
      </Suspense>
    </Router>
  );
};

export default App;

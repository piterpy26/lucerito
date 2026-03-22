import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";

const HomePage = () => {
  const navigate = useNavigate();

  const handleGallery = () => {
    navigate("/galeria", { replace: true });
  };

  const handleColors = () => {
    navigate("/colores", { replace: true });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#c8b8a8] flex items-center justify-center px-6 py-10">
      <div className="bg-[#e8e0d8] rounded-2xl shadow-lg border border-[#a8a39d] p-10 w-full max-w-sm">
        <h1 className="text-center text-xl font-semibold text-[#4a3728] mb-8 tracking-tight">
          Bienvenida
        </h1>
        <div className="flex flex-col gap-4">
          <button
            onClick={handleGallery}
            className="w-full py-2.5 bg-[#6b5a4e] hover:bg-[#5a4a3e] text-[#f0ebe4] text-sm font-medium rounded-xl transition cursor-pointer"
          >
            Ir a la Galería
          </button>
          <button
            onClick={handleColors}
            className="w-full py-2.5 bg-[#6b5a4e] hover:bg-[#5a4a3e] text-[#f0ebe4] text-sm font-medium rounded-xl transition cursor-pointer"
          >
            Colores
          </button>
          <button
            onClick={() => {
              navigate("/musica", { replace: true });
            }}
            className="w-full py-2.5 bg-[#6b5a4e] hover:bg-[#5a4a3e] text-[#f0ebe4] text-sm font-medium rounded-xl transition cursor-pointer"
          >
            Música
          </button>
          <button
            onClick={() => {
              navigate("/sistema-solar", { replace: true });
            }}
            className="w-full py-2.5 bg-[#6b5a4e] hover:bg-[#5a4a3e] text-[#f0ebe4] text-sm font-medium rounded-xl transition cursor-pointer"
          >
            Sistema Solar
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-[#a8a39d] hover:bg-[#8d7966] text-[#3a2a1c] text-sm font-medium rounded-xl transition cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

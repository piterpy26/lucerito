import { es } from "date-fns/locale";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRef, useState } from "react";
import { DatePicker, registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  RiCalendarLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLockPasswordLine,
  RiUserLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Carga from "../components/Carga";
import { auth } from "../firebase/config";
import "./login.css";

registerLocale("es", es);

function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const [fecha, setFecha] = useState(null);
  const datePickerRef = useRef(null);
  const navigate = useNavigate();
  const FECHA_VALIDATION = "2025-08-26";

  const loginEmail = async () => {
    const swalConfig = {
      confirmButtonColor: "#6b5a4e",
      color: "#2e1f14",
      background: "#ede5d8",
      confirmButtonText: "Intentar de nuevo",
    };

    if (!usuario) {
      Swal.fire({
        ...swalConfig,
        title: "Campo vacío",
        text: "Debes ingresar tu usuario",
        icon: "warning",
      });
      return;
    }

    if (!contraseña) {
      Swal.fire({
        ...swalConfig,
        title: "Campo vacío",
        text: "Debes ingresar tu contraseña",
        icon: "warning",
      });
      return;
    }

    if (!fecha) {
      Swal.fire({
        ...swalConfig,
        title: "Campo vacío",
        text: "Selecciona el campo de fecha",
        icon: "warning",
      });
      return;
    }

    if (fecha?.toLocaleDateString("en-CA") !== FECHA_VALIDATION) {
      Swal.fire({
        ...swalConfig,
        title: "Fecha inválida",
        text: "¿Segura que es la fecha correcta?",
        icon: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(
        auth,
        usuario.trim() + "@gmail.com",
        contraseña.trim(),
      );
      setTimeout(() => {
        setLoading(false);
        navigate("/", { replace: true });
      }, 500);
    } catch {
      setLoading(false);
      Swal.fire({
        title: "Error",
        text: "Usuario o contraseña incorrectos",
        icon: "error",
        confirmButtonColor: "#6b5a4e",
        color: "#3e2a1e",
        background: "#c8b8a8",
        confirmButtonText: "Intentar de nuevo",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    await loginEmail();
  };

  if (loading) return <Carga />;

  return (
    <div className="min-h-screen bg-[#c8b8a8] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10">
      {/* ✅ form con w-full para no romper el layout */}
      <form onSubmit={handleSubmit} className="w-full max-w-5xl">
        <div className="flex flex-col lg:flex-row items-stretch bg-[#e8e0d8] rounded-3xl shadow-lg overflow-hidden">
          {/* ── IMAGEN ── */}
          <div className="w-full lg:w-1/2 h-52 sm:h-72 lg:h-auto relative shrink-0">
            <img
              src="/images/img-login2.jpg"
              alt=""
              className="w-full h-full object-cover lg:hidden"
            />
            <img
              src="/images/img-login.jpg"
              alt=""
              className="hidden lg:block w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* ── FORMULARIO ── */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 sm:px-10 lg:px-14 py-8 sm:py-12 gap-6 sm:gap-7 text-center">
            {/* Cita */}
            <p className="text-sm sm:text-base text-[#4a3728] leading-relaxed max-w-xs sm:max-w-sm">
              "El amor se compone de una sola alma que habita en dos cuerpos."
              <br />
              <span className="font-semibold text-[#3a2a1c]">
                – Aristóteles
              </span>
            </p>

            {/* Inputs */}
            <div className="w-full flex flex-col gap-3">
              {/* Usuario */}
              <div className="flex items-center gap-3 px-5 py-4 rounded-full bg-[#d8cfc5] border border-[#b0a898] focus-within:border-[#6b5a4e] focus-within:shadow-sm transition-all duration-200">
                <RiUserLine className="text-[#6b5a4e] shrink-0 text-base" />
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none text-[#3a2a1c] min-w-0"
                  autoComplete="name"
                />
              </div>

              {/* Contraseña */}
              <div className="flex items-center gap-3 px-5 py-4 rounded-full bg-[#d8cfc5] border border-[#b0a898] focus-within:border-[#6b5a4e] focus-within:shadow-sm transition-all duration-200">
                <RiLockPasswordLine className="text-[#6b5a4e] shrink-0 text-base" />
                <input
                  type={mostrarContraseña ? "text" : "password"}
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none text-[#3a2a1c] min-w-0"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContraseña(!mostrarContraseña)}
                  className="text-[#6b5a4e] hover:text-[#5a4a3e] transition-colors duration-200 shrink-0"
                >
                  {mostrarContraseña ? (
                    <RiEyeOffLine size={18} />
                  ) : (
                    <RiEyeLine size={18} />
                  )}
                </button>
              </div>

              {/* Fecha */}
              <div
                className="flex items-center gap-3 px-5 py-4 rounded-full bg-[#d8cfc5] border border-[#b0a898] focus-within:border-[#6b5a4e] focus-within:shadow-sm transition-all duration-200 cursor-pointer"
                onClick={() => datePickerRef.current?.setOpen(true)}
              >
                <RiCalendarLine className="text-[#6b5a4e] shrink-0 pointer-events-none" />
                <DatePicker
                  ref={datePickerRef}
                  selected={fecha}
                  onChange={(date) => setFecha(date)}
                  locale="es"
                  dateFormat="dd 'de' MMMM 'de' yyyy"
                  className="flex-1 bg-transparent text-sm focus:outline-none text-[#3a2a1c] w-full cursor-pointer"
                  wrapperClassName="flex-1"
                  showPopperArrow={false}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-10 sm:px-14 py-4 rounded-full bg-[#6b5a4e] hover:bg-[#5a4a3e] text-[#f0ebe4] text-sm font-semibold border-2 border-[#4a3728] shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.97]"
            >
              Ingresar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;

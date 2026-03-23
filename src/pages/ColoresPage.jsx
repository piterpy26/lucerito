import { useState } from "react";
import { CiGrid41 } from "react-icons/ci";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import amarillaImg from "../assets/images/colores/amarilla.jpg";
import azuladoImg from "../assets/images/colores/azulado.jpg";
import moradoImg from "../assets/images/colores/morado.jpg";
import verdeImg from "../assets/images/colores/verde.jpg";

const ColoresPage = () => {
  const [mode, setMode] = useState("1x1");
  const [activeSet, setActiveSet] = useState(() => new Set());
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/", { replace: true });
  };

  const ColorearTextoArcoiris = (texto) => {
    const colores = [
      "text-blue-500",
      "text-yellow-500",
      "text-green-500",
      "text-purple-500",
    ];
    return texto.split("").map((char, index) => (
      <span key={index} className={colores[index % colores.length]}>
        {char}
      </span>
    ));
  };

  const texto_mensaje =
    "Me he enamorado de lo bonita que es tu sonrisa, del lustre que tienen tus ojos, los espirales de tu cabello, la suavidad de tus manos y el vaivén de tus caderas. Me he enamorado de tu belleza física y la gentileza de tu corazón, Te amo ❤️";

  const mensaje_final = `
    La vida debería ser de colores:
  `;

  const cards = [
    {
      nombre: "AZULADO",
      img: azuladoImg,
      alt: "Azulado",
      frontBg: "bg-blue-500",
      accent: "text-blue-500",
      textPrefix: "Para siempre estar ",
      textAccent: "a su lado",
    },
    {
      nombre: "AMARILLA",
      img: amarillaImg,
      alt: "Amarilla",
      frontBg: "bg-yellow-500",
      accent: "text-yellow-500",
      textPrefix: "Para siempre ",
      textAccent: "amar y ya",
    },
    {
      nombre: "VERDE",
      img: verdeImg,
      alt: "Verde",
      frontBg: "bg-green-500",
      accent: "text-green-500",
      textPrefix: "Para siempre ",
      textAccent: "ver de",
      textSuffix: " cerca su carita",
    },
    {
      nombre: "MORADO",
      img: moradoImg,
      alt: "Morado",
      frontBg: "bg-purple-500",
      accent: "text-purple-500",
      textPrefix: "Para siempre estar ena",
      textAccent: "morado",
    },
  ];

  return (
    <div className="min-h-screen px-6 py-10 bg-[#F4F4F2]">
      <div className="max-w-8xl mx-auto">
        {/* ── HEADER ── */}

        {/* MÓVIL: título izquierda, controles derecha */}
        <div className="flex items-center justify-between gap-4 sm:hidden">
          <h1 className="text-md font-black text-slate-900 tracking-tight drop-shadow-sm">
            Eres auténticamente un Lucero en mi vida
            <img
              src="/src/assets/images/colores/corazones.png"
              alt="corazones"
              className="w-8 h-8 inline-block ml-4"
            />
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMode((prev) => (prev === "1x1" ? "all" : "1x1"));
                setActiveSet(new Set());
              }}
              aria-pressed={mode === "all"}
              title={mode === "all" ? "Ver uno a la vez" : "Ver todos"}
              className={`inline-flex items-center justify-center rounded-xl p-2.5 shadow-sm ring-1 transition-colors focus:outline-none ${
                mode === "all"
                  ? "bg-slate-900 text-white ring-slate-700 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200"
              }`}
            >
              <CiGrid41 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 bg-slate-100 hover:text-slate-800 hover:bg-slate-200 border border-slate-300 shadow-sm transition-colors duration-200 focus:outline-none"
            >
              <FiLogOut className="w-5 h-5" />
              Inicio
            </button>
          </div>
        </div>

        {/* TABLET / PC: título centrado, controles a la derecha */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          {/* Espacio izquierdo para balancear visualmente el título al centro */}
          <div
            className="flex items-center gap-2 opacity-0 pointer-events-none"
            aria-hidden="true"
          >
            <div className="w-10 h-10" />
            <div className="w-16 h-8" />
          </div>

          {/* Título — centro */}
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 text-center flex-1 drop-shadow-sm">
            
            Debes ser tú quien pinte el resto de mi vida mi amor
            <img
              src="/src/assets/images/colores/lleno-de-amor.png"
              alt="lleno de amor"
              className="w-10 h-10 inline-block ml-4"
            />
          </h1>

          {/* Controles — derecha */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMode((prev) => (prev === "1x1" ? "all" : "1x1"));
                setActiveSet(new Set());
              }}
              aria-pressed={mode === "all"}
              title={mode === "all" ? "Ver uno a la vez" : "Ver todos"}
              className={`inline-flex items-center justify-center rounded-xl p-2.5 shadow-sm ring-1 transition-colors focus:outline-none ${
                mode === "all"
                  ? "bg-slate-900 text-white ring-slate-700 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200"
              }`}
            >
              <CiGrid41 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 bg-slate-100 hover:text-slate-800 hover:bg-slate-200 border border-slate-300 shadow-sm transition-colors duration-200 focus:outline-none"
            >
              <FiLogOut className="w-5 h-5" />
              Inicio
            </button>
          </div>
        </div>
        <div className="my-6">
          <div className="text-center text-slate-700 border-2 border-dashed border-slate-500 rounded-4xl p-2 lg:text-xl lg:mx-50">
            {texto_mensaje}
          </div>
          <div className="text-center font-bold text-slate-700 mt-4 text-lg md:text-xl lg:text-2xl">
            {ColorearTextoArcoiris(mensaje_final)}
          </div>
        </div>
        {/* ── CARDS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-10 justify-items-center">
          {cards.map((card, index) => {
            const isActive = activeSet.has(index);

            return (
              <button
                key={card.nombre}
                type="button"
                onClick={() => {
                  setActiveSet((prev) => {
                    if (mode === "1x1") {
                      if (prev.has(index)) return new Set();
                      return new Set([index]);
                    }
                    const next = new Set(prev);
                    if (next.has(index)) next.delete(index);
                    else next.add(index);
                    return next;
                  });
                }}
                className="group relative block w-full max-w-75 sm:max-w-280 md:max-w-300 xl:max-w-none xl:w-full aspect-3/4 rounded-2xl overflow-hidden shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-all duration-300 hover:scale-[1.02] hover:z-10 hover:shadow-2xl"
              >
                {/* FRENTE */}
                <span
                  className={`${card.frontBg} absolute inset-0 text-white flex flex-col items-center justify-center gap-2 transition-opacity duration-500 ${
                    isActive ? "opacity-0" : "opacity-100"
                  } group-hover:opacity-0`}
                >
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-widest drop-shadow-md ">
                    {card.nombre}
                  </span>
                </span>

                {/* REVERSO */}
                <span
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    isActive ? "opacity-100" : "opacity-0"
                  } group-hover:opacity-100`}
                >
                  <img
                    src={card.img}
                    alt={card.alt}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                  <span className="absolute left-0 right-0 bottom-0 bg-white/90 backdrop-blur-sm text-slate-900 px-4 py-4 text-center">
                    <span className="text-sm sm:text-base md:text-lg font-semibold leading-snug">
                      {card.textPrefix}
                      <span className={`${card.accent} font-black`}>
                        {card.textAccent}
                      </span>
                      {card.textSuffix ?? ""}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ColoresPage;

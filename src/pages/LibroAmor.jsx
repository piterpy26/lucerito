import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiHome } from "react-icons/fi";

const photos = {
  left: "/foto-1.jpg",
  center: "/foto-2.jpg",
  right: "/foto-3.jpg",
};

const LibroAmor = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  const pages = [
    {
      id: 0,
      title: "Prólogo",
      content: (
        <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4">
          <h2 className="text-2xl font-bold text-[#5b3b32]">Nuestra historia</h2>
          <p className="text-base text-[#7b574d]">
            Cada momento contigo merece su propia página, su propio recuerdo
            y su propio “te quiero”.
          </p>
          <p className="text-sm text-[#9b7a6e]">
            Pasa la página para ver algunos de mis recuerdos favoritos.
          </p>
        </div>
      ),
    },
    {
      id: 1,
      title: "Te quiero",
      content: (
        <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden">
          {/* Texto “Gracias por existir” de fondo sutil */}
          <div className="absolute top-4 right-4 text-right text-sm text-[#e4c9b3] opacity-60 leading-5 select-none pointer-events-none">
            <p>Gracias por existir</p>
            <p>Gracias por estar</p>
            <p>Gracias por ser tú</p>
          </div>

          {/* Polaroids */}
          <div className="flex items-end justify-center gap-4 mt-4">
            {/* Izquierda */}
            <div className="-rotate-6 w-32 sm:w-40 bg-white shadow-lg rounded-md pt-2 pb-4 px-2">
              <div className="w-full aspect-4/5 overflow-hidden rounded">
                <img
                  src={photos.left}
                  alt="Recuerdo 1"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Centro */}
            <div className="rotate-1 w-36 sm:w-44 bg-white shadow-xl rounded-md pt-2 pb-6 px-2 relative z-10">
              <div className="w-full aspect-4/5 overflow-hidden rounded">
                <img
                  src={photos.center}
                  alt="Recuerdo 2"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Derecha */}
            <div className="rotate-6 w-32 sm:w-40 bg-white shadow-lg rounded-md pt-2 pb-4 px-2">
              <div className="w-full aspect-4/5 overflow-hidden rounded">
                <img
                  src={photos.right}
                  alt="Recuerdo 3"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Corazón grande arriba */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 text-4xl text-[#5b1726]">
            ♥
          </div>

          {/* Corazones abajo */}
          <div className="absolute bottom-10 right-8 text-3xl text-[#5b1726] flex flex-col gap-1">
            <span>♥</span>
            <span className="scale-75 origin-top-left">♥</span>
          </div>

          {/* Texto “Te quiero” */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <p className="text-3xl sm:text-4xl font-semibold text-[#2b1a16] italic">
              Te quiero
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: "Epílogo",
      content: (
        <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4">
          <p className="text-xl font-semibold text-[#5b3b32]">
            Gracias por ser mi capítulo favorito.
          </p>
          <p className="text-base text-[#7b574d]">
            Este libro seguirá creciendo, porque cada día contigo
            merece una nueva página.
          </p>
        </div>
      ),
    },
  ];

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(pages.length - 1, p + 1));

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f7ebdf" }}
    >
      {/* NAV SUPERIOR - con botón Inicio */}
      <header
        className="w-full flex items-center justify-between px-6 py-3 shadow-sm"
        style={{ backgroundColor: "#f5e0ce", borderBottom: "2px dashed #d9b49a" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">📖</span>
          <span className="font-black text-lg tracking-tight text-[#5b3b32]">
            Nuestro libro
          </span>
        </div>

        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm transition"
          style={{
            backgroundColor: "#5b3b32",
            color: "#fbeee1",
          }}
        >
          <FiHome className="w-4 h-4" />
          Inicio
        </button>
      </header>

      {/* CONTENIDO CENTRAL (el libro) */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-3xl h-420 sm:h-480 flex items-stretch justify-center">
          {/* “Libro” con dos páginas */}
          <div
            className="relative w-full max-w-3xl h-full bg-[#f5e0ce] shadow-2xl rounded-3xl border border-[#e3c2a6] overflow-hidden flex"
          >
            {/* Pseudo-lomo en el medio */}
            <div className="absolute inset-y-0 left-1/2 w-px bg-[#e3c2a6] opacity-70" />

            {/* Página izquierda (título + numeración) */}
            <div className="w-1/2 h-full border-r border-[#e3c2a6]/70 px-6 py-5 flex flex-col">
              <div className="flex-1 flex flex-col">
                <h2 className="text-sm font-semibold tracking-wide text-[#a57a60] uppercase">
                  Capítulo {page + 1}
                </h2>
                <p className="mt-2 text-xl font-bold text-[#5b3b32]">
                  {pages[page].title}
                </p>
                <div className="mt-4 text-xs text-[#b38c72] leading-5">
                  <p>
                    Páginas llenas de recuerdos, abrazos, fotos
                    y pequeñas cosas que solo tú y yo entendemos.
                  </p>
                  <p className="mt-2">
                    Este libro está hecho para recordar
                    que cada momento juntos vale la pena.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-[10px] text-[#b38c72]">
                <span>Te quiero</span>
                <span>Pág. {page + 1} / {pages.length}</span>
              </div>
            </div>

            {/* Página derecha (contenido principal: collage, texto, etc.) */}
            <div className="w-1/2 h-full px-4 py-5">
              {pages[page].content}
            </div>
          </div>

          {/* Controles de pasar página */}
          <button
            onClick={goPrev}
            disabled={page === 0}
            className={`absolute left-1 -translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition ${
              page === 0 ? "opacity-40 cursor-not-allowed" : "opacity-90 hover:scale-105"
            }`}
            style={{ backgroundColor: "#5b3b32", color: "#fbeee1" }}
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={goNext}
            disabled={page === pages.length - 1}
            className={`absolute right-1 translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition ${
              page === pages.length - 1
                ? "opacity-40 cursor-not-allowed"
                : "opacity-90 hover:scale-105"
            }`}
            style={{ backgroundColor: "#5b3b32", color: "#fbeee1" }}
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default LibroAmor;

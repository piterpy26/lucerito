import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { useState, useRef } from "react";

const P = {
  bg: "bg-[#f7f4ea]",
  card: "bg-[#f2e8d5]",
  border: "border-[#e2d3b5]",
  text: "text-[#2a1505]",
  textSoft: "text-[#6b3f1e]",
};

const InlineLink = ({ onClick, children }) => (
  <span
    onClick={onClick}
    className="underline underline-offset-4 cursor-pointer text-[#8b4513] hover:text-[#6b3410] transition-colors duration-200 font-medium"
  >
    {children}
  </span>
);

export default function HomePage() {
  const navigate = useNavigate();
  const [anim, setAnim] = useState("idle");
  const startX = useRef(0);
  const timerRef = useRef(null);
  
  const [idx, setIdx] = useState(() => {
    const saved = sessionStorage.getItem("homePage_idx");
    return saved ? parseInt(saved, 10) : 0;
  });

const changePage = (next) => {
  if (next < 0 || next >= pages.length || anim !== "idle") return;
  setAnim("out");
  clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => {
    setIdx(next);
    sessionStorage.setItem("homePage_idx", next); // 👈 persiste
    setAnim("in");
    timerRef.current = setTimeout(() => setAnim("idle"), 280);
  }, 260);
};

  const onTouchStart = (e) => (startX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 50) changePage(idx + 1);
    if (diff < -50) changePage(idx - 1);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  const Link = ({ to, children }) => (
    <InlineLink onClick={() => navigate(to, { replace: true })}>
      {children}
    </InlineLink>
  );

  const CONTENT_H = "h-[320px] sm:h-[300px] lg:h-[340px] xl:h-[360px]";

  const pages = [
    /* 0 — PORTADA */
    { type: "cover" },

    /* 1 */
    {
      type: "text",
      content: (
        <p>
          Ya eres toda una auténtica princesa 💖. No sé si recuerdas cuando nos
          conocimos; sinceramente, yo no. No recuerdo ni nuestra primera mirada,
          ni nuestro primer roce de manos, tampoco nuestro primer beso. Gracias a
          Dios, te tengo a ti, mi historial, que lo anotas todo.
        </p>
      ),
    },

    /* 2 */
    {
      type: "text",
      content: (
        <p>
          He cometido muchos errores contigo, algunos más, otros menos; al final,
          son errores. Perdóname por el tiempo en el que no he estado; quizás pude
          haber hecho más que solo mirarte desde lejos. Y gracias por el amor que
          desbordas por mí. Comprendí que, si no hubiéramos pasado lo que pasamos,
          nuestros caminos habrían sido diferentes. Ambos sabemos lo que nos ha
          costado, sobre todo cuando me contabas la verdad de las cosas. Ambos
          sabemos cuánto nos cuesta y nos seguirá abrumando, quizá.
        </p>
      ),
    },

    /* 3 */
    {
      type: "text",
      content: (
        <>
          <p>
            Sé lo que se siente estar solo, pero no conozco tu soledad. Sé que le
            tienes miedo a muchas cosas por tus experiencias pasadas. Soy lo que
            tú no eres y tú eres lo que me falta a mí.
          </p>
          <p className="mt-4">
            Espero mi <Link to="/galeria">galería</Link> con muchas fotos tuyas,
            mías, nuestras, y quién sabe, un día, con nuestros hijos. No quiero
            quedarme solo en la etapa de un noviazgo pasajero. Quiero pertenecerte
            y que tú solo tú me pertenezcas. Quiero que seas de mi propiedad; no
            te dejaré ir otra vez.
          </p>
        </>
      ),
    },

    /* 4 */
    {
      type: "text",
      content: (
        <>
          <p>
            Eres tú quien pinta mi mundo de{" "}
            <Link to="/colores">colores</Link>. Eres el reflejo de lo que defino
            como amor. Sé que lo que amas ahora no es nada comparado con lo que
            amarás de verdad.
          </p>
          <p className="mt-4">
            Sé lo mucho que te esfuerzas día tras día para comprenderme, y lo
            haces muy bien. Gracias por ser el primer amor que me enseñó el
            verdadero valor de una relación, de una amistad y de un equipo.
          </p>
        </>
      ),
    },

    /* 5 */
    {
      type: "text",
      content: (
        <>
          <p>
            Sé que soy recio y tosco con muchas de mis palabras, lo sé; pero eso
            no significa que no te quiera. Significa que te amo tanto que quiero
            enseñarte cómo soy para que te enamores de lo que soy y no de lo que
            parezco.
          </p>
          <p className="mt-4">
            Cuando estoy contigo hay <Link to="/musica">música</Link> sonando a
            nuestro alrededor, tanto que te hice una playlist. La actualizaremos
            con el tiempo, porque aún tenemos que definir el ritmo y el compás de
            las melodías que sonarán cuando estemos en el altar.
          </p>
        </>
      ),
    },

    /* 6 */
    {
      type: "text",
      content: (
        <>
          <p>
            Recuerdo una vez que me pediste el universo entero, pero, mi niña, el
            universo es algo que no me puedo imaginar, porque siempre que me lo
            imagino pienso en ti. No te podré dar el universo, pero sí el{" "}
            <Link to="/sistema-solar">sistema solar</Link>.
          </p>
          <p className="mt-4">
            Eres tú el amor de mi vida, la persona a la que quiero conocer hoy,
            mañana y siempre. Te amo tanto que por ti aprendí a ser más
            detallista. Nunca en mi vida he regalado flores, ni mucho menos hice
            pancartas para declarar mi amor.
          </p>
        </>
      ),
    },

    /* 7 */
    {
      type: "text",
      content: (
        <>
          <p>
            En fin, tengo 1 y{" "}
            <Link to="/razones">1000 razones</Link> para seguir amándote y por
            las que quiero estar contigo siempre.
          </p>
          <p className="mt-4">
            Recuerda, mi amor: no eres un accidente, eres un regalo de Dios. No
            tienes un cuerpo feo; lo que tienes es ceguera. No tienes defectos;
            lo que tienes son problemas, y hemos aprendido juntos que los
            problemas se resuelven con paciencia y amor.
          </p>
        </>
      ),
    },

    /* 8 — CIERRE */
    {
      type: "text",
      content: (
        <>
          <p>
            Ya no estás sola, yo estoy contigo y estaré para ti cuando necesites
            un amigo, un hermano, un novio, un esposo, una amiga, una vecina para
            chismear, o simplemente alguien que te amará y cuidará de tu corazón.
            Te amo, cariño ❤️
          </p>
          <p className="mt-6 italic text-right">
            Escrito por el amor de tu vida.
          </p>
        </>
      ),
    },

    /* 9 — FINAL */
    { type: "final" },
  ];

  const total = pages.length;
  const progress = (idx / (total - 1)) * 100;
  const current = pages[idx];

  const cardAnim =
    anim === "out"
      ? "opacity-0 -translate-y-3 scale-[0.97]"
      : anim === "in"
      ? "opacity-0 translate-y-3 scale-[0.97]"
      : "opacity-100 translate-y-0 scale-100";

  return (
    <div
      className={`min-h-dvh flex flex-col items-center justify-center px-4 py-8 ${P.bg}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Cerrar sesión */}
      <button
        onClick={handleLogout}
        className={`fixed bottom-5 right-5 z-50 text-xs px-3 py-1.5 rounded-full border
          border-[#8b4513] ${P.textSoft} bg-[#f2e8d5]
          hover:bg-[#e8d8be] active:scale-95
          opacity-50 hover:opacity-100
          transition-all duration-200 shadow-sm`}
      >
        Cerrar sesión
      </button>

      <div className="w-full max-w-sm sm:max-w-lg lg:max-w-2xl xl:max-w-3xl">

        {/* Barra de progreso */}
        <div className="w-full h-[2px] bg-[#e2d3b5] rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-[#8b4513] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* CARD — altura fija garantizada */}
        <div className={`relative rounded-2xl shadow-md border ${P.border} ${P.card} overflow-hidden`}>

          {/* Ornamentos */}
          <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none opacity-10">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <path d="M0 0 Q32 0 64 32 Q32 64 0 64 Z" fill="#8b4513" />
            </svg>
          </div>
          <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none opacity-10 rotate-180">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <path d="M0 0 Q32 0 64 32 Q32 64 0 64 Z" fill="#8b4513" />
            </svg>
          </div>

          {/* Zona de contenido — altura fija + scroll interno si desborda */}
          <div
            className={`
              transition-all duration-280 ease-in-out
              ${cardAnim}
              px-6 sm:px-10 lg:px-16
              py-8 sm:py-10 lg:py-12
            `}
          >
            {/* Contenedor con altura fija responsiva */}
            <div className={`${CONTENT_H} flex flex-col justify-center overflow-y-auto`}>

              {/* ── COVER ── */}
              {current.type === "cover" && (
                <div className="flex flex-col items-center justify-center text-center gap-4 h-full">
                  <h1 className={`font-semibold tracking-tight ${P.text}
                    text-4xl sm:text-5xl lg:text-6xl xl:text-7xl`}>
                    Feliz 17 Años
                  </h1>
                  <div className="text-6xl sm:text-7xl lg:text-8xl drop-shadow-sm">💌</div>
                </div>
              )}

              {/* ── TEXT ── */}
              {current.type === "text" && (
                <div className={`
                  ${P.text} text-justify leading-relaxed space-y-3
                  text-sm sm:text-base lg:text-lg xl:text-xl
                `}>
                  {current.content}
                </div>
              )}

              {/* ── FINAL ── */}
              {current.type === "final" && (
                <div className="flex flex-col items-center justify-center gap-5 text-center h-full">
                  
                  <p className={`${P.text} italic leading-relaxed
                    text-base sm:text-lg lg:text-xl`}>
                    Siempre estaremos juntos
                  </p>
                  <span className="text-5xl sm:text-6xl animate-pulse drop-shadow-sm">❤️</span>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── NAVEGACIÓN ── */}
        <div className="flex items-center justify-between mt-5 px-1">
          <button
            onClick={() => changePage(idx - 1)}
            disabled={idx === 0 || anim !== "idle"}
            className={`
              w-10 h-10 sm:w-11 sm:h-11
              rounded-full flex items-center justify-center
              border border-[#6b3f1e] ${P.textSoft} bg-[#e8d8be]
              hover:bg-[#deccaa] active:scale-95
              disabled:opacity-30 transition-all duration-200 shadow-sm
              text-base sm:text-lg
            `}
          >
            «
          </button>

          {/* Dots */}
          <div className="flex gap-2 items-center">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => changePage(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === idx
                    ? "w-4 h-2 bg-[#8b4513]"
                    : "w-2 h-2 bg-[#6b3f1e40] hover:bg-[#6b3f1e80]"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => changePage(idx + 1)}
            disabled={idx === total - 1 || anim !== "idle"}
            className={`
              w-10 h-10 sm:w-11 sm:h-11
              rounded-full flex items-center justify-center
              border border-[#6b3f1e] ${P.textSoft} bg-[#e8d8be]
              hover:bg-[#deccaa] active:scale-95
              disabled:opacity-30 transition-all duration-200 shadow-sm
              text-base sm:text-lg
            `}
          >
            »
          </button>
        </div>

        {/* Contador */}
        <p className={`text-center text-xs mt-3 tabular-nums ${P.textSoft}`}>
          {idx + 1} / {total}
        </p>

      </div>
    </div>
  );
}
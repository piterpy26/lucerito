import { Link } from "react-router-dom";
import { razones } from "../data/razones";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";

const FILTERS = [
  { key: "contenido", label: "Texto" },
  { key: "id",        label: "#ID" },
  { key: "similar",   label: "Similar" },
];

const CARD_H = 120; // altura estimada de cada card (px)
const GAP    = 12;  // gap-3

/* ── Hook de columnas responsive ───────────────────────────── */
const useColumnCount = () => {
  const get = () => {
    const w = window.innerWidth;
    if (w >= 1024) return 5;
    if (w >= 768)  return 4;
    if (w >= 640)  return 3;
    return 2;
  };
  const [cols, setCols] = useState(get);
  useEffect(() => {
    const handler = () => setCols(get());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return cols;
};

/* ── Modal variants (sin cambios) ───────────────────────────── */
const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};
const modalVariants = {
  hidden:  { opacity: 0, scale: 0.75, y: 32 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: "spring", stiffness: 320, damping: 24 },
  },
  exit: { opacity: 0, scale: 0.82, y: 20, transition: { duration: 0.18 } },
};

/* ── Componente ─────────────────────────────────────────────── */
const MilRazones = () => {
  const [query,    setQuery]    = useState("");
  const [filter,   setFilter]   = useState("contenido");
  const [selected, setSelected] = useState(null);

  const scrollRef = useRef(null);
  const cols      = useColumnCount();

  useEffect(() => {
    if (!selected) return;
    const fn = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return razones;
    if (filter === "id") {
      const n = parseInt(q, 10);
      return isNaN(n) ? [] : razones.filter((r) => r.id === n);
    }
    if (filter === "similar") return razones.filter((r) => String(r.id).includes(q));
    const lower = q.toLowerCase();
    return razones.filter((r) => r.contenido.toLowerCase().includes(lower));
  }, [query, filter]);

  /* Agrupar items en filas de `cols` columnas */
  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < filtered.length; i += cols)
      result.push(filtered.slice(i, i + cols));
    return result;
  }, [filtered, cols]);

  /* Virtualizar solo filas visibles */
  const virtualizer = useVirtualizer({
    count:           rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize:    () => CARD_H + GAP,
    overscan:        4,                       // filas extra encima/abajo
  });

  const handleQuery  = useCallback((e) => setQuery(e.target.value), []);
  const handleFilter = useCallback((k) => { setFilter(k); setQuery(""); }, []);
  const handleClear  = useCallback(() => { setQuery(""); setFilter("contenido"); }, []);

  const hasFilter = query.trim() !== "" || filter !== "contenido";

  return (
    <>
      {/* ── Modal animado ─────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="overlay"
            variants={overlayVariants}
            initial="hidden" animate="visible" exit="exit"
            onClick={() => setSelected(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 50,
              background: "rgba(0,0,0,0.28)",
              display: "flex", alignItems: "center",
              justifyContent: "center", padding: "1rem",
            }}
          >
            <motion.div
              key="modal"
              variants={modalVariants}
              initial="hidden" animate="visible" exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-pink-200 rounded-2xl p-5 w-full max-w-sm"
              style={{ boxShadow: "0 8px 40px rgba(236,72,153,0.22)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm font-bold text-pink-500"
                >
                  #{selected.id}
                </motion.span>
                <motion.button
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={() => setSelected(null)}
                  className="text-pink-300 hover:text-pink-500 text-xl leading-none"
                >
                  ✕
                </motion.button>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.32 }}
                className="text-sm text-[#5a3a4a] leading-relaxed"
              >
                {selected.contenido}
              </motion.p>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 11 }}
                className="mt-4 text-center text-lg select-none"
              >
                🌸
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="flex flex-col bg-[#fdf6f9] overflow-hidden"
        style={{ minHeight: "100dvh", height: "100dvh" }}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="shrink-0 bg-white border-b border-pink-100 px-4 sm:px-6 pt-3 pb-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h1 className="font-bold text-[#3a1a2a] leading-tight text-base sm:text-xl md:text-2xl">
                <span className="text-pink-500">1000</span> Razones para amarte 🌸
              </h1>
              <Link
                to="/"
                className="shrink-0 bg-pink-500 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl hover:bg-pink-600 transition-colors font-medium"
              >
                ← Inicio
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleFilter(key)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    filter === key
                      ? "bg-pink-500 border-pink-500 text-white"
                      : "bg-pink-50 border-pink-200 text-pink-400 hover:border-pink-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder={
                  filter === "id"      ? "Ej: 42" :
                  filter === "similar" ? "Ej: 20 → 120, 220…" :
                                         "Buscar en el texto…"
                }
                value={query}
                onChange={handleQuery}
                className="flex-1 px-3 py-2 bg-pink-50 border border-pink-200 rounded-xl text-sm text-[#3a1a2a] placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
              {hasFilter && (
                <button
                  onClick={handleClear}
                  className="shrink-0 bg-pink-100 border border-pink-200 text-pink-500 text-xs px-3 py-2 rounded-xl hover:bg-pink-200 transition-colors font-medium"
                >
                  Limpiar
                </button>
              )}
              <span className="shrink-0 text-xs text-pink-300 hidden sm:block">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── Grid Virtualizado ────────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {filtered.length === 0 ? (
            <p className="text-center text-pink-300 mt-20 text-sm">Sin resultados 💔</p>
          ) : (
            <div className="max-w-7xl mx-auto">
              {/* Div con la altura total "virtual" */}
              <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>

                {virtualizer.getVirtualItems().map((virtualRow) => (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0, left: 0, right: 0,
                      height: `${CARD_H}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      display: "grid",
                      gridTemplateColumns: `repeat(${cols}, 1fr)`,
                      gap: `${GAP}px`,
                    }}
                  >
                    {rows[virtualRow.index].map((razon) => (
                      <motion.div
                        key={razon.id}
                        whileHover={{
                          scale: 1.04,
                          boxShadow: "0 6px 24px rgba(236,72,153,0.18)",
                          borderColor: "#f472b6",
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelected(razon)}
                        className="bg-white border border-pink-100 rounded-xl p-3 flex flex-col gap-1.5 cursor-pointer overflow-hidden"
                      >
                        <span className="text-xs font-bold text-pink-400">#{razon.id}</span>
                        <p className="text-sm text-[#5a3a4a] leading-relaxed line-clamp-3">
                          {razon.contenido}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ))}

              </div>
            </div>
          )}
        </div>

        <div
          className="shrink-0 bg-white border-t border-pink-100"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <p className="text-center text-xs text-pink-300 py-3">Te amo ❤️</p>
        </div>
      </div>
    </>
  );
};

export default MilRazones;
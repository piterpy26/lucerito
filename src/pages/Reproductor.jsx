import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiDeleteBinLine,
  RiHeart3Fill,
  RiHeart3Line,
  RiHome4Fill,
  RiHome4Line,
  RiMoonLine,
  RiMusic2Fill,
  RiMusic2Line,
  RiPauseFill,
  RiPlayFill,
  RiSearch2Line,
  RiSkipBackFill,
  RiSkipForwardFill,
  RiSunLine,
  RiVolumeDownLine,
  RiVolumeUpLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Carga from "../components/Carga";
import { deleteSong, fetchSongs, uploadSong } from "../firebase/musicService";

// ── Temas ─────────────────────────────────────────────────────────────────────
const themes = {
  dark: {
    bg: "#1c1610", nav: "#201c14", card: "#2e271c", surface: "#3a3025",
    border: "#4a4035", accent: "#6b5a4e", light: "#d8cfc5",
    text: "#f0ebe4", muted: "#a89880",
  },
  light: {
    bg: "#f2ece3", nav: "#e8dfd3", card: "#fdf8f3", surface: "#f7f0e8",
    border: "#c8bfb2", accent: "#8a6f5e", light: "#5c3d2e",
    text: "#2a1f18", muted: "#7a6355",
  },
};

const LOCAL_KEY = "reproductor-favoritos";
const THEME_KEY = "reproductor-theme";
const CACHE_KEY = "reproductor-songs-cache";
const CACHE_TTL = 5 * 60_000;
const swalBase  = { confirmButtonColor: "#6b5a4e", color: "#2e1f14", background: "#ede5d8" };

const getArtSize = () => {
  const w = window.innerWidth;
  if (w < 380) return 120;
  if (w < 430) return 140;
  return 172;
};

const fmt = (t) => {
  if (!Number.isFinite(t) || t <= 0) return "0:00";
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
};

const initials = (str = "") =>
  str.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "♪";

const getGreeting = (name = "Lucerito") => {
  const h = new Date().getHours();
  if (h < 6)  return `🌅 Hola madrugadora`;
  if (h < 8)  return `☀️ Buen día ${name}`;
  if (h < 12) return `☀️ ¿Tomaste un buen desayuno ${name}?`;
  if (h < 18) return `🌤️ Hey, ¿Todo bien?`;
  if (h < 20) return `🌆 Buena tarde ${name}`;
  return      `🌙 Buena noche ${name}`;
};

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}
function writeCache(data) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
const HomeButton = memo(function HomeButton({ theme, isDark, onClick }) {
  return (
    <button onClick={onClick}
      className="fixed top-4 right-4 z-50 flex items-center gap-1.5 backdrop-blur-md border text-xs font-semibold px-3.5 py-2.5 rounded-xl hover:opacity-75 active:scale-95 transition-all duration-200"
      style={{
        backgroundColor: isDark ? "rgba(0,0,0,0.55)" : `${theme.surface}dd`,
        borderColor: theme.border, color: theme.text,
      }}
    >
      Inicio →
    </button>
  );
});

const AlbumArt = memo(function AlbumArt({ song, size, playing, theme }) {
  return (
    <motion.div
      animate={playing ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={playing ? { duration: 2.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      className="rounded-full overflow-hidden shrink-0"
      style={{
        width: size, height: size,
        border: `3px solid ${theme.border}`,
        boxShadow: playing
          ? `0 0 28px ${theme.accent}88, 0 4px 18px rgba(0,0,0,0.35)`
          : "0 4px 16px rgba(0,0,0,0.25)",
      }}
    >
      {song?.cover ? (
        <img src={song.cover} alt={song.title} draggable={false}
          width={size} height={size} className="w-full h-full object-cover block" />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-bold select-none"
          style={{ backgroundColor: theme.accent, color: theme.light, fontSize: size * 0.3 }}>
          {initials(song?.artist || song?.title)}
        </div>
      )}
    </motion.div>
  );
});

const ProgressBar = memo(function ProgressBar({ currentTime, duration, onSeek, dragRef, theme }) {
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const [isDragging, setIsDragging] = useState(false);
  const handleStart = useCallback(() => { setIsDragging(true);  if (dragRef) dragRef.current = true;  }, [dragRef]);
  const handleEnd   = useCallback(() => { setIsDragging(false); if (dragRef) dragRef.current = false; }, [dragRef]);
  const handleChange = useCallback((e) => onSeek(Number(e.target.value)), [onSeek]);
  return (
    <div className="w-full">
      <div className="relative h-8 flex items-center cursor-pointer">
        <div className="absolute left-0 right-0 h-1 rounded-full overflow-hidden pointer-events-none" style={{ backgroundColor: theme.border }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ type: "tween", duration: isDragging ? 0 : 0.1 }}
            className="h-full rounded-full" style={{ backgroundColor: theme.light }}
          />
        </div>
        {isDragging && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute w-3 h-3 rounded-full -translate-x-1/2 pointer-events-none z-10"
            style={{ left: `${pct}%`, backgroundColor: theme.light, boxShadow: `0 0 12px ${theme.light}` }}
          />
        )}
        <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
          onMouseDown={handleStart} onTouchStart={handleStart}
          onMouseUp={handleEnd}   onTouchEnd={handleEnd}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0"
        />
      </div>
      <div className="flex justify-between text-xs mt-1" style={{ color: theme.muted }}>
        <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
      </div>
    </div>
  );
});

const VolumeSlider = memo(function VolumeSlider({ volume, onChange, theme }) {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <div className="flex items-center gap-2 w-full">
      <RiVolumeDownLine size={15} style={{ color: theme.muted }} className="shrink-0" />
      <div className="flex-1 relative h-7 flex items-center cursor-pointer">
        <div className="absolute left-0 right-0 h-1 rounded-full overflow-hidden pointer-events-none" style={{ backgroundColor: theme.border }}>
          <div className="h-full rounded-full" style={{ width: `${volume * 100}%`, backgroundColor: theme.light }} />
        </div>
        {isDragging && (
          <div className="absolute w-3 h-3 rounded-full -translate-x-1/2 pointer-events-none z-10"
            style={{ left: `${volume * 100}%`, backgroundColor: theme.light, boxShadow: `0 0 12px ${theme.light}` }}
          />
        )}
        <input type="range" min={0} max={1} step={0.01} value={volume}
          onMouseDown={() => setIsDragging(true)}  onTouchStart={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}    onTouchEnd={() => setIsDragging(false)}
          onChange={onChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0"
        />
      </div>
      <RiVolumeUpLine size={17} style={{ color: theme.muted }} className="shrink-0" />
    </div>
  );
});

const SearchBar = memo(function SearchBar({ value, onChange, theme }) {
  return (
    <div className="relative mb-2.5">
      <RiSearch2Line size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.muted }} />
      <input type="text" value={value} onChange={onChange} placeholder="Buscar canción o artista…"
        className="w-full py-3 pl-9 pr-3 rounded-xl text-base outline-none"
        style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.surface, color: theme.text, caretColor: theme.light, WebkitAppearance: "none" }}
      />
    </div>
  );
});

const SongRow = memo(function SongRow({ song, isActive, playing, isFav, onPlay, onToggleFav, onDelete, theme }) {
  return (
    <div role="button" tabIndex={0}
      onClick={onPlay} onKeyDown={(e) => e.key === "Enter" && onPlay()}
      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer outline-none select-none transition-colors duration-150"
      style={{ backgroundColor: isActive ? theme.surface : "transparent" }}
    >
      <AlbumArt song={song} size={44} playing={isActive && playing} theme={theme} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: isActive ? theme.light : theme.text }}>{song.title}</p>
        <p className="text-xs truncate" style={{ color: theme.muted }}>{song.artist}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer">
          {isFav ? <RiHeart3Fill size={20} style={{ color: theme.light }} /> : <RiHeart3Line size={20} style={{ color: theme.accent }} />}
        </motion.button>
        {onDelete && (
          <motion.button whileTap={{ scale: 0.9 }} type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(song); }}
            className="w-9 h-9 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer">
            <RiDeleteBinLine size={18} style={{ color: "#e07070" }} />
          </motion.button>
        )}
      </div>
    </div>
  );
});

const MiniPlayer = memo(function MiniPlayer({ song, playing, theme, isDark, onOpen, onToggle }) {
  return (
    <motion.div
      initial={{ y: 64, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 64, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="fixed left-0 right-0 z-40 px-3"
      style={{ bottom: "calc(3.6rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="max-w-lg mx-auto">
        <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={onOpen}
          className="w-full flex items-center gap-3 p-3 rounded-2xl text-left border-none cursor-pointer"
          style={{
            backgroundColor: theme.surface, outline: `1px solid ${theme.border}`,
            boxShadow: isDark ? "0 -4px 24px rgba(0,0,0,0.5)" : "0 -4px 24px rgba(90,60,40,0.1)",
          }}
        >
          <AlbumArt song={song} size={44} playing={playing} theme={theme} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{song.title}</p>
            <p className="text-xs truncate" style={{ color: theme.muted }}>{song.artist}</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ backgroundColor: theme.accent, color: isDark ? theme.light : theme.card }}>
            {playing ? <RiPauseFill size={22} /> : <RiPlayFill size={22} />}
          </motion.button>
        </motion.button>
      </div>
    </motion.div>
  );
});

const TAB_ITEMS = [
  { key: "home",      ActiveIcon: RiHome4Fill,  IdleIcon: RiHome4Line,  label: "Principal" },
  { key: "library",   ActiveIcon: RiMusic2Fill,  IdleIcon: RiMusic2Line, label: "Biblioteca" },
  { key: "favorites", ActiveIcon: RiHeart3Fill,  IdleIcon: RiHeart3Line, label: "Favoritos"  },
];

const TabBar = memo(function TabBar({ tab, theme, onSelect }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around pt-2"
      style={{ backgroundColor: theme.nav, borderTop: `1px solid ${theme.border}`, paddingBottom: "env(safe-area-inset-bottom, 8px)", minHeight: "3.6rem" }}>
      {TAB_ITEMS.map(({ key, ActiveIcon, IdleIcon, label }) => {
        const active = tab === key;
        const Icon   = active ? ActiveIcon : IdleIcon;
        return (
          <motion.button whileTap={{ scale: 0.95 }} key={key} type="button" onClick={() => onSelect(key)}
            className="flex flex-col items-center gap-0.5 py-2 px-5 bg-none border-none cursor-pointer">
            <Icon size={24} style={{ color: active ? theme.light : theme.accent }} />
            <span className="text-[11px] font-medium" style={{ color: active ? theme.light : theme.accent }}>{label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
});

const FullPlayer = memo(function FullPlayer({
  song, playing, currentTime, duration, isFav, volume,
  dragRef, theme, isDark, onVolumeChange, onSeek,
  onPrev, onNext, onToggle, onToggleFav, onClose,
}) {
  const artSize = Math.min(220, window.innerWidth - 80);
  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 320 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: isDark ? theme.card : theme.bg }}
    >
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={onClose}
          className="bg-none border-none cursor-pointer" style={{ color: theme.muted }}>
          <RiArrowDownSLine size={36} />
        </motion.button>
        <div className="w-9 h-1 rounded-full" style={{ backgroundColor: theme.border }} />
        <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={onToggleFav}
          className="w-9 h-9 flex items-center justify-center bg-none border-none cursor-pointer">
          {isFav ? <RiHeart3Fill size={22} style={{ color: theme.light }} /> : <RiHeart3Line size={22} style={{ color: theme.accent }} />}
        </motion.button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-evenly px-8 max-w-lg mx-auto w-full">
        <AlbumArt song={song} size={artSize} playing={playing} theme={theme} />
        <div className="w-full text-center">
          <h2 className="text-2xl font-bold truncate" style={{ color: theme.text }}>{song?.title || "Sin canción"}</h2>
          <p className="text-base truncate mt-1" style={{ color: theme.muted }}>{song?.artist || ""}</p>
        </div>
        <div className="w-full">
          <ProgressBar currentTime={currentTime} duration={duration} onSeek={onSeek} dragRef={dragRef} theme={theme} />
        </div>
        <div className="flex items-center justify-between w-full">
          <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={onPrev}
            className="w-14 h-14 flex items-center justify-center bg-none border-none cursor-pointer" style={{ color: theme.text }}>
            <RiSkipBackFill size={36} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={onToggle}
            className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 border-none cursor-pointer"
            style={{ backgroundColor: theme.light, color: theme.bg, boxShadow: `0 8px 32px ${theme.accent}55` }}>
            {playing ? <RiPauseFill size={38} /> : <RiPlayFill size={38} />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={onNext}
            className="w-14 h-14 flex items-center justify-center bg-none border-none cursor-pointer" style={{ color: theme.text }}>
            <RiSkipForwardFill size={36} />
          </motion.button>
        </div>
        <VolumeSlider volume={volume} onChange={onVolumeChange} theme={theme} />
      </div>
      <div className="h-[env(safe-area-inset-bottom,24px)]" />
    </motion.div>
  );
});

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
function Reproductor() {
  const navigate    = useNavigate();
  const audioRef    = useRef(null);
  const dragRef     = useRef(false);
  const artSizeHome = useRef(getArtSize()).current;

  const [songs, setSongs]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState("home");
  const [currentIdx, setCurrentIdx]   = useState(null);
  const [playing, setPlaying]         = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [volume, setVolume]           = useState(0.8);
  const [showFull, setShowFull]       = useState(false);
  const [search, setSearch]           = useState("");
  const [uploading, setUploading]     = useState(false);

  const [isDark, setIsDark] = useState(() => {
    try { return JSON.parse(localStorage.getItem(THEME_KEY) ?? "true"); } catch { return true; }
  });
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]"); } catch { return []; }
  });

  const theme    = isDark ? themes.dark : themes.light;
  const song     = currentIdx !== null ? songs[currentIdx] : null;
  const isFavSong = song ? favorites.includes(song.id) : false;
  const showMini  = song && tab !== "home";

  // ── Carga canciones desde Firebase ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      const cached = readCache();
      if (cached) { setSongs(cached); setLoading(false); return; }
      const data = await fetchSongs();
      writeCache(data);
      setSongs(data);
      setLoading(false);
    })();
  }, []);

  // ── Audio controls ────────────────────────────────────────────────────────
  const play = useCallback((idx) => { setCurrentIdx(idx); setPlaying(true); }, []);

  const togglePlay = useCallback(() => {
    if (currentIdx === null) { if (songs.length) play(0); return; }
    setPlaying((p) => !p);
  }, [currentIdx, songs.length, play]);

  const next = useCallback(
    () => { if (songs.length) play(currentIdx !== null ? (currentIdx + 1) % songs.length : 0); },
    [currentIdx, songs.length, play],
  );
  const prev = useCallback(
    () => { if (songs.length) play(currentIdx !== null ? (currentIdx - 1 + songs.length) % songs.length : 0); },
    [currentIdx, songs.length, play],
  );

  const seek = useCallback((v) => {
    if (audioRef.current) audioRef.current.currentTime = v;
    setCurrentTime(v);
  }, []);

  const changeVolume = useCallback((e) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const toggleFav     = useCallback((id) => setFavorites((f) => f.includes(id) ? f.filter((x) => x !== id) : [...f, id]), []);
  const toggleFavSong = useCallback(() => { if (song) toggleFav(song.id); }, [song, toggleFav]);
  const openFull      = useCallback(() => setShowFull(true),  []);
  const closeFull     = useCallback(() => setShowFull(false), []);
  const toggleTheme   = useCallback(() => setIsDark((d) => !d), []);
  const handleSearch  = useCallback((e) => setSearch(e.target.value), []);
  const handleBack    = useCallback(() => navigate("/", { replace: true }), [navigate]);

  const onTimeUpdate = useCallback((e) => { if (!dragRef.current) setCurrentTime(e.currentTarget.currentTime); }, []);
  const onLoadedMeta = useCallback((e) => { setDuration(e.currentTarget.duration || 0); setCurrentTime(0); }, []);

  // ── Upload handler ────────────────────────────────────────────────────────
  const handleUploadSong = useCallback(async () => {
    const { value: formData } = await Swal.fire({
      ...swalBase,
      title: "Agregar canción",
      html: `
        <div style="display:flex;flex-direction:column;gap:10px;text-align:left">
          <div>
            <label style="font-size:11px;font-weight:600;color:#6b5a4e;display:block;margin-bottom:3px">Título *</label>
            <input id="swal-title" class="swal2-input" placeholder="Nombre de la canción" style="margin:0;width:100%;box-sizing:border-box" />
          </div>
          <div>
            <label style="font-size:11px;font-weight:600;color:#6b5a4e;display:block;margin-bottom:3px">Artista *</label>
            <input id="swal-artist" class="swal2-input" placeholder="Nombre del artista" style="margin:0;width:100%;box-sizing:border-box" />
          </div>
          <div>
            <label style="font-size:11px;font-weight:600;color:#6b5a4e;display:block;margin-bottom:3px">Audio * (MP3 recomendado, máx 50 MB)</label>
            <input id="swal-audio" type="file" accept="audio/*" class="swal2-input" style="margin:0;width:100%;box-sizing:border-box;padding:6px;height:auto" />
          </div>
          <div>
            <label style="font-size:11px;font-weight:600;color:#6b5a4e;display:block;margin-bottom:3px">Portada (opcional)</label>
            <input id="swal-cover" type="file" accept="image/*" class="swal2-input" style="margin:0;width:100%;box-sizing:border-box;padding:6px;height:auto" />
          </div>
        </div>`,
      showCancelButton: true,
      confirmButtonText: "Subir",
      cancelButtonText: "Cancelar",
      focusConfirm: false,
      preConfirm: () => {
        const title      = document.getElementById("swal-title").value.trim();
        const artist     = document.getElementById("swal-artist").value.trim();
        const audioInput = document.getElementById("swal-audio");
        const coverInput = document.getElementById("swal-cover");
        if (!title)              { Swal.showValidationMessage("El título es requerido");   return false; }
        if (!artist)             { Swal.showValidationMessage("El artista es requerido");  return false; }
        if (!audioInput.files[0]) { Swal.showValidationMessage("Selecciona un archivo de audio"); return false; }
        if (audioInput.files[0].size > 50 * 1024 * 1024) {
          Swal.showValidationMessage("El archivo de audio supera los 50 MB"); return false;
        }
        return { title, artist, audioFile: audioInput.files[0], coverFile: coverInput.files[0] ?? null };
      },
    });

    if (!formData) return;
    setUploading(true);

    // Swal de progreso
    Swal.fire({
      ...swalBase,
      title: "Subiendo canción…",
      html: `<div style="font-size:13px;color:#6b5a4e;margin-bottom:8px">Preparando archivos…</div>
             <div style="height:6px;border-radius:999px;background:#d8cfc5;overflow:hidden">
               <div id="swal-up-fill" style="height:100%;width:0%;background:#6b5a4e;border-radius:999px;transition:width .2s"></div>
             </div>
             <div id="swal-up-pct" style="margin-top:6px;font-size:12px;font-weight:700;color:#3a2a1c">0%</div>`,
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    try {
      const newSong = await uploadSong(formData, (p) => {
        const fill = document.getElementById("swal-up-fill");
        const text = document.getElementById("swal-up-pct");
        if (fill) fill.style.width = `${p}%`;
        if (text) text.textContent = `${p}%`;
      });
      const updated = [...songs, newSong];
      writeCache(updated);
      setSongs(updated);
      Swal.fire({ ...swalBase, title: "¡Canción agregada! 🎵", icon: "success", timer: 1800, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ ...swalBase, title: "Error al subir", text: err.message, icon: "error", confirmButtonText: "Entendido" });
    } finally {
      setUploading(false);
    }
  }, [songs]);

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDeleteSong = useCallback(async (s) => {
    const res = await Swal.fire({
      ...swalBase,
      title: `¿Eliminar "${s.title}"?`,
      text: "Se borrará permanentemente de Firebase.",
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;
    await deleteSong(s.id, s.audioPath, s.coverPath);
    const updated = songs.filter((x) => x.id !== s.id);
    writeCache(updated);
    setSongs(updated);
    if (song?.id === s.id) { setCurrentIdx(null); setPlaying(false); }
  }, [songs, song]);

  // ── Efectos ───────────────────────────────────────────────────────────────
  useEffect(() => { try { localStorage.setItem(THEME_KEY, JSON.stringify(isDark)); } catch {} }, [isDark]);
  useEffect(() => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(favorites)); } catch {} }, [favorites]);
  useEffect(() => { setSearch(""); }, [tab]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || currentIdx === null) return;
    a.load();
    if (playing) a.play().catch(() => setPlaying(false));
  }, [currentIdx]); // eslint-disable-line

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  useEffect(() => {
    const onKey = (e) => {
      if (document.activeElement?.tagName === "INPUT") return;
      switch (e.code) {
        case "Space":      e.preventDefault(); togglePlay(); break;
        case "ArrowRight": e.preventDefault(); next(); break;
        case "ArrowLeft":  e.preventDefault(); prev(); break;
        case "ArrowUp":    e.preventDefault(); setVolume((v) => { const n = Math.min(1, v + 0.05); if (audioRef.current) audioRef.current.volume = n; return n; }); break;
        case "ArrowDown":  e.preventDefault(); setVolume((v) => { const n = Math.max(0, v - 0.05); if (audioRef.current) audioRef.current.volume = n; return n; }); break;
        case "KeyF":   if (song) toggleFav(song.id); break;
        case "Escape": setShowFull(false); break;
        case "KeyM":   setVolume((v) => { const n = v > 0 ? 0 : 0.8; if (audioRef.current) audioRef.current.volume = n; return n; }); break;
        case "Digit1": setTab("home"); break;
        case "Digit2": setTab("library"); break;
        case "Digit3": setTab("favorites"); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, next, prev, song, toggleFav]);

  // ── Datos derivados ───────────────────────────────────────────────────────
  const filteredSongs = useMemo(() => {
    if (!search.trim()) return songs;
    const q = search.toLowerCase();
    return songs.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
  }, [search, songs]);

  const favSongs = useMemo(() => songs.filter((s) => favorites.includes(s.id)), [favorites, songs]);

  const renderSongList = useCallback(
    (list, emptyIcon, emptyMsg, showDelete = false) => (
      <div className="overflow-y-auto" style={{ maxHeight: "min(380px, 56vh)" }}>
        {list.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: theme.muted }}>
            {emptyIcon}
            <p className="text-sm text-center">{emptyMsg}</p>
          </motion.div>
        ) : (
          list.map((s) => (
            <SongRow key={s.id} song={s}
              isActive={song?.id === s.id} playing={playing}
              isFav={favorites.includes(s.id)}
              onPlay={() => play(songs.indexOf(s))}
              onToggleFav={() => toggleFav(s.id)}
              onDelete={showDelete ? handleDeleteSong : null}
              theme={theme}
            />
          ))
        )}
      </div>
    ),
    [song, playing, favorites, songs, play, toggleFav, handleDeleteSong, theme],
  );

  if (loading) return <Carga />;

  return (
    <div className="min-h-dvh flex flex-col transition-colors duration-300" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <HomeButton theme={theme} isDark={isDark} onClick={handleBack} />

      <main className="flex-1 overflow-y-auto"
        style={{ paddingBottom: tab === "home" ? "4rem" : showMini ? "8.5rem" : "4.5rem" }}>
        <div className="max-w-lg mx-auto w-full">

          {/* ── HOME ── */}
          {tab === "home" && (
            <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-3 sm:p-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="w-full max-w-sm rounded-3xl flex flex-col items-center"
                style={{
                  padding: "clamp(1rem, 4vw, 1.5rem)", gap: "clamp(0.75rem, 3vw, 1.25rem)",
                  backgroundColor: isDark ? theme.surface : theme.card,
                  border: `1px solid ${theme.border}`,
                  boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.45)" : "0 8px 40px rgba(90,60,40,0.12)",
                }}
              >
                <div className="w-full flex justify-end">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme}
                    className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
                    style={{ backgroundColor: theme.border }}>
                    {isDark ? <RiSunLine size={18} style={{ color: theme.light }} /> : <RiMoonLine size={18} style={{ color: theme.light }} />}
                  </motion.button>
                </div>

                <AlbumArt song={song ?? songs[0] ?? null} size={artSizeHome} playing={playing} theme={theme} />

                <div className="w-full text-center">
                  <h1 className="font-semibold mb-1 leading-snug" style={{ color: theme.text, fontSize: "clamp(0.85rem, 4vw, 1.1rem)" }}>
                    {getGreeting()}
                  </h1>
                  <p className="text-xs uppercase tracking-widest mt-2 mb-1" style={{ color: theme.muted }}>
                    {song ? "Reproduciendo ahora" : songs.length ? "Sin reproducción" : "Sin canciones"}
                  </p>
                  <h2 className="font-bold truncate" style={{ color: theme.text, fontSize: "clamp(0.95rem, 4.5vw, 1.15rem)" }}>
                    {(song ?? songs[0])?.title ?? "—"}
                  </h2>
                  <p className="text-sm truncate" style={{ color: theme.muted }}>{(song ?? songs[0])?.artist ?? ""}</p>
                </div>

                {song && (
                  <div className="w-full">
                    <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} dragRef={dragRef} theme={theme} />
                  </div>
                )}

                <div className="flex items-center justify-between w-full">
                  <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={prev}
                    className="rounded-full flex items-center justify-center border-none cursor-pointer"
                    style={{ width: "clamp(2.5rem,12vw,3.25rem)", height: "clamp(2.5rem,12vw,3.25rem)", backgroundColor: theme.border, color: theme.text }}>
                    <RiSkipBackFill size={20} />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={togglePlay}
                    className="rounded-full flex items-center justify-center border-none cursor-pointer"
                    style={{ width: "clamp(3rem,14vw,3.75rem)", height: "clamp(3rem,14vw,3.75rem)", backgroundColor: theme.light, color: theme.bg, boxShadow: `0 6px 24px ${theme.accent}55` }}>
                    {playing ? <RiPauseFill size={28} /> : <RiPlayFill size={28} />}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={next}
                    className="rounded-full flex items-center justify-center border-none cursor-pointer"
                    style={{ width: "clamp(2.5rem,12vw,3.25rem)", height: "clamp(2.5rem,12vw,3.25rem)", backgroundColor: theme.border, color: theme.text }}>
                    <RiSkipForwardFill size={20} />
                  </motion.button>
                </div>

                <VolumeSlider volume={volume} onChange={changeVolume} theme={theme} />

                <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={toggleFavSong}
                  className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 border-none"
                  style={{
                    backgroundColor: isFavSong ? theme.accent : "transparent",
                    outline: `1.5px solid ${isFavSong ? theme.accent : theme.border}`,
                    color: isFavSong ? theme.card : theme.muted,
                    cursor: song ? "pointer" : "not-allowed", opacity: song ? 1 : 0.45,
                  }}>
                  {isFavSong ? <><RiHeart3Fill size={15} /> En Favoritos</> : <><RiHeart3Line size={15} /> Agregar a Favoritos</>}
                </motion.button>
              </motion.div>
            </div>
          )}

          {/* ── BIBLIOTECA ── */}
          {tab === "library" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 pt-16">
              <div className="flex items-center justify-between mb-0.5">
                <h1 className="text-3xl font-bold" style={{ color: theme.text }}>Biblioteca</h1>
                <motion.button whileTap={{ scale: 0.92 }} onClick={handleUploadSong} disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-none cursor-pointer transition disabled:opacity-50"
                  style={{ backgroundColor: theme.accent, color: theme.light }}>
                  <RiAddLine size={16} />
                  {uploading ? "Subiendo…" : "Agregar"}
                </motion.button>
              </div>
              <p className="text-sm mb-4" style={{ color: theme.muted }}>{songs.length} canciones</p>
              <SearchBar value={search} onChange={handleSearch} theme={theme} />
              {renderSongList(
                filteredSongs,
                <RiSearch2Line size={42} style={{ color: theme.border }} />,
                `Sin resultados para "${search}"`,
                true, // muestra botón eliminar
              )}
            </motion.div>
          )}

          {/* ── FAVORITOS ── */}
          {tab === "favorites" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 pt-16">
              <h1 className="text-3xl font-bold mb-0.5" style={{ color: theme.text }}>Favoritos</h1>
              <p className="text-sm mb-4" style={{ color: theme.muted }}>
                {favSongs.length} canción{favSongs.length !== 1 ? "es" : ""}
              </p>
              {renderSongList(
                favSongs,
                <RiHeart3Line size={48} style={{ color: theme.border }} />,
                "Toca el ♥ en cualquier canción para verla aquí",
              )}
            </motion.div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showMini && <MiniPlayer song={song} playing={playing} theme={theme} isDark={isDark} onOpen={openFull} onToggle={togglePlay} />}
      </AnimatePresence>

      <TabBar tab={tab} theme={theme} onSelect={setTab} />

      <AnimatePresence>
        {showFull && (
          <FullPlayer
            song={song} playing={playing} currentTime={currentTime} duration={duration}
            isFav={isFavSong} volume={volume} dragRef={dragRef} theme={theme} isDark={isDark}
            onVolumeChange={changeVolume} onSeek={seek} onPrev={prev} onNext={next}
            onToggle={togglePlay} onToggleFav={toggleFavSong} onClose={closeFull}
          />
        )}
      </AnimatePresence>

      <audio ref={audioRef} src={song?.src}
        onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMeta} onEnded={next}
      />
    </div>
  );
}

export default Reproductor;

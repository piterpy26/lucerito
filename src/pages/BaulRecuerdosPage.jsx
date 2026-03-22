import useDownloader from "react-use-downloader";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaBox } from "react-icons/fa";
import { FiLogOut, FiMoreVertical } from "react-icons/fi";
import {
  RiApps2Line,
  RiCheckboxMultipleLine,
  RiDashboardLine,
  RiDeleteBinLine,
  RiDownloadCloud2Line,
  RiDownloadLine,
  RiImageLine,
  RiLayoutGridLine,
  RiListCheck2,
  RiUploadCloud2Line,
  RiVideoLine,
  RiLinksLine,
  RiShareForwardLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Lightbox, { useLightboxState } from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import Carga from "../components/Carga";
import {
  compressImage,
  deleteMedia,
  downloadAllAsZip,
  fetchMedia,
  shareMedia,
  uploadMedia,
} from "../firebase/mediaService";

// ── Constantes ────────────────────────────────────────────────────────────────
const CACHE_KEY = "baul_media_cache";
const CACHE_TTL = 5 * 60_000;
const IS_MOBILE =
  /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
  window.innerWidth < 640;
const UPLOAD_INIT = { active: false, progress: 0, total: 0, done: 0 };
const DELETE_INIT = { total: 0, done: 0 };

const FILTERS = [
  { key: "all", label: "Todos", Icon: RiApps2Line },
  { key: "image", label: "Fotos", Icon: RiImageLine },
  { key: "video", label: "Videos", Icon: RiVideoLine },
];

const swalBase = {
  confirmButtonColor: "#6b5a4e",
  color: "#2e1f14",
  background: "#ede5d8",
};

const MASONRY_CSS = `
  .baul-compact { column-count:4; column-gap:4px; }
  .baul-grid    { column-count:3; column-gap:6px;  }
  @media(min-width:480px)  { .baul-compact{column-count:6}  .baul-grid{column-count:4} }
  @media(min-width:768px)  { .baul-compact{column-count:8}  .baul-grid{column-count:5} }
  @media(min-width:1280px) { .baul-compact{column-count:10} .baul-grid{column-count:6} }
`;

// ── Cache ─────────────────────────────────────────────────────────────────────
function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const isImage = (type) => type?.startsWith("image");

// Con HTTPS navigator.clipboard funciona en todos los browsers modernos
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback execCommand para WebViews antiguos
    try {
      const el = Object.assign(document.createElement("textarea"), {
        value: text,
        readOnly: true,
        style: "position:fixed;opacity:0;pointer-events:none",
      });
      document.body.appendChild(el);
      el.focus();
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

// ── Helpers de upload ─────────────────────────────────────────────────────────
async function confirmDuplicates(files, items) {
  const existingNames = new Set(
    items.map((i) => i.name?.toLowerCase().trim()).filter(Boolean),
  );
  const dupes = files.filter((f) =>
    existingNames.has(f.name.toLowerCase().trim()),
  );
  if (!dupes.length) return { filesToUpload: files, baseItems: items };

  const dupListHTML = dupes
    .map(
      (f) =>
        `<li style="font-size:12px;padding:2px 0;text-align:left">⚠️ ${f.name}</li>`,
    )
    .join("");

  const result = await Swal.fire({
    ...swalBase,
    title: `${dupes.length} duplicado${dupes.length > 1 ? "s" : ""} detectado${dupes.length > 1 ? "s" : ""}`,
    html: `<p style="font-size:13px;margin-bottom:8px">Ya existen en el baúl:</p>
           <ul style="max-height:120px;overflow-y:auto;padding:0 4px;list-style:none;margin:0">${dupListHTML}</ul>`,
    icon: "warning",
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Solo subir nuevos",
    denyButtonText: "Reemplazar",
    cancelButtonText: "Cancelar",
    denyButtonColor: "#a07060",
  });

  if (result.isDismissed) return null;
  if (result.isConfirmed) {
    const filesToUpload = files.filter(
      (f) => !existingNames.has(f.name.toLowerCase().trim()),
    );
    if (!filesToUpload.length) {
      await Swal.fire({
        ...swalBase,
        title: "Sin archivos nuevos",
        text: "Todos ya existen en el baúl.",
        icon: "info",
        confirmButtonText: "Entendido",
      });
      return null;
    }
    return { filesToUpload, baseItems: items };
  }
  return {
    filesToUpload: files,
    baseItems: items.filter(
      (item) =>
        !dupes.some(
          (f) =>
            f.name.toLowerCase().trim() === item.name?.toLowerCase().trim(),
        ),
    ),
  };
}

async function confirmUploadList(files) {
  const listaHTML = files
    .map((f) => {
      const mb = (f.size / 1024 / 1024).toFixed(2);
      const tipo = f.type.startsWith("image/") ? "📷" : "🎬";
      return `<li style="display:flex;justify-content:space-between;gap:16px;font-size:12px;padding:3px 0;border-bottom:1px solid #c8b8a8">
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px">${tipo} ${f.name}</span>
      <span style="flex-shrink:0;font-weight:600">${mb} MB</span>
    </li>`;
    })
    .join("");
  const totalMB = (files.reduce((a, f) => a + f.size, 0) / 1024 / 1024).toFixed(
    2,
  );
  const res = await Swal.fire({
    ...swalBase,
    title: `Subir ${files.length} archivo${files.length === 1 ? "" : "s"}`,
    html: `<ul style="text-align:left;max-height:180px;overflow-y:auto;padding:0 4px;list-style:none;margin:0">${listaHTML}</ul>
           <p style="margin-top:12px;font-size:14px;font-weight:700;color:#3a2a1c">Total: ${totalMB} MB</p>`,
    showCancelButton: true,
    confirmButtonText: "Subir",
    cancelButtonText: "Cancelar",
  });
  return res.isConfirmed;
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
const MasonryStyles = memo(() => <style>{MASONRY_CSS}</style>);

const UploadProgress = memo(function UploadProgress({ state }) {
  if (!state.active) return null;
  return (
    <div className="w-80 mx-auto mb-3 shrink-0">
      <div className="flex justify-between items-center mb-1">
        <p className="text-[11px] font-bold text-[#3a2a1c]">
          Subiendo {state.done} de {state.total} archivo
          {state.total === 1 ? "" : "s"}…
        </p>
        <p className="text-[11px] text-[#6b5a4e] font-semibold">
          {state.progress}%
        </p>
      </div>
      <div className="w-full bg-[#d8cfc5] rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-[#6b5a4e] h-1.5 rounded-full transition-all duration-200"
          style={{ width: `${state.progress}%` }}
        />
      </div>
    </div>
  );
});

const DeleteProgress = memo(function DeleteProgress({ state }) {
  if (state.done >= state.total) return null;
  const pct = Math.round((state.done / state.total) * 100);
  return (
    <div className="w-80 mx-auto mb-3 shrink-0">
      <div className="flex justify-between items-center mb-1">
        <p className="text-[11px] font-bold text-red-700">
          Eliminando {state.done} de {state.total} archivo
          {state.total === 1 ? "" : "s"}…
        </p>
        <p className="text-[11px] text-red-500 font-semibold">{pct}%</p>
      </div>
      <div className="w-full bg-red-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-red-400 h-1.5 rounded-full transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});

// Barra de descarga — alimentada por react-use-downloader
const DownloadProgress = memo(function DownloadProgress({
  percentage,
  isInProgress,
  onCancel,
}) {
  if (!isInProgress) return null;
  return (
    <div className="w-80 mx-auto mb-3 shrink-0">
      <div className="flex justify-between items-center mb-1">
        <p className="text-[11px] font-bold text-[#3a2a1c]">Descargando…</p>
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-[#6b5a4e] font-semibold">
            {Math.round(percentage)}%
          </p>
          <button
            onClick={onCancel}
            className="text-[10px] text-red-500 font-semibold underline leading-none"
          >
            Cancelar
          </button>
        </div>
      </div>
      <div className="w-full bg-[#d8cfc5] rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-[#6b5a4e] h-1.5 rounded-full transition-all duration-200"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

const FilterBar = memo(function FilterBar({ filter, counts, onSelect }) {
  return (
    <div className="flex gap-2 mb-4 flex-wrap shrink-0">
      {FILTERS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium border transition ${
            filter === key
              ? "bg-[#6b5a4e] text-[#f0ebe4] border-[#4a3728]"
              : "bg-[#d8cfc5] text-[#3a2a1c] border-[#b0a898] hover:bg-[#c8bfb5]"
          }`}
        >
          <Icon size={16} />
          <span>{label}</span>
          <span
            className={`text-[12px] font-semibold px-1 py-0.5 rounded-full ${filter === key ? "bg-white/20" : "bg-black/10"}`}
          >
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
  );
});

const MediaItem = memo(function MediaItem({
  item,
  index,
  size,
  selectMode,
  isSel,
  isDel,
  isDeleting,
  onOpen,
  onToggle,
}) {
  const isCompact = size === "compact";
  const handleClick = useCallback(() => {
    if (isDel || isDeleting) return;
    selectMode ? onToggle(item.id) : onOpen(index);
  }, [isDel, isDeleting, selectMode, item.id, index, onToggle, onOpen]);

  return (
    <div
      onClick={handleClick}
      className={`relative group break-inside-avoid overflow-hidden cursor-pointer transition-all duration-200
        ${isCompact ? "mb-1 rounded-md" : "mb-1.5 rounded-lg"}
        ${selectMode ? "scale-[0.94]" : "scale-100"}
        ${isSel ? "ring-2 ring-inset ring-[#6b5a4e]" : ""}
        ${isDel ? "pointer-events-none" : ""}
      `}
    >
      {isImage(item.type) ? (
        <div className="relative">
          <img
            src={item.url}
            alt={item.name || "Foto"}
            loading="lazy"
            decoding="async"
            className="w-full h-auto block object-cover"
          />
          <span
            className={`absolute bottom-1 left-1 bg-black/60 text-white rounded-full ${isCompact ? "text-[8px] px-1 py-0.5" : "text-[10px] px-1.5 py-0.5 backdrop-blur-sm"}`}
          >
            📷{!isCompact && " Foto"}
          </span>
        </div>
      ) : (
        <div className="relative bg-black">
          <video
            src={item.url}
            className="w-full h-auto block"
            muted
            preload="none"
            playsInline
          />
          <span
            className={`absolute bottom-1 left-1 bg-black/60 text-white rounded-full ${isCompact ? "text-[8px] px-1 py-0.5" : "text-[10px] px-1.5 py-0.5 backdrop-blur-sm"}`}
          >
            🎬{!isCompact && " Video"}
          </span>
        </div>
      )}
      {!isDel && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
      )}
      {isDel && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div
            className={`border-2 border-white border-t-transparent rounded-full animate-spin ${isCompact ? "w-3 h-3" : "w-5 h-5"}`}
          />
        </div>
      )}
      {selectMode && !isDel && (
        <button
          type="button"
          aria-label={isSel ? "Deseleccionar" : "Seleccionar"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(item.id);
          }}
          className={`absolute ${isCompact ? "top-1 right-1 w-4 h-4 text-[8px]" : "top-1.5 right-1.5 w-5 h-5 text-[10px]"} rounded-full border-2 flex items-center justify-center font-bold transition-all duration-150 ${
            isSel
              ? "bg-[#6b5a4e] border-[#6b5a4e] text-white"
              : "bg-white/80 border-white/90 text-transparent"
          }`}
        >
          ✓
        </button>
      )}
    </div>
  );
});

const MediaListItem = memo(function MediaListItem({
  item,
  index,
  selectMode,
  isSel,
  isDel,
  isDeleting,
  onOpen,
  onToggle,
  onShare,
  onCopyLink,
  onDownload,
  onDelete,
}) {
  const handleRowClick = useCallback(() => {
    if (isDel || isDeleting) return;
    selectMode ? onToggle(item.id) : onOpen(index);
  }, [isDel, isDeleting, selectMode, item.id, index, onToggle, onOpen]);

  return (
    <div
      onClick={handleRowClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition
        ${selectMode ? "scale-[0.98]" : "scale-100"}
        ${isSel ? "bg-[#ddd5c8] border-[#6b5a4e]" : "bg-[#e8e0d8] border-[#b0a898] hover:bg-[#ddd5cb]"}
        ${isDel ? "pointer-events-none" : "cursor-pointer"}
      `}
    >
      {isDel && (
        <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center z-20">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {selectMode && !isDel && (
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 transition ${
            isSel
              ? "bg-[#6b5a4e] border-[#6b5a4e] text-white"
              : "bg-white/80 border-[#b0a898] text-transparent"
          }`}
        >
          ✓
        </div>
      )}
      <div
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          if (!isDel) onOpen(index);
        }}
      >
        {isImage(item.type) ? (
          <img
            src={item.url}
            alt={item.name || "Foto"}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <video
            src={item.url}
            className="w-full h-full object-cover"
            muted
            preload="none"
            playsInline
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#3a2a1c] truncate leading-tight">
          {item.name || "Sin nombre"}
        </p>
        <p className="text-xs text-[#6b5a4e] mt-0.5">
          {isImage(item.type) ? "📷 Foto" : "🎬 Video"}
        </p>
      </div>
      {!selectMode && !isDel && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            aria-label="Copiar enlace"
            title="Copiar enlace"
            onClick={(e) => {
              e.stopPropagation();
              onCopyLink(item);
            }}
            className="p-2 rounded-full text-[#6b5a4e] hover:bg-[#c8bfb5] transition"
          >
            <RiLinksLine size={16} />
          </button>
          <button
            aria-label="Compartir"
            title="Compartir"
            onClick={(e) => {
              e.stopPropagation();
              onShare(item);
            }}
            className="p-2 rounded-full text-[#6b5a4e] hover:bg-[#c8bfb5] transition"
          >
            <RiShareForwardLine size={16} />
          </button>
          <button
            aria-label="Descargar"
            title="Descargar"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(item);
            }}
            className="p-2 rounded-full text-[#6b5a4e] hover:bg-[#c8bfb5] transition"
          >
            <RiDownloadLine size={16} />
          </button>
          <button
            aria-label="Eliminar"
            title="Eliminar"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            className="p-2 rounded-full text-red-400 hover:bg-red-100 transition"
          >
            <RiDeleteBinLine size={16} />
          </button>
        </div>
      )}
    </div>
  );
});

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
function BaulRecuerdosPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const actionsRef = useRef(null);
  const menuRef = useRef(null);
  const lbRef = useRef({}); // bridge handlers → botones del Lightbox

  // react-use-downloader — maneja fetch, progreso y cancelación automáticamente
  const { download, percentage, isInProgress, cancel } = useDownloader();

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(new Set());
  const [lightboxIdx, setLightboxIdx] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(new Set());
  const [uploadState, setUploadState] = useState(UPLOAD_INIT);
  const [deleteState, setDeleteState] = useState(DELETE_INIT);

  const isDeleting = deleteState.done < deleteState.total;

  useEffect(() => {
    const handle = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target))
        setShowActions(false);
      if (menuRef.current && !menuRef.current.contains(e.target))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    (async () => {
      const cached = readCache();
      if (cached) {
        setItems(cached);
        setLoading(false);
        return;
      }
      const data = await fetchMedia();
      writeCache(data);
      setItems(data);
      setLoading(false);
    })();
  }, []);

  // ── Datos derivados ───────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      filter === "all"
        ? items
        : items.filter((i) =>
            filter === "image" ? isImage(i.type) : !isImage(i.type),
          ),
    [items, filter],
  );

  const slides = useMemo(
    () =>
      filtered.map((item) =>
        isImage(item.type)
          ? {
              src: item.url,
              download: item.url,
              downloadName: item.name ?? "foto",
            }
          : {
              type: "video",
              sources: [{ src: item.url, type: "video/mp4" }],
              download: item.url,
              downloadName: item.name ?? "video",
            },
      ),
    [filtered],
  );

  const counts = useMemo(
    () => ({
      all: items.length,
      image: items.filter((i) => isImage(i.type)).length,
      video: items.filter((i) => !isImage(i.type)).length,
    }),
    [items],
  );

  // ── Descarga con react-use-downloader ─────────────────────────────────────
  // Con HTTPS funciona en todos los navegadores incluyendo iOS Safari
  const triggerDownload = useCallback(
    async (url, name) => {
      await download(url, name);
    },
    [download],
  );

  // ── Handlers del Lightbox (operan sobre la URL ya cargada) ────────────────
  const handleLightboxCopy = useCallback(async (url) => {
    const ok = await copyToClipboard(url);
    Swal.fire({
      ...swalBase,
      title: ok ? "Enlace copiado 🔗" : "No se pudo copiar",
      icon: ok ? "success" : "error",
      timer: ok ? 1800 : undefined,
      showConfirmButton: !ok,
      confirmButtonText: "Entendido",
    });
  }, []);

  const handleLightboxShare = useCallback(async (url, name) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
      } else {
        const ok = await copyToClipboard(url);
        Swal.fire({
          ...swalBase,
          title: ok ? "Enlace copiado 🔗" : "No se pudo compartir",
          text: ok
            ? "Tu navegador no soporta compartir. Se copió el enlace."
            : undefined,
          icon: ok ? "success" : "error",
          timer: ok ? 2000 : undefined,
          showConfirmButton: !ok,
          confirmButtonText: "Entendido",
        });
      }
    } catch (err) {
      if (err?.name !== "AbortError" && import.meta.env.DEV)
        console.warn("lightboxShare:", err);
    }
  }, []);

  const handleLightboxDownload = useCallback(
    (url, name) => {
      triggerDownload(url, name);
    },
    [triggerDownload],
  );

  // Siempre la versión más fresca — los botones del Lightbox capturan lbRef
  lbRef.current.copy = handleLightboxCopy;
  lbRef.current.share = handleLightboxShare;
  lbRef.current.download = handleLightboxDownload;

  // Botones creados UNA sola vez con useState — acceden a lbRef sin recrearse
  const [LightboxCopyBtn] = useState(() =>
    memo(function LightboxCopyBtn() {
      const { currentSlide } = useLightboxState();
      const url = currentSlide?.src ?? currentSlide?.sources?.[0]?.src ?? "";
      return (
        <button
          className="yarl__button"
          title="Copiar enlace"
          aria-label="Copiar enlace"
          onClick={() => lbRef.current.copy?.(url)}
        >
          <RiLinksLine size={20} color="white" />
        </button>
      );
    }),
  );

  const [LightboxShareBtn] = useState(() =>
    memo(function LightboxShareBtn() {
      const { currentSlide } = useLightboxState();
      const url = currentSlide?.src ?? currentSlide?.sources?.[0]?.src ?? "";
      const name = currentSlide?.downloadName ?? "";
      return (
        <button
          className="yarl__button"
          title="Compartir"
          aria-label="Compartir"
          onClick={() => lbRef.current.share?.(url, name)}
        >
          <RiShareForwardLine size={20} color="white" />
        </button>
      );
    }),
  );

  // ── Handlers lista/grid ───────────────────────────────────────────────────
  const handleFilterSelect = useCallback((key) => {
    setFilter(key);
    setSelected(new Set());
  }, []);
  const handleOpen = useCallback((idx) => setLightboxIdx(idx), []);

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleCopyLink = useCallback(async (item) => {
    const ok = await copyToClipboard(item.url);
    Swal.fire({
      ...swalBase,
      title: ok ? "Enlace copiado 🔗" : "No se pudo copiar",
      icon: ok ? "success" : "error",
      timer: ok ? 1800 : undefined,
      showConfirmButton: !ok,
      confirmButtonText: "Entendido",
    });
  }, []);

  const handleShare = useCallback(async (item) => {
    try {
      const result = await shareMedia(item);
      if (result.method === "clipboard") {
        Swal.fire({
          ...swalBase,
          title: "Enlace copiado 🔗",
          text: "Tu navegador no soporta compartir archivos. Se copió el enlace.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch {
      Swal.fire({
        ...swalBase,
        title: "No se pudo compartir",
        text: "Intenta descargar el archivo primero.",
        icon: "error",
        confirmButtonText: "Entendido",
      });
    }
  }, []);

  // react-use-downloader — funciona con HTTPS en todos los navegadores
  const handleDownloadOne = useCallback(
    (item) => {
      triggerDownload(item.url, item.name ?? "archivo");
    },
    [triggerDownload],
  );

  const handleDownloadSelected = useCallback(async () => {
    if (!selected.size) return;
    setShowActions(false);
    const toDownload = items.filter((i) => selected.has(i.id));
    if (IS_MOBILE) {
      // Mobile: descarga uno a uno con react-use-downloader
      for (const item of toDownload) {
        await triggerDownload(item.url, item.name ?? "archivo");
      }
    } else {
      // Desktop: ZIP
      downloadAllAsZip(toDownload);
    }
  }, [selected, items, triggerDownload]);

  const handleUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      const dupeResult = await confirmDuplicates(files, items);
      if (!dupeResult) {
        e.target.value = "";
        return;
      }
      const { filesToUpload, baseItems } = dupeResult;
      const confirmed = await confirmUploadList(filesToUpload);
      if (!confirmed) {
        e.target.value = "";
        return;
      }

      setUploadState({
        active: true,
        progress: 0,
        total: filesToUpload.length,
        done: 0,
      });
      const newItems = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const raw = filesToUpload[i];
        if (!isImage(raw.type) && raw.size > 200 * 1024 * 1024) {
          Swal.fire({
            ...swalBase,
            title: "Video muy grande",
            text: `"${raw.name}" supera los 200 MB`,
            icon: "warning",
            confirmButtonText: "Entendido",
          });
          setUploadState((s) => ({ ...s, total: s.total - 1 }));
          continue;
        }
        const file = await compressImage(raw);
        const result = await uploadMedia(file, (p) =>
          setUploadState((s) => ({
            ...s,
            progress: Math.round(((i + p / 100) / filesToUpload.length) * 100),
          })),
        );
        newItems.push(result);
        setUploadState((s) => ({ ...s, done: s.done + 1 }));
      }
      const updated = [...newItems, ...baseItems];
      writeCache(updated);
      setItems(updated);
      setUploadState(UPLOAD_INIT);
      e.target.value = "";
    },
    [items],
  );

  const handleDeleteSelected = useCallback(async () => {
    if (!selected.size) return;
    setShowActions(false);
    const res = await Swal.fire({
      ...swalBase,
      title: `¿Eliminar ${selected.size} archivo${selected.size > 1 ? "s" : ""}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;
    const toDelete = [...selected];
    setDeleteState({ total: toDelete.length, done: 0 });
    setDeleting(new Set(toDelete));
    for (let idx = 0; idx < toDelete.length; idx++) {
      const id = toDelete[idx];
      const item = items.find((i) => i.id === id);
      if (item) await deleteMedia(id, item.path);
      setDeleteState((s) => ({ ...s, done: idx + 1 }));
    }
    const updated = items.filter((i) => !selected.has(i.id));
    writeCache(updated);
    setItems(updated);
    setSelected(new Set());
    setSelectMode(false);
    setDeleting(new Set());
    setDeleteState(DELETE_INIT);
  }, [selected, items]);

  const handleDeleteOne = useCallback(
    async (item) => {
      const res = await Swal.fire({
        ...swalBase,
        title: "¿Eliminar este archivo?",
        text: item.name,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });
      if (!res.isConfirmed) return;
      await deleteMedia(item.id, item.path);
      const updated = items.filter((i) => i.id !== item.id);
      writeCache(updated);
      setItems(updated);
    },
    [items],
  );

  if (loading) return <Carga />;

  return (
    <div className="h-screen bg-[#c8b8a8] flex flex-col px-3 pt-5 pb-0 sm:px-5 sm:pt-7 overflow-hidden">
      <MasonryStyles />
      <div className="max-w-6xl w-full mx-auto flex flex-col flex-1 min-h-0">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#3a2a1c] flex items-center gap-2 w-full justify-center sm:w-auto sm:justify-start">
            <FaBox size={25} /> Baúl de Recuerdos
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#6b5a4e] text-[#f0ebe4] text-xs sm:text-sm font-semibold hover:bg-[#5a4a3e] transition disabled:opacity-50"
            >
              <RiUploadCloud2Line size={20} /> Agregar
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />

            <button
              onClick={() => {
                setSelectMode((s) => !s);
                setSelected(new Set());
                setShowActions(false);
              }}
              disabled={isDeleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition disabled:opacity-50 ${
                selectMode
                  ? "bg-[#6b5a4e] text-[#f0ebe4] border-[#4a3728]"
                  : "bg-[#d8cfc5] text-[#3a2a1c] border-[#b0a898] hover:bg-[#c8bfb5]"
              }`}
            >
              <RiCheckboxMultipleLine size={20} />
              {selectMode ? "Cancelar" : "Seleccionar"}
            </button>

            {selectMode && selected.size > 0 && (
              <div className="relative" ref={actionsRef}>
                <button
                  onClick={() => setShowActions((s) => !s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#d8cfc5] text-[#3a2a1c] text-xs sm:text-sm font-semibold border border-[#b0a898] hover:bg-[#c8bfb5] transition"
                >
                  Acciones ({selected.size}) ▾
                </button>
                {showActions && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[#ede5d8] border border-[#b0a898] rounded-2xl shadow-lg overflow-hidden z-50">
                    <button
                      onClick={handleDownloadSelected}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#3a2a1c] hover:bg-[#d8cfc5] transition"
                    >
                      <RiDownloadCloud2Line
                        size={15}
                        className="text-[#6b5a4e]"
                      />{" "}
                      Descargar ({selected.size})
                    </button>
                    <div className="h-px bg-[#c8b8a8]" />
                    <button
                      onClick={handleDeleteSelected}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition"
                    >
                      <RiDeleteBinLine size={15} /> Eliminar ({selected.size})
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center rounded-full bg-[#d8cfc5] border border-[#b0a898] overflow-hidden">
              {[
                { key: "compact", Icon: RiDashboardLine, title: "Compacta" },
                { key: "grid", Icon: RiLayoutGridLine, title: "Cuadrícula" },
                { key: "list", Icon: RiListCheck2, title: "Lista" },
              ].map(({ key, Icon, title }) => (
                <button
                  key={key}
                  title={title}
                  aria-label={title}
                  onClick={() => setView(key)}
                  className={`p-2 transition ${view === key ? "bg-[#6b5a4e] text-[#f0ebe4]" : "text-[#6b5a4e] hover:bg-[#c8bfb5]"}`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>

            {!selectMode && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu((s) => !s)}
                  aria-label="Más opciones"
                  className="p-2 rounded-full bg-[#d8cfc5] border border-[#b0a898] text-[#6b5a4e] hover:bg-[#c8bfb5] transition"
                >
                  <FiMoreVertical size={17} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-[#ede5d8] border border-[#b0a898] rounded-2xl shadow-lg overflow-hidden z-50 max-[407px]:left-0 max-[407px]:right-auto">
                    <button
                      disabled
                      title="Próximamente disponible"
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#3a2a1c] opacity-40 cursor-not-allowed"
                    >
                      <RiDownloadCloud2Line
                        size={15}
                        className="text-[#6b5a4e]"
                      />{" "}
                      Descargar Todo
                    </button>
                    <div className="h-px bg-[#c8b8a8]" />
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#3a2a1c] hover:bg-[#d8cfc5] transition"
                    >
                      <FiLogOut size={15} className="text-[#6b5a4e]" /> Inicio
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="mb-4 shrink-0 font-bold text-[#3a2a1c] text-sm sm:text-base">
          Tienes {items.length} archivos subidos
        </p>

        <FilterBar
          filter={filter}
          counts={counts}
          onSelect={handleFilterSelect}
        />

        {/* Barras de progreso */}
        <UploadProgress state={uploadState} />
        <DeleteProgress state={deleteState} />
        <DownloadProgress
          percentage={percentage}
          isInProgress={isInProgress}
          onCancel={cancel}
        />

        {/* ── Contenido scrollable ── */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-4 scrollbar-thin scrollbar-thumb-[#a09080] scrollbar-track-transparent hover:scrollbar-thumb-[#6b5a4e]">
          {filtered.length === 0 && (
            <p className="text-center text-[#6b5a4e] py-24 text-sm">
              El baúl está esperando nuestros recuerdos 📭
            </p>
          )}

          {filtered.length > 0 && view === "compact" && (
            <div className="baul-compact mt-2">
              {filtered.map((item, i) => (
                <MediaItem
                  key={item.id}
                  item={item}
                  index={i}
                  size="compact"
                  selectMode={selectMode}
                  isSel={selected.has(item.id)}
                  isDel={deleting.has(item.id)}
                  isDeleting={isDeleting}
                  onOpen={handleOpen}
                  onToggle={toggleSelect}
                />
              ))}
            </div>
          )}

          {filtered.length > 0 && view === "grid" && (
            <div className="baul-grid">
              {filtered.map((item, i) => (
                <MediaItem
                  key={item.id}
                  item={item}
                  index={i}
                  size="grid"
                  selectMode={selectMode}
                  isSel={selected.has(item.id)}
                  isDel={deleting.has(item.id)}
                  isDeleting={isDeleting}
                  onOpen={handleOpen}
                  onToggle={toggleSelect}
                />
              ))}
            </div>
          )}

          {filtered.length > 0 && view === "list" && (
            <div className="flex flex-col gap-2">
              {filtered.map((item, i) => (
                <MediaListItem
                  key={item.id}
                  item={item}
                  index={i}
                  selectMode={selectMode}
                  isSel={selected.has(item.id)}
                  isDel={deleting.has(item.id)}
                  isDeleting={isDeleting}
                  onOpen={handleOpen}
                  onToggle={toggleSelect}
                  onShare={handleShare}
                  onCopyLink={handleCopyLink}
                  onDownload={handleDownloadOne}
                  onDelete={handleDeleteOne}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox con toolbar cross-platform ── */}
      <Lightbox
        open={lightboxIdx >= 0}
        index={lightboxIdx}
        close={() => setLightboxIdx(-1)}
        slides={slides}
        plugins={[Video, Zoom, Download]}
        styles={{ container: { backgroundColor: "rgba(28,16,8,0.97)" } }}
        toolbar={{
          buttons: [
            <LightboxCopyBtn key="copy" />,
            <LightboxShareBtn key="share" />,
            "download",
            "close",
          ],
        }}
        download={{
          // Usa react-use-downloader — misma lógica que los botones de lista
          download: ({ slide }) => {
            const url = slide?.src ?? slide?.sources?.[0]?.src;
            const name = slide?.downloadName ?? "archivo";
            if (url) lbRef.current.download?.(url, name);
          },
        }}
      />
    </div>
  );
}

export default BaulRecuerdosPage;

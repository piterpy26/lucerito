import { useEffect, useMemo, useRef, useState } from "react";
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
  RiShareLine,
  RiUploadCloud2Line,
  RiVideoLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import Carga from "../components/Carga";
import {
  compressImage,
  deleteMedia,
  downloadAllAsZip,
  downloadSingle,
  fetchMedia,
  uploadMedia,
} from "../firebase/mediaService";

// ── Cache ─────────────────────────────────────────────────
const CACHE_KEY = "baul_media_cache";
const CACHE_TTL = 5 * 60_000;

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

const isImage = (type) => type?.startsWith("image");

// ── Detecta si es móvil ───────────────────────────────────
const isMobileDevice = () =>
  /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
  window.innerWidth < 640;

function BaulRecuerdosPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(new Set());
  const [lightboxIdx, setLightboxIdx] = useState(-1);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadDone, setUploadDone] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(new Set());
  const [deleteTotal, setDeleteTotal] = useState(0);
  const [deleteDone, setDeleteDone] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef(null);
  const actionsRef = useRef(null);
  const menuRef = useRef(null);

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
          ? { src: item.url, download: item.url }
          : {
              type: "video",
              sources: [{ src: item.url, type: "video/mp4" }],
              download: item.url,
            },
      ),
    [filtered],
  );

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // ── Detección de duplicados ────────────────────────────────────
    const existingNames = new Set(
      items.map((i) => i.name?.toLowerCase().trim()).filter(Boolean),
    );
    const duplicates = files.filter((f) =>
      existingNames.has(f.name.toLowerCase().trim()),
    );
    let filesToUpload = files;
    let baseItems = items;

    if (duplicates.length > 0) {
      const dupListHTML = duplicates
        .map(
          (f) =>
            `<li style="font-size:12px;padding:2px 0;text-align:left">⚠️ ${f.name}</li>`,
        )
        .join("");

      const result = await Swal.fire({
        ...swalBase,
        title: `${duplicates.length} duplicado${duplicates.length > 1 ? "s" : ""} detectado${duplicates.length > 1 ? "s" : ""}`,
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

      if (result.isDismissed) {
        e.target.value = "";
        return;
      }

      if (result.isConfirmed) {
        filesToUpload = files.filter(
          (f) => !existingNames.has(f.name.toLowerCase().trim()),
        );
        if (!filesToUpload.length) {
          await Swal.fire({
            ...swalBase,
            title: "Sin archivos nuevos",
            text: "Todos los archivos seleccionados ya existen en el baúl.",
            icon: "info",
            confirmButtonText: "Entendido",
          });
          e.target.value = "";
          return;
        }
      }
      if (result.isDenied) {
        // Quitar del estado local los reemplazados
        baseItems = items.filter(
          (item) =>
            !duplicates.some(
              (f) =>
                f.name.toLowerCase().trim() === item.name?.toLowerCase().trim(),
            ),
        );
        filesToUpload = files; // sube todos (únicos + reemplazos)
      }
    }

    const listaHTML = filesToUpload
      .map((f) => {
        const mb = (f.size / 1024 / 1024).toFixed(2);
        const tipo = f.type.startsWith("image/") ? "📷" : "🎬";
        return `<li style="display:flex;justify-content:space-between;gap:16px;font-size:12px;padding:3px 0;border-bottom:1px solid #c8b8a8">
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px">${tipo} ${f.name}</span>
        <span style="flex-shrink:0;font-weight:600">${mb} MB</span>
      </li>`;
      })
      .join("");

    const totalMB = (
      filesToUpload.reduce((a, f) => a + f.size, 0) /
      1024 /
      1024
    ).toFixed(2);

    const confirm = await Swal.fire({
      ...swalBase,
      title: `Subir ${filesToUpload.length} archivo${filesToUpload.length === 1 ? "" : "s"}`,
      html: `<ul style="text-align:left;max-height:180px;overflow-y:auto;padding:0 4px;list-style:none;margin:0">${listaHTML}</ul>
             <p style="margin-top:12px;font-size:14px;font-weight:700;color:#3a2a1c">Total: ${totalMB} MB</p>`,
      showCancelButton: true,
      confirmButtonText: "Subir",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) {
      e.target.value = "";
      return;
    }

    setUploading(true);
    setUploadTotal(filesToUpload.length);
    setUploadDone(0);
    setProgress(0);

    const newItems = [];
    let index = 0;

    for (const raw of filesToUpload) {
      index += 1;
      if (!isImage(raw.type) && raw.size > 200 * 1024 * 1024) {
        Swal.fire({
          ...swalBase,
          title: "Video muy grande",
          text: `"${raw.name}" supera los 200 MB`,
          icon: "warning",
          confirmButtonText: "Entendido",
        });
        setUploadTotal((t) => t - 1);
        continue;
      }
      const file = await compressImage(raw);
      await uploadMedia(file, (p) => {
        setProgress(
          Math.round(((index - 1 + p / 100) / filesToUpload.length) * 100),
        );
      }).then((result) => {
        newItems.push(result);
        setUploadDone((prev) => prev + 1);
      });
    }

    const updated = [...newItems, ...baseItems];
    writeCache(updated);
    setItems(updated);
    setUploading(false);
    setProgress(0);
    setUploadTotal(0);
    setUploadDone(0);
    e.target.value = "";
  };

  const toggleSelect = (id) => {
    if (!selectMode) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Eliminar con progress ─────────────────────────────
  const handleDeleteSelected = async () => {
    if (!selected.size) return;
    setShowActions(false);
    const res = await Swal.fire({
      ...swalBase,
      title: `¿Eliminar ${selected.size} archivo(s)?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;

    const toDelete = [...selected];
    setIsDeleting(true);
    setDeleteTotal(toDelete.length);
    setDeleteDone(0);
    setDeleting(new Set(toDelete)); // todos grises inmediatamente

    for (let idx = 0; idx < toDelete.length; idx++) {
      const id = toDelete[idx];
      const item = items.find((i) => i.id === id);
      if (item) await deleteMedia(id, item.path);
      setDeleteDone(idx + 1);
    }

    const updated = items.filter((i) => !selected.has(i.id));
    writeCache(updated);
    setItems(updated);
    setSelected(new Set());
    setSelectMode(false);
    setDeleting(new Set());
    setIsDeleting(false);
    setDeleteTotal(0);
    setDeleteDone(0);
  };

  // ── Descargar: individual en móvil, ZIP en desktop ────
  const handleDownloadSelected = async () => {
    if (!selected.size) return;
    setShowActions(false);
    const toDownload = items.filter((i) => selected.has(i.id));
    if (isMobileDevice()) {
      for (const item of toDownload) {
        await downloadSingle(item);
      }
    } else {
      downloadAllAsZip(toDownload);
    }
  };

  const handleShare = async (item) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: item.name, url: item.url });
      } else {
        await navigator.clipboard.writeText(item.url);
        Swal.fire({
          ...swalBase,
          title: "Enlace copiado",
          icon: "success",
          timer: 1800,
          showConfirmButton: false,
        });
      }
    } catch {}
  };

  const handleDownloadOne = (item) => downloadSingle(item);

  const handleDeleteOne = async (item) => {
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
  };

  if (loading) return <Carga />;

  // ── renderItem: grid + compact ────────────────────────
  const renderItem = (item, i, size = "grid") => {
    const isSel = selected.has(item.id);
    const isDel = deleting.has(item.id);
    const isCompact = size === "compact";

    return (
      <div
        key={item.id}
        className={`relative group break-inside-avoid transition-all duration-200
          ${isCompact ? "mb-1 rounded-md" : "mb-1.5 rounded-lg"}
          overflow-hidden cursor-pointer
          ${selectMode ? "scale-[0.94]" : "scale-100"}
          ${isSel ? "ring-2 ring-inset ring-[#6b5a4e]" : ""}
          ${isDel ? "pointer-events-none" : ""}
        `}
        onClick={() => {
          if (isDel || isDeleting) return;
          selectMode ? toggleSelect(item.id) : setLightboxIdx(i);
        }}
      >
        {/* Thumbnail */}
        {isImage(item.type) ? (
          <div className="relative">
            <img
              src={item.url}
              alt={item.name || ""}
              loading="lazy"
              className="w-full h-auto block object-cover"
            />
            <span
              className={`absolute bottom-1 left-1 bg-black/60 text-white rounded-full ${isCompact ? "text-[8px] px-1 py-0.5" : "text-[10px] px-1.5 py-0.5 backdrop-blur-sm"}`}
            >
              ▶ {isCompact ? "" : "Foto"}
            </span>
          </div>
        ) : (
          <div className="relative bg-black">
            <video
              src={item.url}
              className="w-full h-auto block"
              muted
              preload="metadata"
              playsInline
            />
            <span
              className={`absolute bottom-1 left-1 bg-black/60 text-white rounded-full ${isCompact ? "text-[8px] px-1 py-0.5" : "text-[10px] px-1.5 py-0.5 backdrop-blur-sm"}`}
            >
              ▶ {isCompact ? "" : "Video"}
            </span>
          </div>
        )}

        {/* Hover overlay normal */}
        {!isDel && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
        )}

        {/* Overlay gris + spinner mientras se elimina */}
        {isDel && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div
              className={`border-2 border-white border-t-transparent rounded-full animate-spin ${isCompact ? "w-3 h-3" : "w-5 h-5"}`}
            />
          </div>
        )}

        {/* Checkbox — solo en selectMode y no eliminando */}
        {selectMode && !isDel && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSelect(item.id);
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
  };

  return (
    <div className="h-screen bg-[#c8b8a8] flex flex-col px-3 pt-5 pb-0 sm:px-5 sm:pt-7 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col flex-1 min-h-0">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#3a2a1c] flex items-center gap-2 w-full justify-center sm:w-auto sm:justify-start">
            <FaBox size={25} />
            Baúl de Recuerdos
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#6b5a4e] text-[#f0ebe4] text-xs sm:text-sm font-semibold hover:bg-[#5a4a3e] transition disabled:opacity-50"
            >
              <RiUploadCloud2Line size={20} />
              Agregar
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
                      />
                      Descargar ({selected.size})
                    </button>
                    <div className="h-px bg-[#c8b8a8]" />
                    <button
                      onClick={handleDeleteSelected}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition"
                    >
                      <RiDeleteBinLine size={15} />
                      Eliminar ({selected.size})
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
                  className="p-2 rounded-full bg-[#d8cfc5] border border-[#b0a898] text-[#6b5a4e] hover:bg-[#c8bfb5] transition"
                >
                  <FiMoreVertical size={17} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-[#ede5d8] border border-[#b0a898] rounded-2xl shadow-lg overflow-hidden z-50 max-[407px]:left-0 max-[407px]:right-auto max-[407px]:origin-top-left">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        Swal.fire({
                          ...swalBase,
                          title: "Opción no disponible",
                          text: "Estamos trabajando en esta opción 🛠️",
                          icon: "info",
                          confirmButtonText: "Entendido",
                        });
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#3a2a1c] hover:bg-[#d8cfc5] transition"
                    >
                      <RiDownloadCloud2Line
                        size={15}
                        className="text-[#6b5a4e]"
                      />
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
                      <FiLogOut size={15} className="text-[#6b5a4e]" />
                      Inicio
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 mb-4 flex-wrap shrink-0 font-bold text-[#3a2a1c] sm:text-sm md:text-base">
          Tienes {items.length} archivos subidos
        </div>
        {/* ── Filtros ── */}
        <div className="flex gap-2 mb-4 flex-wrap shrink-0">
          {FILTERS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => {
                setFilter(key);
                setSelected(new Set());
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium border transition ${
                filter === key
                  ? "bg-[#6b5a4e] text-[#f0ebe4] border-[#4a3728]"
                  : "bg-[#d8cfc5] text-[#3a2a1c] border-[#b0a898] hover:bg-[#c8bfb5]"
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
              <span
                className={`text-[12px] font-semibold leading-none px-1 py-0.5 rounded-full ${filter === key ? "bg-white/20" : "bg-black/10"}`}
              >
                {key === "all"
                  ? items.length
                  : items.filter((i) =>
                      key === "image" ? isImage(i.type) : !isImage(i.type),
                    ).length}
              </span>
            </button>
          ))}
        </div>

        {/* ── Upload progress ── */}
        {uploading && (
          <div className="w-80 mx-auto mb-3 shrink-0">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[11px] font-bold text-[#3a2a1c]">
                Subiendo {uploadDone} de {uploadTotal} archivo
                {uploadTotal === 1 ? "" : "s"}...
              </p>
              <p className="text-[11px] text-[#6b5a4e] font-semibold">
                {progress}%
              </p>
            </div>
            <div className="w-full bg-[#d8cfc5] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#6b5a4e] h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Delete progress ── */}
        {isDeleting && (
          <div className="w-80 mx-auto mb-3 shrink-0">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[11px] font-bold text-red-700">
                Eliminando {deleteDone} de {deleteTotal} archivo
                {deleteTotal === 1 ? "" : "s"}...
              </p>
              <p className="text-[11px] text-red-500 font-semibold">
                {deleteTotal > 0
                  ? Math.round((deleteDone / deleteTotal) * 100)
                  : 0}
                %
              </p>
            </div>
            <div className="w-full bg-red-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-red-400 h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: `${deleteTotal > 0 ? Math.round((deleteDone / deleteTotal) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* ── Contenido scrollable ── */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-4 scrollbar-thin scrollbar-thumb-[#a09080] scrollbar-track-transparent hover:scrollbar-thumb-[#6b5a4e]">
          {filtered.length === 0 && (
            <p className="text-center text-[#6b5a4e] py-24 text-sm">
              El baúl está esperando nuestros recuerdos 📭
            </p>
          )}

          {/* COMPACTA */}
          {filtered.length > 0 && view === "compact" && (
            <>
              <style>{`
                .baul-compact { column-count: 4; column-gap: 4px; }
                @media (min-width: 480px)  { .baul-compact { column-count: 6; } }
                @media (min-width: 768px)  { .baul-compact { column-count: 8; } }
                @media (min-width: 1280px) { .baul-compact { column-count: 10; } }
              `}</style>
              <div className="baul-compact mt-2">
                {filtered.map((item, i) => renderItem(item, i, "compact"))}
              </div>
            </>
          )}

          {/* GRID */}
          {filtered.length > 0 && view === "grid" && (
            <>
              <style>{`
                .baul-grid { column-count: 3; column-gap: 6px; }
                @media (min-width: 480px)  { .baul-grid { column-count: 4; } }
                @media (min-width: 768px)  { .baul-grid { column-count: 5; } }
                @media (min-width: 1280px) { .baul-grid { column-count: 6; } }
              `}</style>
              <div className="baul-grid">
                {filtered.map((item, i) => renderItem(item, i, "grid"))}
              </div>
            </>
          )}

          {/* LISTA */}
          {filtered.length > 0 && view === "list" && (
            <div className="flex flex-col gap-2">
              {filtered.map((item, i) => {
                const isSel = selected.has(item.id);
                const isDel = deleting.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition
                        ${selectMode ? "scale-[0.98]" : "scale-100"}
                        ${isSel ? "bg-[#ddd5c8] border-[#6b5a4e]" : "bg-[#e8e0d8] border-[#b0a898] hover:bg-[#ddd5cb]"}
                        ${isDel ? "pointer-events-none" : "cursor-pointer"}
                      `}
                    onClick={() => {
                      if (isDel || isDeleting) return;
                      selectMode ? toggleSelect(item.id) : setLightboxIdx(i);
                    }}
                  >
                    {/* Overlay gris lista */}
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
                        if (!isDel) setLightboxIdx(i);
                      }}
                    >
                      {isImage(item.type) ? (
                        <img
                          src={item.url}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
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
                          title="Compartir"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(item);
                          }}
                          className="p-2 rounded-full text-[#6b5a4e] hover:bg-[#c8bfb5] transition"
                        >
                          <RiShareLine size={16} />
                        </button>
                        <button
                          title="Descargar"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadOne(item);
                          }}
                          className="p-2 rounded-full text-[#6b5a4e] hover:bg-[#c8bfb5] transition"
                        >
                          <RiDownloadLine size={16} />
                        </button>
                        <button
                          title="Eliminar"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOne(item);
                          }}
                          className="p-2 rounded-full text-red-400 hover:bg-red-100 transition"
                        >
                          <RiDeleteBinLine size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Lightbox
        open={lightboxIdx >= 0}
        index={lightboxIdx}
        close={() => setLightboxIdx(-1)}
        slides={slides}
        plugins={[Video, Zoom]}
        styles={{ container: { backgroundColor: "rgba(28,16,8,0.97)" } }}
      />
    </div>
  );
}

export default BaulRecuerdosPage;

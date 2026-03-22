// src/firebase/mediaService.js
import imageCompression from "browser-image-compression";
import { saveAs } from "file-saver";
import {
  addDoc, collection, deleteDoc,
  doc, getDocs, orderBy, query,
} from "firebase/firestore";
import {
  deleteObject, getDownloadURL,
  ref, uploadBytesResumable,
} from "firebase/storage";
import JSZip from "jszip";
import { db, storage } from "./config";

const COLLECTION = "baul-media";

const MIME_TO_EXT = {
  "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
  "image/gif": "gif",  "image/webp": "webp", "image/heic": "heic",
  "video/mp4": "mp4",  "video/quicktime": "mov", "video/webm": "webm",
  "video/x-msvideo": "avi",
};

function ensureExtension(name, mimeType) {
  if (!name || name === "undefined")
    return `archivo-${Date.now()}.${MIME_TO_EXT[mimeType] ?? "bin"}`;
  if (name.includes(".")) return name;
  const ext = MIME_TO_EXT[mimeType];
  return ext ? `${name}.${ext}` : name;
}

// ── Comprimir imagen ──────────────────────────────────────────────────────────
export async function compressImage(file) {
  if (!file.type?.startsWith("image/")) return file;
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    preserveExif: true,
  });
  return new File([compressed], file.name ?? `imagen-${Date.now()}`, { type: file.type });
}

// ── Subir archivo — devuelve { cancel } además de la promesa ─────────────────
export function uploadMedia(file, onProgress) {
  const safeName =
    typeof file?.name === "string" && file.name.trim().length > 0
      ? file.name
      : `${file.type?.startsWith("image/") ? "imagen" : "video"}-${Date.now()}`;

  const isImg     = file.type?.startsWith("image/");
  const folder    = isImg ? "images" : "videos";
  const storageRef = ref(storage, `baul/${folder}/${Date.now()}_${safeName}`);
  const task      = uploadBytesResumable(storageRef, file);

  const promise = new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        try {
          const url    = await getDownloadURL(task.snapshot.ref);
          const docRef = await addDoc(collection(db, COLLECTION), {
            name: safeName,
            type: isImg ? "image" : "video",
            url,
            path: task.snapshot.ref.fullPath,
            size: file.size ?? null,
            createdAt: Date.now(),
          });
          resolve({
            id: docRef.id, url,
            path: task.snapshot.ref.fullPath,
            type: isImg ? "image" : "video",
            name: safeName,
          });
        } catch (err) { reject(err); }
      },
    );
  });

  // Expone cancel para poder abortar desde la UI si el usuario cancela mid-upload
  promise.cancel = () => task.cancel();
  return promise;
}

// ── Leer archivos ─────────────────────────────────────────────────────────────
export async function fetchMedia() {
  const q    = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Eliminar — borra Firestore y Storage en paralelo ─────────────────────────
export async function deleteMedia(id, path) {
  await Promise.all([
    deleteDoc(doc(db, COLLECTION, id)),
    deleteObject(ref(storage, path)),
  ]);
}

// ── Fetch blob con timeout (evita colgarse en red lenta) ──────────────────────
async function fetchBlob(url, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.blob();
  } finally {
    clearTimeout(timer);
  }
}

// ── Compartir — verifica soporte antes de fetchear el blob ───────────────────
export async function shareMedia(item) {
  try {
    // 1. Sin Share API → copiar enlace directo, sin intentar nada más
    if (!navigator.share) {
      await navigator.clipboard.writeText(item.url);
      return { method: "clipboard" };
    }

    // 2. El navegador tiene share API — intentar compartir archivo real
    if (navigator.canShare) {
      try {
        const blob     = await fetchBlob(item.url);
        const safeName = ensureExtension(item.name, blob.type || item.type);
        const file     = new File([blob], safeName, { type: blob.type });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: safeName });
          return { method: "file" };
        }
      } catch (blobErr) {
        // Usuario canceló el share sheet
        if (blobErr?.name === "AbortError") return { method: "cancelled" };
        // Fallo al fetchear el blob → continuar con compartir URL
        if (import.meta.env.DEV) console.warn("shareMedia blob:", blobErr);
      }
    }

    // 3. Compartir solo la URL (share API disponible pero sin soporte de archivos)
    await navigator.share({ title: item.name, url: item.url });
    return { method: "url" };

  } catch (err) {
    if (err?.name === "AbortError") return { method: "cancelled" };

    // 4. Todo falló — último recurso: copiar enlace al portapapeles
    try {
      await navigator.clipboard.writeText(item.url);
      return { method: "clipboard" };
    } catch (clipErr) {
      if (import.meta.env.DEV) console.warn("shareMedia clipboard:", clipErr);
      throw clipErr; // Solo aquí se muestra el error al usuario
    }
  }
}

// ── Descarga individual ───────────────────────────────────────────────────────
export async function downloadSingle(item) {
  const blob     = await fetchBlob(item.url);
  const safeName = ensureExtension(item.name, blob.type || item.type);
  const blobUrl  = URL.createObjectURL(blob);
  const a        = document.createElement("a");
  a.href         = blobUrl;
  a.download     = safeName;
  a.click();
  // Libera memoria tras tiempo suficiente para que el navegador inicie la descarga
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
}

// ── Descargar seleccionados como ZIP ──────────────────────────────────────────
// Descarga en paralelo con límite de concurrencia para no saturar la red
export async function downloadAllAsZip(items, concurrency = 4) {
  const zip = new JSZip();

  // Procesa en lotes de `concurrency` para no abrir 50 fetches al mismo tiempo
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (item) => {
        const blob     = await fetchBlob(item.url);
        const safeName = ensureExtension(item.name, blob.type || item.type);
        zip.file(safeName, blob);
      }),
    );
  }

  const content = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  saveAs(content, "baul-recuerdos.zip");
}

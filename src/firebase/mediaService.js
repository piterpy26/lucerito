import imageCompression from "browser-image-compression";
import { saveAs } from "file-saver";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import JSZip from "jszip";
import { db, storage } from "./config";

const COLLECTION = "baul-media";

// ── MIME → extensión ──────────────────────────────────────
const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-msvideo": "avi",
};

function ensureExtension(name, mimeType) {
  if (!name || name === "undefined") {
    return `archivo-${Date.now()}.${MIME_TO_EXT[mimeType] ?? "bin"}`;
  }
  if (name.includes(".")) return name;
  const ext = MIME_TO_EXT[mimeType];
  return ext ? `${name}.${ext}` : name;
}

// ── Comprimir imagen ──────────────────────────────────────
export async function compressImage(file) {
  if (!file.type?.startsWith("image/")) return file;
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    preserveExif: true,
  });
  // Preservar name y type originales (imageCompression los puede perder)
  return new File([compressed], file.name ?? `imagen-${Date.now()}`, {
    type: file.type,
  });
}

// ── Subir archivo ─────────────────────────────────────────
export function uploadMedia(file, onProgress) {
  const originalName = file?.name;
  const safeName =
    typeof originalName === "string" && originalName.trim().length > 0
      ? originalName
      : `${file.type?.startsWith("image/") ? "imagen" : "video"}-${Date.now()}`;

  const isImg = file.type?.startsWith("image/");
  const folder = isImg ? "images" : "videos";
  const storageRef = ref(storage, `baul/${folder}/${Date.now()}_${safeName}`);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) =>
        onProgress?.(
          Math.round((snap.bytesTransferred / snap.totalBytes) * 100),
        ),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        const docRef = await addDoc(collection(db, COLLECTION), {
          name: safeName,
          type: isImg ? "image" : "video",
          url,
          path: task.snapshot.ref.fullPath,
          size: file.size ?? null,
          createdAt: Date.now(),
        });
        resolve({
          id: docRef.id,
          url,
          path: task.snapshot.ref.fullPath,
          type: isImg ? "image" : "video",
          name: safeName,
        });
      },
    );
  });
}

// ── Leer archivos ─────────────────────────────────────────
export async function fetchMedia() {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Eliminar ──────────────────────────────────────────────
export async function deleteMedia(id, path) {
  await deleteDoc(doc(db, COLLECTION, id));
  await deleteObject(ref(storage, path));
}

// ── Descargar todo / seleccionados como ZIP ───────────────
export async function downloadAllAsZip(items) {
  const zip = new JSZip();
  await Promise.all(
    items.map(async (item) => {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const safeName = ensureExtension(item.name, blob.type || item.type);
      zip.file(safeName, blob);
    }),
  );
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "baul-recuerdos.zip");
}

// ── Descarga individual como blob ─────────────────────────
export async function downloadSingle(item) {
  const res = await fetch(item.url);
  const blob = await res.blob();
  const safeName = ensureExtension(item.name, blob.type || item.type);
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = safeName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
}

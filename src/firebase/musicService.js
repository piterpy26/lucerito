import lamejs from "@breezystack/lamejs";

import {
  addDoc, collection, deleteDoc,
  doc, getDocs, orderBy, query, updateDoc,
} from "firebase/firestore";
import {
  deleteObject, getDownloadURL,
  ref, uploadBytesResumable,
} from "firebase/storage";
import { db, storage } from "./config";

const COLLECTION = "reproductor-canciones";

export async function fetchSongs() {
  const q    = query(collection(db, COLLECTION), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function uploadFile(file, path, onProgress) {
  const task = uploadBytesResumable(ref(storage, path), file);
  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (s) => onProgress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path: task.snapshot.ref.fullPath });
      },
    );
  });
}

export async function uploadSong({ audioFile, coverFile, title, artist }, onProgress) {
  const ts = Date.now();

  // Comprimir primero — ocupa el 0–40% del progreso total
  const compressed = await compressAudio(
    audioFile,
    (p) => onProgress?.(Math.round(p * 0.4)),
  );

  const audio = await uploadFile(
    compressed,
    `musica/${ts}_${compressed.name}`,
    (p) => onProgress?.(40 + Math.round(p * (coverFile ? 0.42 : 0.6))),
  );

  let cover = null;
  if (coverFile) {
    cover = await uploadFile(
      coverFile,
      `musica/covers/${ts}_${coverFile.name}`,
      (p) => onProgress?.(82 + Math.round(p * 0.18)),
    );
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    title, artist,
    src: audio.url, audioPath: audio.path,
    cover: cover?.url ?? null, coverPath: cover?.path ?? null,
    createdAt: ts,
  });

  return { id: docRef.id, title, artist, src: audio.url, audioPath: audio.path, cover: cover?.url ?? null, coverPath: cover?.path ?? null };
}


export async function deleteSong(id, audioPath, coverPath) {
  const ops = [
    deleteDoc(doc(db, COLLECTION, id)),
    deleteObject(ref(storage, audioPath)),
  ];
  if (coverPath) ops.push(deleteObject(ref(storage, coverPath)));
  await Promise.all(ops);
}

// ── Comprimir audio a MP3 128kbps (solo si pesa más de 5 MB) ─────────────────
export async function compressAudio(file, onProgress) {
  if (file.size < 5 * 1024 * 1024) return file; // ya es ligero

  const arrayBuffer = await file.arrayBuffer();
  const audioCtx    = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  const channels   = Math.min(audioBuffer.numberOfChannels, 2);
  const sampleRate = audioBuffer.sampleRate;
  const encoder    = new lamejs.Mp3Encoder(channels, sampleRate, 128);
  const mp3Data    = [];
  const blockSize  = 1152;

  const toInt16 = (f32) => {
    const i16 = new Int16Array(f32.length);
    for (let i = 0; i < f32.length; i++)
      i16[i] = Math.max(-32768, Math.min(32767, Math.round(f32[i] * 32767)));
    return i16;
  };

  const leftI16  = toInt16(audioBuffer.getChannelData(0));
  const rightI16 = channels > 1 ? toInt16(audioBuffer.getChannelData(1)) : leftI16;
  const total    = leftI16.length;

  for (let i = 0; i < total; i += blockSize) {
    const L   = leftI16.subarray(i, i + blockSize);
    const R   = rightI16.subarray(i, i + blockSize);
    const buf = channels > 1 ? encoder.encodeBuffer(L, R) : encoder.encodeBuffer(L);
    if (buf.length > 0) mp3Data.push(buf);
    onProgress?.(Math.round(((i + blockSize) / total) * 100));
  }

  const end = encoder.flush();
  if (end.length > 0) mp3Data.push(end);

  const blob    = new Blob(mp3Data, { type: "audio/mp3" });
  const newName = file.name.replace(/\.[^.]+$/, ".mp3");
  return new File([blob], newName, { type: "audio/mp3" });
}

// ── Editar título, artista y/o portada (nunca el audio) ──────────────────────
export async function updateSong(song, { title, artist, coverFile }, onProgress) {
  const updates = { title, artist };

  if (coverFile) {
    // Sube la nueva portada
    const ts       = Date.now();
    const newCover = await uploadFile(
      coverFile,
      `musica/covers/${ts}_${coverFile.name}`,
      onProgress,
    );
    updates.cover     = newCover.url;
    updates.coverPath = newCover.path;

    // Borra la portada anterior si existía
    if (song.coverPath) {
      try { await deleteObject(ref(storage, song.coverPath)); } catch {}
    }
  }

  await updateDoc(doc(db, COLLECTION, song.id), updates);
  return { ...song, ...updates };
}

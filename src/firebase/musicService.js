import {
  addDoc, collection, deleteDoc,
  doc, getDocs, orderBy, query,
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
  const ts    = Date.now();
  const audio = await uploadFile(
    audioFile,
    `musica/${ts}_${audioFile.name}`,
    (p) => onProgress?.(Math.round(p * (coverFile ? 0.7 : 1))),
  );

  let cover = null;
  if (coverFile) {
    cover = await uploadFile(
      coverFile,
      `musica/covers/${ts}_${coverFile.name}`,
      (p) => onProgress?.(70 + Math.round(p * 0.3)),
    );
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    title, artist,
    src:       audio.url,
    audioPath: audio.path,
    cover:     cover?.url   ?? null,
    coverPath: cover?.path  ?? null,
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
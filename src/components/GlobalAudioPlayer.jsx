import { useEffect, useRef } from "react";
import { useMusicStore } from "../store/useMusicStore";

export const GlobalAudioPlayer = () => {
  const audioRef = useRef(null);
  const { songs, currentIdx, playing, volume, setPlaying, next } = useMusicStore();
  
  const song = currentIdx !== null ? songs[currentIdx] : null;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    
    // Sincronizar volumen
    a.volume = volume;
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !song) return;

    // Cargar y reproducir cuando cambie la canción
    a.load();
    if (playing) {
      a.play().catch(() => setPlaying(false));
    }
  }, [song, setPlaying]); // Solo reacciona al cambio de canción

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    if (playing) {
      a.play().catch(() => setPlaying(false));
    } else {
      a.pause();
    }
  }, [playing, setPlaying]);

  if (!song) return null;

  return (
    <audio
      ref={audioRef}
      src={song.src}
      onEnded={next}
      // Podríamos añadir onTimeUpdate aquí si queremos persistir el progreso exacto,
      // pero por ahora lo dejamos simple para evitar demasiados re-renders globales.
    />
  );
};

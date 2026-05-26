import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchSongs } from "../firebase/musicService";

const CACHE_TTL = 5 * 60_000;

export const useMusicStore = create(
  persist(
    (set, get) => ({
      songs: [],
      currentIdx: null,
      playing: false,
      volume: 0.8,
      favorites: [],
      lastFetch: 0,
      loading: false,

      // Acciones
      setSongs: (songs) => set({ songs, lastFetch: Date.now() }),
      
      initSongs: async () => {
        const { lastFetch, loading } = get();
        if (loading) return;
        if (Date.now() - lastFetch < CACHE_TTL) return;

        set({ loading: true });
        try {
          const data = await fetchSongs();
          set({ songs: data, lastFetch: Date.now() });
        } catch (err) {
          console.error("Error fetching songs:", err);
        } finally {
          set({ loading: false });
        }
      },

      play: (idx) => set({ currentIdx: idx, playing: true }),
      togglePlay: () => {
        const { currentIdx, songs, playing } = get();
        if (currentIdx === null && songs.length > 0) {
          set({ currentIdx: 0, playing: true });
        } else {
          set({ playing: !playing });
        }
      },
      
      next: () => {
        const { currentIdx, songs } = get();
        if (songs.length === 0) return;
        const nextIdx = currentIdx !== null ? (currentIdx + 1) % songs.length : 0;
        set({ currentIdx: nextIdx, playing: true });
      },

      prev: () => {
        const { currentIdx, songs } = get();
        if (songs.length === 0) return;
        const prevIdx = currentIdx !== null ? (currentIdx - 1 + songs.length) % songs.length : 0;
        set({ currentIdx: prevIdx, playing: true });
      },

      setVolume: (volume) => set({ volume }),
      
      toggleFav: (id) => {
        const { favorites } = get();
        const nextFavs = favorites.includes(id) 
          ? favorites.filter(x => x !== id) 
          : [...favorites, id];
        set({ favorites: nextFavs });
      },

      setPlaying: (playing) => set({ playing }),
      setCurrentIdx: (currentIdx) => set({ currentIdx }),
    }),
    {
      name: "lucerito-music-storage",
      partialize: (state) => ({ 
        favorites: state.favorites, 
        volume: state.volume,
        currentIdx: state.currentIdx
      }),
    }
  )
);

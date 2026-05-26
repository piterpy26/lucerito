import { useCallback } from "react";

/**
 * Hook para disparar vibraciones sutiles en dispositivos móviles.
 */
export const useHaptics = () => {
  const vibrate = useCallback((pattern = 10) => {
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }, []);

  return {
    light:   () => vibrate(8),
    medium:  () => vibrate(15),
    heavy:   () => vibrate(25),
    success: () => vibrate([10, 30, 10]),
    error:   () => vibrate([50, 50, 50]),
  };
};

// También exportamos una versión estática para usar fuera de componentes
export const triggerHaptic = (pattern = 10) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
};

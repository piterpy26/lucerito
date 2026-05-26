import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * OptimizedImage - Componente para carga de imágenes con efecto blur y fade-in.
 * Mejora la UX al evitar saltos visuales y espacios en blanco.
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  className = "", 
  containerClassName = "",
  priority = false, // true para imágenes críticas (LCP)
  objectFit = "cover"
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Si la imagen ya está en caché, marcamos como cargada inmediatamente
    const img = new Image();
    img.src = src;
    if (img.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${containerClassName} ${className}`}>
      {/* Placeholder con Blur (mientras carga) */}
      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-[#d8cfc5] animate-pulse flex items-center justify-center"
          >
            {/* Opcional: Un pequeño icono o logo difuminado */}
            <div className="w-10 h-10 bg-[#6b5a4e]/10 rounded-full blur-xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Imagen Real */}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`
          w-full h-full transition-all duration-700 ease-out
          ${objectFit === "cover" ? "object-cover" : "object-contain"}
          ${isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[1.02] blur-lg"}
        `}
      />

      {/* Fallback en caso de error */}
      {error && (
        <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400 text-xs">
          ⚠️ Error al cargar
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;

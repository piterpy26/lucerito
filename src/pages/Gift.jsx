import { motion } from "framer-motion";

const Gift = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: "#1a1410" }}>
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        className="flex flex-col items-center"
      >
        <GiftBox />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-5 text-lg font-semibold tracking-wide"
          style={{ color: "#e8dfd5" }}
        >
          ¡Para ti! 🎁
        </motion.p>
      </motion.div>
    </div>
  );
};

function GiftBox() {
  const size = "min(55vw, 55vh)";

  return (
    <motion.svg
      viewBox="0 0 200 200"
      style={{ width: size, height: size }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Sombra */}
      <motion.ellipse
        cx="100" cy="196" rx="50" ry="5"
        fill="rgba(0,0,0,0.25)"
        animate={{ scaleX: [1, 0.85, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Tapa — cuerpo */}
      <motion.rect
        x="25" y="72" width="150" height="22" rx="5"
        fill="#c0392b"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Tapa — brillo */}
      <motion.rect
        x="30" y="75" width="140" height="7" rx="3"
        fill="rgba(255,255,255,0.15)"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Cinta vertical en tapa */}
      <motion.rect
        x="90" y="72" width="20" height="22"
        fill="#f1c40f"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Lazo izquierdo */}
      <motion.path
        d="M100 72 Q72 48 80 38 Q88 28 100 52"
        fill="#f1c40f"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Lazo derecho */}
      <motion.path
        d="M100 72 Q128 48 120 38 Q112 28 100 52"
        fill="#e6b800"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Nudo del lazo */}
      <motion.circle
        cx="100" cy="62" r="8"
        fill="#f1c40f"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Caja — cuerpo */}
      <rect x="25" y="94" width="150" height="90" rx="6" fill="#e74c3c" />

      {/* Caja — brillo lateral */}
      <rect x="30" y="98" width="140" height="12" rx="3" fill="rgba(255,255,255,0.10)" />

      {/* Cinta vertical en caja */}
      <rect x="90" y="94" width="20" height="90" fill="#f1c40f" />

      {/* Cinta horizontal en caja */}
      <rect x="25" y="130" width="150" height="18" fill="#f1c40f" />

      {/* Estrellitas decorativas */}
      {[
        { cx: 55,  cy: 115 },
        { cx: 148, cy: 118 },
        { cx: 60,  cy: 158 },
        { cx: 143, cy: 162 },
      ].map((pos, i) => (
        <motion.circle key={i}
          cx={pos.cx} cy={pos.cy} r="3"
          fill="rgba(255,255,255,0.35)"
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          style={{ transformOrigin: `${pos.cx}px ${pos.cy}px` }}
        />
      ))}

      {/* Destellos flotantes */}
      {[
        { x: 18,  y: 90,  delay: 0   },
        { x: 170, y: 80,  delay: 0.5 },
        { x: 30,  y: 170, delay: 1   },
        { x: 162, y: 165, delay: 1.5 },
      ].map((s, i) => (
        <motion.text key={i}
          x={s.x} y={s.y}
          fontSize="13"
          textAnchor="middle"
          animate={{ opacity: [0, 1, 0], y: [s.y, s.y - 14, s.y - 14] }}
          transition={{ duration: 2, repeat: Infinity, delay: s.delay, ease: "easeOut" }}
        >
          ✨
        </motion.text>
      ))}
    </motion.svg>
  );
}

export default Gift;

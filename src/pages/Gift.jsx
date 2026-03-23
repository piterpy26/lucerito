import { motion } from "framer-motion";

const BALLOONS = [
  { x: "20%", color: "#e74c3c", delay: 0,    size: "clamp(50px,12vw,80px)"  },
  { x: "50%", color: "#f1c40f", delay: 0.3,  size: "clamp(60px,15vw,100px)" },
  { x: "78%", color: "#9b59b6", delay: 0.15, size: "clamp(50px,12vw,80px)"  },
  { x: "35%", color: "#e67e22", delay: 0.5,  size: "clamp(40px,10vw,65px)"  },
  { x: "65%", color: "#2ecc71", delay: 0.7,  size: "clamp(45px,11vw,72px)"  },
];

const CONFETTI = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  delay: Math.random() * 4,
  duration: 3.5 + Math.random() * 3,
  color: ["#e74c3c","#f1c40f","#9b59b6","#2ecc71","#e67e22","#3498db","#e91e8c"][i % 7],
  size: 6 + Math.random() * 8,
  rotate: Math.random() * 360,
  shape: i % 3 === 0 ? "circle" : i % 3 === 1 ? "rect" : "line",
}));

const Confetti = ({ x, delay, duration, color, size, rotate, shape }) => (
  <motion.div
    className="absolute z-30 pointer-events-none"
    style={{ left: x, top: "-5%", originX: "50%", originY: "50%" }}
    initial={{ y: 0, opacity: 1, rotate }}
    animate={{
      y: "110vh",
      opacity: [1, 1, 0],
      rotate: rotate + 360 * (Math.random() > 0.5 ? 1 : -1),
      x: [0, 30 * (Math.random() > 0.5 ? 1 : -1), -20, 10, 0],
    }}
    transition={{ duration, delay, repeat: Infinity, ease: "linear", repeatDelay: Math.random() * 2 }}
  >
    {shape === "circle" && (
      <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color }} />
    )}
    {shape === "rect" && (
      <div style={{ width: size, height: size * 0.5, backgroundColor: color, borderRadius: 2 }} />
    )}
    {shape === "line" && (
      <div style={{ width: 2, height: size * 1.6, backgroundColor: color, borderRadius: 2 }} />
    )}
  </motion.div>
);

const Balloon = ({ x, color, delay, size }) => (
  <motion.div
    className="absolute flex flex-col items-center z-20"
    style={{ left: x, bottom: "-10%" }}
    initial={{ y: 0 }}
    animate={{ y: "-110vh" }}
    transition={{ duration: 6, delay, repeat: Infinity, ease: "linear", repeatDelay: Math.random() * 1 }}
  >
    <motion.div
      style={{ width: size, height: size, backgroundColor: color, borderRadius: "50% 50% 50% 50% / 55% 55% 45% 45%" }}
      animate={{ rotate: [-6, 6, -6] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay }}
    />
    <div style={{ width: 6, height: 6, backgroundColor: color, clipPath: "polygon(50% 0%,0% 100%,100% 100%)", marginTop: -1 }} />
    <motion.div
      style={{ width: 1.5, height: "clamp(40px,10vw,70px)", background: `${color}80` }}
      animate={{ scaleX: [1, 1.5, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay }}
    />
  </motion.div>
);

const Gift = () => (
  <div className="fixed inset-0 overflow-hidden flex items-center justify-center"
    style={{ backgroundColor: "#1a1410" }}>
    <motion.span
      className="relative z-50 select-none"
      style={{ fontSize: "clamp(7rem, 40vw, 18rem)", lineHeight: 1 }}
      animate={{ rotate: [-5, 5, -5], scale: [1, 1.08, 1] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
    >
      🎂
    </motion.span>

    {/* Globos — z-20 */}
    {BALLOONS.map((b, i) => <Balloon key={i} {...b} />)}

    {/* Confeti — z-30, encima de todo */}
    {CONFETTI.map((c) => <Confetti key={c.id} {...c} />)}
  </div>
);

export default Gift;
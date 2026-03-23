import { motion } from "framer-motion";

const BALLOONS = [
  { x: "20%", color: "#e74c3c", delay: 0,    size: "clamp(50px,12vw,80px)"  },
  { x: "50%", color: "#f1c40f", delay: 0.3,  size: "clamp(60px,15vw,100px)" },
  { x: "78%", color: "#9b59b6", delay: 0.15, size: "clamp(50px,12vw,80px)"  },
  { x: "35%", color: "#e67e22", delay: 0.5,  size: "clamp(40px,10vw,65px)"  },
  { x: "65%", color: "#2ecc71", delay: 0.7,  size: "clamp(45px,11vw,72px)"  },
];

const Balloon = ({ x, color, delay, size }) => (
  <motion.div
    className="absolute flex flex-col items-center z-20"
    style={{ left: x, bottom: "-10%" }}
    initial={{ y: 0 }}
    animate={{ y: "-110vh" }}
    transition={{ duration: 6, delay, repeat: Infinity, ease: "linear", repeatDelay: Math.random() * 2 }}
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

    {BALLOONS.map((b, i) => <Balloon key={i} {...b} />)}

    <motion.span
      className="relative z-0 select-none"
      style={{ fontSize: "clamp(7rem, 40vw, 18rem)", lineHeight: 1 }}
      animate={{ rotate: [-5, 5, -5], scale: [1, 1.08, 1] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
    >
      🎂
    </motion.span>
  </div>
);

export default Gift;

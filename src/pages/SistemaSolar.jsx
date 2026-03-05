// SistemaSolar.jsx — OPTIMIZADO MOBILE + UX FINAL ✅
import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

// ─────────────────────────────────────────────
// DATA (fuera del componente → no recrea en renders)
// ─────────────────────────────────────────────
const PLANETS_DATA = [
  {
    key: "mercurio",
    label: "Mercurio",
    emoji: "☿",
    radius: 0.2,
    distance: 4.5,
    speed: 0.09,
    color: "#b5b5b5",
    tilt: 0,
    moons: [],
    info: {
      diametro: "4,879 km",
      distSol: "57.9M km",
      periodo: "88 días",
      satelites: 0,
      temp: "-173°C / 427°C",
      dato: "Viaja a 47 km/s, el más rápido del Sistema Solar.",
    },
  },
  {
    key: "venus",
    label: "Venus",
    emoji: "♀",
    radius: 0.32,
    distance: 6.0,
    speed: 0.055,
    color: "#e8c87a",
    tilt: 0.05,
    moons: [],
    info: {
      diametro: "12,104 km",
      distSol: "108M km",
      periodo: "225 días",
      satelites: 0,
      temp: "462°C",
      dato: "Gira al revés. Un día dura más que su año orbital.",
    },
  },
  {
    key: "tierra",
    label: "Tierra",
    emoji: "🌍",
    radius: 0.35,
    distance: 7.8,
    speed: 0.038,
    color: "#3d7ebf",
    tilt: 0.41,
    moons: [{ r: 0.09, dist: 0.65, speed: 0.18, color: "#ccc", label: "Luna" }],
    info: {
      diametro: "12,742 km",
      distSol: "149.6M km",
      periodo: "365 días",
      satelites: 1,
      temp: "-88°C / 58°C",
      dato: "Único planeta conocido con vida. 71% de su superficie es agua.",
    },
  },
  {
    key: "marte",
    label: "Marte",
    emoji: "♂",
    radius: 0.25,
    distance: 10.0,
    speed: 0.028,
    color: "#c1440e",
    tilt: 0.44,
    moons: [
      { r: 0.05, dist: 0.48, speed: 0.22, color: "#aaa", label: "Fobos" },
      { r: 0.04, dist: 0.7, speed: 0.14, color: "#999", label: "Deimos" },
    ],
    info: {
      diametro: "6,779 km",
      distSol: "227.9M km",
      periodo: "687 días",
      satelites: 2,
      temp: "-125°C / 20°C",
      dato: "Olympus Mons: volcán más alto conocido, 22 km de altura.",
    },
  },
  {
    key: "jupiter",
    label: "Júpiter",
    emoji: "♃",
    radius: 1.1,
    distance: 16.5,
    speed: 0.013,
    color: "#c8a87a",
    tilt: 0.05,
    moons: [
      { r: 0.1, dist: 1.45, speed: 0.14, color: "#ddd", label: "Ío" },
      { r: 0.12, dist: 1.85, speed: 0.1, color: "#ccc", label: "Europa" },
      { r: 0.09, dist: 2.25, speed: 0.07, color: "#bbb", label: "Ganimedes" },
      { r: 0.11, dist: 2.7, speed: 0.05, color: "#aaa", label: "Calisto" },
    ],
    info: {
      diametro: "139,820 km",
      distSol: "778.5M km",
      periodo: "11.9 años",
      satelites: 95,
      temp: "-110°C",
      dato: "La Gran Mancha Roja es una tormenta activa hace más de 350 años.",
    },
  },
  {
    key: "saturno",
    label: "Saturno",
    emoji: "♄",
    radius: 0.9,
    distance: 21.5,
    speed: 0.0085,
    color: "#e8d98b",
    tilt: 0.47,
    ring: true,
    moons: [],
    info: {
      diametro: "116,460 km",
      distSol: "1,432M km",
      periodo: "29.5 años",
      satelites: 146,
      temp: "-178°C",
      dato: "Sus anillos miden 270,000 km de diámetro pero solo ~1 km de grosor.",
    },
  },
  {
    key: "urano",
    label: "Urano",
    emoji: "⛢",
    radius: 0.55,
    distance: 27.0,
    speed: 0.006,
    color: "#93c8e8",
    tilt: 1.71,
    moons: [
      { r: 0.07, dist: 0.9, speed: 0.13, color: "#cce", label: "Ariel" },
      { r: 0.06, dist: 1.2, speed: 0.09, color: "#aac", label: "Umbriel" },
    ],
    info: {
      diametro: "50,724 km",
      distSol: "2,867M km",
      periodo: "84 años",
      satelites: 28,
      temp: "-224°C",
      dato: "Inclinación axial de 97.77°: orbita completamente de lado.",
    },
  },
  {
    key: "neptuno",
    label: "Neptuno",
    emoji: "♆",
    radius: 0.55,
    distance: 32.5,
    speed: 0.004,
    color: "#4b6fcf",
    tilt: 0.49,
    moons: [
      { r: 0.08, dist: 0.9, speed: 0.1, color: "#b0bfd8", label: "Tritón" },
    ],
    info: {
      diametro: "49,244 km",
      distSol: "4,495M km",
      periodo: "165 años",
      satelites: 16,
      temp: "-218°C",
      dato: "Vientos de hasta 2,100 km/h: los más rápidos del Sistema Solar.",
    },
  },
];

// ─────────────────────────────────────────────
// SOL — memo para evitar re-renders
// ─────────────────────────────────────────────
const Sun = memo(({ onSelect }) => {
  const sunRef = useRef(),
    c1 = useRef(),
    c2 = useRef(),
    c3 = useRef(),
    pts = useRef();

  const particlePositions = useMemo(() => {
    const arr = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const r = 2.5 + Math.random() * 1.5;
      arr[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      arr[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      arr[i * 3 + 2] = r * Math.cos(theta);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (sunRef.current) sunRef.current.rotation.y += 0.003;
    if (c1.current) {
      c1.current.scale.setScalar(1 + Math.sin(t * 2.0) * 0.07);
      c1.current.material.opacity = 0.35 + Math.sin(t * 1.4) * 0.15;
    }
    if (c2.current) {
      c2.current.scale.setScalar(1 + Math.sin(t * 1.5 + 1) * 0.1);
      c2.current.material.opacity = 0.22 + Math.sin(t * 2.1) * 0.1;
    }
    if (c3.current) {
      c3.current.scale.setScalar(1 + Math.sin(t * 1.0 + 2) * 0.13);
      c3.current.material.opacity = 0.1 + Math.sin(t * 0.8) * 0.06;
    }
    if (pts.current) {
      pts.current.rotation.y += 0.005;
      pts.current.rotation.z += 0.002;
    }
  });

  return (
    <group>
      <mesh
        ref={sunRef}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect({ key: "sol", label: "Sol", emoji: "☀️" });
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>
      <mesh ref={c1}>
        <sphereGeometry args={[2.6, 32, 32]} />
        <meshBasicMaterial
          color="#ff7700"
          transparent
          opacity={0.35}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh ref={c2}>
        <sphereGeometry args={[3.15, 32, 32]} />
        <meshBasicMaterial
          color="#ff3300"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh ref={c3}>
        <sphereGeometry args={[3.9, 32, 32]} />
        <meshBasicMaterial
          color="#ff1100"
          transparent
          opacity={0.09}
          side={THREE.BackSide}
        />
      </mesh>
      <points ref={pts}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={400}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ff6600"
          size={0.13}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
      <pointLight intensity={3.5} distance={90} decay={0.4} />
    </group>
  );
});

// ─────────────────────────────────────────────
// ÓRBITA RING — memo estable
// ─────────────────────────────────────────────
const OrbitRing = memo(({ distance, highlight }) => {
  const geo = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(Math.cos(a) * distance, 0, Math.sin(a) * distance),
      );
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [distance]);

  return (
    <line geometry={geo}>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={highlight ? 0.35 : 0.07}
      />
    </line>
  );
});

// ─────────────────────────────────────────────
// ASTEROIDES — memo, no recrea nunca
// ─────────────────────────────────────────────
const AsteroidBelt = memo(() => {
  const ref = useRef();
  const data = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => {
        const a = (i / 120) * Math.PI * 2;
        const r = 12.8 + (Math.random() - 0.5) * 2;
        return {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          y: (Math.random() - 0.5) * 0.7,
          s: Math.random() * 0.1 + 0.04,
        };
      }),
    [],
  );
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.004;
  });
  return (
    <group ref={ref}>
      {data.map((a, i) => (
        <mesh key={i} position={[a.x, a.y, a.z]}>
          <sphereGeometry args={[a.s, 5, 5]} />
          <meshLambertMaterial color="#686868" />
        </mesh>
      ))}
    </group>
  );
});

// ─────────────────────────────────────────────
// COMETA — memo
// ─────────────────────────────────────────────
const Comet = memo(() => {
  const ref = useRef(),
    a = useRef(0);
  useFrame((_, d) => {
    a.current += d * 0.0025;
    if (ref.current)
      ref.current.position.set(
        Math.cos(a.current) * 42,
        Math.sin(a.current * 2.4) * 10,
        Math.sin(a.current) * 42,
      );
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshBasicMaterial color="#ddf0ff" />
      </mesh>
      <mesh position={[-0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.14, 1.8, 8]} />
        <meshBasicMaterial color="#88bbff" transparent opacity={0.35} />
      </mesh>
    </group>
  );
});

// ─────────────────────────────────────────────
// PLANETA — memo por key
// ─────────────────────────────────────────────
const Planet = memo(
  ({ data, speedMultiplier, onSelect, isSelected, initialAngle = 0 }) => {
    const { radius, distance, speed, color, ring, tilt, moons } = data;
    const groupRef = useRef();
    const meshRef = useRef();
    const angle = useRef(initialAngle);
    const moonAngles = useRef(moons.map((_, i) => (i * Math.PI) / 2));
    const moonsRef = useRef([]);

    useFrame((_, delta) => {
      angle.current += delta * speed * speedMultiplier;
      if (groupRef.current) {
        groupRef.current.position.x = Math.cos(angle.current) * distance;
        groupRef.current.position.z = Math.sin(angle.current) * distance;
      }
      if (meshRef.current) {
        meshRef.current.rotation.y += delta * 0.4;
      }
      moons.forEach((moon, i) => {
        moonAngles.current[i] += delta * moon.speed;
        const m = moonsRef.current[i];
        if (m) {
          m.position.x = Math.cos(moonAngles.current[i]) * moon.dist;
          m.position.z = Math.sin(moonAngles.current[i]) * moon.dist;
        }
      });
    });

    return (
      <group ref={groupRef} rotation={[tilt ?? 0, 0, 0]}>
        <mesh
          ref={meshRef}
          onPointerDown={(e) => {
            e.stopPropagation();
            onSelect(data);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <sphereGeometry args={[radius, 22, 22]} />
          <meshLambertMaterial color={color} />
        </mesh>

        {isSelected && (
          <mesh>
            <sphereGeometry args={[radius * 1.55, 22, 22]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.1}
              side={THREE.BackSide}
              wireframe
            />
          </mesh>
        )}

        {ring && (
          <>
            <mesh rotation={[Math.PI / 2.2, 0, 0]}>
              <torusGeometry args={[radius * 1.62, 0.1, 4, 48]} />
              <meshLambertMaterial
                color="#c8a84b"
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2.2, 0, 0]}>
              <torusGeometry args={[radius * 1.98, 0.07, 4, 48]} />
              <meshLambertMaterial
                color="#e0d090"
                transparent
                opacity={0.45}
                side={THREE.DoubleSide}
              />
            </mesh>
          </>
        )}

        {moons.map((moon, i) => (
          <mesh
            key={i}
            ref={(el) => (moonsRef.current[i] = el)}
            position={[moon.dist, 0, 0]}
          >
            <sphereGeometry args={[moon.r, 10, 10]} />
            <meshLambertMaterial color={moon.color} />
          </mesh>
        ))}
      </group>
    );
  },
);

// ─────────────────────────────────────────────
// INFO CARDS — componente puro sin lógica 3D
// ─────────────────────────────────────────────
const InfoCards = memo(({ data }) => {
  if (!data || data.key === "sol") return null;
  return (
    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
      {[
        ["🌍 Diámetro", data.info.diametro],
        ["☀️ Dist. Sol", data.info.distSol],
        ["🔄 Período", data.info.periodo],
        ["🌡️ Temperatura", data.info.temp],
      ].map(([label, val]) => (
        <div key={label} className="bg-white/[0.07] rounded-xl p-3">
          <p className="text-white/40 mb-1 text-[10px]">{label}</p>
          <p className="font-bold text-white leading-tight">{val}</p>
        </div>
      ))}
    </div>
  );
});

// ─────────────────────────────────────────────
// DRAWER MÓVIL — CSS transition puro (sin JS animation)
// ─────────────────────────────────────────────
const MobileDrawer = memo(({ data, open, onClose }) => {
  if (!data || data.key === "sol") return null;
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] sm:hidden
                    transition-opacity duration-300 ease-out
                    ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 sm:hidden
                    bg-linear-to-b from-slate-900 to-[#0a0a1a]
                    rounded-t-[28px] border-t border-white/10
                    px-5 pt-3 pb-8 shadow-2xl
                    transition-transform duration-300 ease-out will-change-transform
                    ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl text-white">{data.emoji}</span>
            <div>
              <h2 className="text-xl font-black text-white leading-tight">
                {data.label}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: data.color }}
                />
                <span className="text-xs text-white/40">Sistema Solar</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white text-2xl leading-none px-2 py-1 -mr-1"
          >
            ✕
          </button>
        </div>

        <InfoCards data={data} />

        <div className="bg-white/[0.07] rounded-xl p-3 text-xs space-y-2 mb-3">
          <p className="text-white/50">
            🛰️ Satélites:{" "}
            <span className="text-white font-bold">{data.info.satelites}</span>
          </p>
          <p className="text-white/80 leading-relaxed">💡 {data.info.dato}</p>
        </div>

        {data.moons?.length > 0 && (
          <div className="bg-white/5 rounded-xl p-3 text-[11px] text-white/50">
            🌙 Lunas:{" "}
            <span className="text-white/70">
              {data.moons.map((m) => m.label).join(", ")}
            </span>
          </div>
        )}
      </div>
    </>
  );
});

// ─────────────────────────────────────────────
// PANEL DESKTOP
// ─────────────────────────────────────────────
const DesktopPanel = memo(({ data, onClose }) => {
  if (!data || data.key === "sol") return null;
  return (
    <div
      className="absolute bottom-4 right-4 z-50 hidden sm:block w-80
                    bg-linear-to-br from-slate-900/95 to-black/95
                    backdrop-blur-xl border border-white/15
                    rounded-2xl p-5 shadow-2xl text-white
                    transition-all duration-300 ease-out"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-4 text-white/30 hover:text-white text-xl leading-none transition-colors"
      >
        ✕
      </button>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{data.emoji}</span>
        <div>
          <h2 className="text-xl font-black leading-tight">{data.label}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: data.color }}
            />
            <span className="text-[11px] text-white/40">Sistema Solar</span>
          </div>
        </div>
      </div>
      <InfoCards data={data} />
      <div className="bg-white/[0.07] rounded-xl p-3 text-xs space-y-1.5 mb-2">
        <p className="text-white/50">
          🛰️ Satélites:{" "}
          <span className="text-white font-bold">{data.info.satelites}</span>
        </p>
        <p className="text-white/80 leading-relaxed">💡 {data.info.dato}</p>
      </div>
      {data.moons?.length > 0 && (
        <div className="bg-white/4 rounded-xl p-2.5 text-[11px] text-white/50">
          🌙 Lunas:{" "}
          <span className="text-white/70">
            {data.moons.map((m) => m.label).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────
// BOTÓN "VER DETALLES" — CSS transition, no JS
// ─────────────────────────────────────────────
const ViewDetailsButton = memo(({ data, visible, onClick }) => (
  <div
    className={`fixed bottom-6 left-1/2 z-50 sm:hidden
                transition-all duration-300 ease-out will-change-transform
                ${
                  visible && data && data.key !== "sol"
                    ? "opacity-100 -translate-x-1/2 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-x-1/2 translate-y-4 pointer-events-none"
                }`}
  >
    {data && data.key !== "sol" && (
      <button
        onClick={onClick}
        className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl
                   bg-white text-slate-900 font-black text-sm
                   shadow-[0_8px_32px_rgba(255,255,255,0.2)]
                   active:scale-95 transition-transform duration-150"
      >
        <span>{data.emoji}</span>
        Ver detalles de {data.label}
        <span>→</span>
      </button>
    )}
  </div>
));

// ─────────────────────────────────────────────
// MENÚ OPCIONES MÓVIL — solo sm:hidden
// ─────────────────────────────────────────────
const MobileOptionsMenu = memo(
  ({
    open,
    onToggle,
    speed,
    setSpeed,
    showOrbits,
    setShowOrbits,
    paused,
    setPaused,
  }) => (
    <div className="sm:hidden absolute top-4 left-4 z-50">
      {/* Botón hamburger */}
      <button
        onClick={onToggle}
        className="w-10 h-10 flex items-center justify-center rounded-xl
                 bg-black/60 backdrop-blur-md border border-white/10
                 text-white text-lg transition-all duration-200
                 active:scale-90"
        aria-label="Opciones"
      >
        {open ? "✕" : "⚙️"}
      </button>

      {/* Panel opciones */}
      <div
        className={`absolute top-12 left-0 w-52 origin-top-left
                  bg-black/80 backdrop-blur-xl border border-white/10
                  rounded-2xl p-4 text-white text-xs
                  flex flex-col gap-3 shadow-2xl
                  transition-all duration-250 ease-out
                  ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <p className="font-bold text-white/50 text-[11px] uppercase tracking-wider">
          Opciones
        </p>

        <button
          onClick={() => setPaused((p) => !p)}
          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all
                    ${paused ? "bg-green-600" : "bg-white/10"}`}
        >
          {paused ? "▶ Reanudar" : "⏸ Pausar"}
        </button>

        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-white/50">Velocidad</span>
            <span className="font-bold text-yellow-400">
              {speed.toFixed(1)}×
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full accent-yellow-400"
          />
        </div>

        <button
          onClick={() => setShowOrbits((o) => !o)}
          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all
                    ${showOrbits ? "bg-white/20" : "bg-white/5 text-white/40"}`}
        >
          {showOrbits ? "🔵 Órbitas ON" : "⬛ Órbitas OFF"}
        </button>
      </div>
    </div>
  ),
);

// ─────────────────────────────────────────────
// CONTROLES DESKTOP
// ─────────────────────────────────────────────
const DesktopControls = memo(
  ({ speed, setSpeed, showOrbits, setShowOrbits, paused, setPaused }) => (
    <div
      className="absolute top-20 right-4 z-50 hidden sm:flex
                  bg-black/60 backdrop-blur-md border border-white/10
                  rounded-2xl p-3 text-white text-xs
                  flex-col gap-3 w-44"
    >
      <p className="font-bold text-white/50 text-[11px] uppercase tracking-wider">
        Controles
      </p>
      <button
        onClick={() => setPaused((p) => !p)}
        className={`w-full py-2 rounded-xl font-bold text-xs transition-all
                  ${paused ? "bg-green-600 hover:bg-green-500" : "bg-white/10 hover:bg-white/20"}`}
      >
        {paused ? "▶ Reanudar" : "⏸ Pausar"}
      </button>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-white/50">Velocidad</span>
          <span className="font-bold text-yellow-400">{speed.toFixed(1)}×</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-full accent-yellow-400"
        />
      </div>
      <button
        onClick={() => setShowOrbits((o) => !o)}
        className={`w-full py-2 rounded-xl font-bold text-xs transition-all
                  ${showOrbits ? "bg-white/20" : "bg-white/5 text-white/40"}`}
      >
        {showOrbits ? "🔵 Órbitas ON" : "⬛ Órbitas OFF"}
      </button>
    </div>
  ),
);

// ─────────────────────────────────────────────
// SCENE — separado para que el state de UI no re-renderice el canvas
// ─────────────────────────────────────────────
const Scene = memo(({ selectedKey, speedMultiplier, showOrbits, onSelect }) => (
  <>
    <color attach="background" args={["#03030f"]} />
    <ambientLight intensity={0.25} />
    <Stars
      radius={120}
      depth={80}
      count={2500}
      factor={5}
      saturation={0}
      fade
      speed={0.4}
    />
    <Sun onSelect={onSelect} />
    {showOrbits &&
      PLANETS_DATA.map((p) => (
        <OrbitRing
          key={`orbit-${p.key}`}
          distance={p.distance}
          highlight={selectedKey === p.key}
        />
      ))}
    <AsteroidBelt />
    {PLANETS_DATA.map((p, i) => (
      <Planet
        key={p.key}
        data={p}
        onSelect={onSelect}
        speedMultiplier={speedMultiplier}
        isSelected={selectedKey === p.key}
        initialAngle={(i * Math.PI * 2) / PLANETS_DATA.length}
      />
    ))}
    <Comet />
    <OrbitControls
      enablePan={false}
      enableDamping
      dampingFactor={0.07}
      autoRotate={!selectedKey}
      autoRotateSpeed={0.2}
      minDistance={6}
      maxDistance={85}
    />
  </>
));

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
const SistemaSolar = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [paused, setPaused] = useState(false);
  const [showOrbits, setShowOrbits] = useState(true);

  const speedMultiplier = paused ? 0 : speed;

  const handleSelect = useCallback((data) => {
    setSelected((prev) => (prev?.key === data.key ? null : data));
    setDrawerOpen(false);
    setMenuOpen(false);
  }, []);

  const handleBack = useCallback(
    () => navigate("/", { replace: true }),
    [navigate],
  );

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* ── HEADER (centro) ── */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none
                      bg-black/60 backdrop-blur-md text-white px-4 py-2.5
                      rounded-2xl border border-white/10 text-center select-none w-max"
      >
        <p className="text-base sm:text-xl font-black tracking-tight">
          Sistema Solar 🌍
        </p>
        <p className="text-[9px] sm:text-xs text-white/80 mt-0.5 hidden sm:block">
          Te mereces el sistema solar y más ...
        </p>
      </div>

      {/* ── BOTÓN INICIO (derecha) ── */}
      <button
        onClick={handleBack}
        className="absolute top-4 right-4 z-50 flex items-center gap-1.5
                   bg-black/60 backdrop-blur-md border border-white/10
                   text-white text-xs font-semibold
                   px-3.5 py-2.5 rounded-xl
                   hover:bg-white/10 active:scale-95
                   transition-all duration-200"
      >
        Inicio →
      </button>

      {/* ── MÓVIL: botón opciones (arriba izquierda) ── */}
      <MobileOptionsMenu
        open={menuOpen}
        onToggle={() => setMenuOpen((o) => !o)}
        speed={speed}
        setSpeed={setSpeed}
        showOrbits={showOrbits}
        setShowOrbits={setShowOrbits}
        paused={paused}
        setPaused={setPaused}
      />

      {/* ── DESKTOP: controles (derecha) ── */}
      <DesktopControls
        speed={speed}
        setSpeed={setSpeed}
        showOrbits={showOrbits}
        setShowOrbits={setShowOrbits}
        paused={paused}
        setPaused={setPaused}
      />

      {/* ── DESKTOP: leyenda (izquierda abajo) ── */}
      <div
        className="absolute bottom-4 left-4 z-50 pointer-events-none
                      bg-black/60 backdrop-blur-md text-white
                      px-4 py-3 rounded-2xl border border-white/10
                      text-[10px] leading-[1.7] select-none hidden sm:block"
      >
        <p className="font-bold text-white/50 mb-1 text-[11px] uppercase tracking-wider">
          Planetas
        </p>
        {PLANETS_DATA.map((p) => (
          <div key={p.key} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: p.color }}
            />
            {p.emoji} {p.label}
          </div>
        ))}
      </div>

      {/* ── DESKTOP: panel info ── */}
      <DesktopPanel data={selected} onClose={() => setSelected(null)} />

      {/* ── MÓVIL: botón "Ver detalles" (CSS transition, no remount) ── */}
      <ViewDetailsButton
        data={selected}
        visible={!!selected && !drawerOpen}
        onClick={() => setDrawerOpen(true)}
      />

      {/* ── MÓVIL: drawer (siempre montado, controlado por CSS) ── */}
      <MobileDrawer
        data={selected}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
        }}
      />

      {/* ── CANVAS — solo re-renderiza Scene cuando cambian props 3D ── */}
      <Canvas
        camera={{ position: [0, 18, 48], fov: 45 }}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
        }}
        onPointerMissed={() => {
          setSelected(null);
          setDrawerOpen(false);
          setMenuOpen(false);
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <Scene
          selectedKey={selected?.key}
          speedMultiplier={speedMultiplier}
          showOrbits={showOrbits}
          onSelect={handleSelect}
        />
      </Canvas>
    </div>
  );
};

export default SistemaSolar;

import { useEffect, useRef, useState } from "react";

type StarBrightness = 0 | 1 | 2;

const TWINKLE_ANIM: Record<StarBrightness, string> = {
  0: "star-twinkle-dim",
  1: "star-twinkle-mid",
  2: "star-twinkle-bright",
};

const STARS = Array.from({ length: 78 }, (_, i) => ({
  id: i,
  x: ((i * 53.47 + 7.3) % 100).toFixed(1),
  y: ((i * 71.13 + 3.1) % 100).toFixed(1),
  r: 0.4 + (i % 7) * 0.24,
  brightness: (i % 3) as StarBrightness,
  duration: `${1.3 + (i % 6) * 0.35}s`,
  delay: `${(i % 11) * 0.18}s`,
}));

const ACCENT_STARS = [
  { cx: "12%", cy: "18%", r: 2,   fill: "white",   anim: "star-twinkle-bright 2.1s ease-in-out 0.4s infinite" },
  { cx: "78%", cy: "14%", r: 1.5, fill: "#ffe8b0", anim: "star-twinkle-bright 1.9s ease-in-out 1.1s infinite" },
  { cx: "88%", cy: "38%", r: 2.5, fill: "white",   anim: "star-twinkle-mid    2.6s ease-in-out 0.7s infinite" },
  { cx: "42%", cy: "7%",  r: 1.5, fill: "#b0d0ff", anim: "star-twinkle-bright 2.3s ease-in-out 1.7s infinite" },
  { cx: "62%", cy: "82%", r: 1.8, fill: "white",   anim: "star-twinkle-mid    2.0s ease-in-out 0.3s infinite" },
] as const;

const SPARKS = [
  { cx: 14, cy: 50, r: 2.5, fill: "#ffbb00", anim: "spark-a 0.42s ease-out infinite" },
  { cx: 10, cy: 68, r: 2,   fill: "#ff7700", anim: "spark-b 0.38s ease-out 0.08s infinite" },
  { cx: 6,  cy: 55, r: 3,   fill: "#ffdd00", anim: "spark-c 0.48s ease-out 0.04s infinite" },
  { cx: 18, cy: 76, r: 2,   fill: "#ff8800", anim: "spark-d 0.44s ease-out 0.14s infinite" },
  { cx: 4,  cy: 62, r: 1.5, fill: "#ffcc44", anim: "spark-a 0.36s ease-out 0.20s infinite" },
  { cx: 12, cy: 44, r: 2,   fill: "#ff5500", anim: "spark-b 0.52s ease-out 0.07s infinite" },
  { cx: 3,  cy: 72, r: 1.5, fill: "#ffaa00", anim: "spark-c 0.40s ease-out 0.17s infinite" },
  { cx: 20, cy: 80, r: 2.5, fill: "#ff6600", anim: "spark-d 0.46s ease-out 0.23s infinite" },
  { cx: 8,  cy: 58, r: 1.2, fill: "white",   anim: "spark-a 0.30s ease-out 0.11s infinite" },
  { cx: 16, cy: 72, r: 1,   fill: "white",   anim: "spark-b 0.33s ease-out 0.19s infinite" },
] as const;

const RIVETS = [97, 120, 143] as const;

interface LaunchAnimationProps {
  onComplete: () => void;
}

export function LaunchAnimation({ onComplete }: LaunchAnimationProps) {
  const [fading, setFading] = useState(false);
  const cbRef = useRef(onComplete);
  cbRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 2300);
    const t2 = setTimeout(() => cbRef.current(), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 select-none overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 22% 78%, #070e2a 0%, #020408 100%)",
        opacity: fading ? 0 : 1,
        transition: fading ? "opacity 0.7s ease-in" : "none",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      {/* Star field */}
      <svg className="absolute inset-0 h-full w-full">
        {STARS.map((s) => (
          <circle
            key={s.id}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.r}
            fill={s.brightness === 2 ? "#ffe8b0" : "white"}
            style={{ animation: `${TWINKLE_ANIM[s.brightness]} ${s.duration} ease-in-out ${s.delay} infinite` }}
          />
        ))}
        {ACCENT_STARS.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill}
            style={{ animation: s.anim }} />
        ))}
      </svg>

      {/* Ship */}
      <div
        className="absolute left-0 top-0"
        style={{ animation: "ship-fly 2.4s linear forwards" }}
      >
        <svg width="250" height="124" viewBox="0 0 250 124" xmlns="http://www.w3.org/2000/svg">

          {/* ── ENGINE EXHAUST ── */}
          <ellipse cx="22" cy="64" rx="30" ry="16" fill="#cc2200" opacity="0.45"
            style={{ animation: "flame-outer 0.13s ease-in-out infinite alternate" }} />
          <ellipse cx="30" cy="64" rx="23" ry="12" fill="#ff6200"
            style={{ animation: "flame-main 0.10s ease-in-out 0.03s infinite alternate" }} />
          <ellipse cx="38" cy="64" rx="15" ry="7" fill="#ffaa00"
            style={{ animation: "flame-core 0.09s ease-in-out 0.05s infinite alternate" }} />
          <ellipse cx="44" cy="64" rx="7" ry="4" fill="#fff6dc" opacity="0.95" />

          {SPARKS.map((s, i) => (
            <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill}
              style={{ animation: s.anim }} />
          ))}

          {/* ── ENGINE HOUSING ── */}
          <rect x="46" y="52" width="26" height="24" rx="4" fill="#3c4a5e" stroke="#111" strokeWidth={2.5} />
          <rect x="48" y="54" width="22" height="20" rx="3" fill="#58697e" />
          <line x1="53" y1="52" x2="53" y2="76" stroke="#29394d" strokeWidth={1.5} />
          <line x1="59" y1="52" x2="59" y2="76" stroke="#29394d" strokeWidth={1.5} />
          <line x1="65" y1="52" x2="65" y2="76" stroke="#29394d" strokeWidth={1.5} />

          {/* ── MAIN FUSELAGE ── */}
          <ellipse cx="132" cy="64" rx="82" ry="31" fill="#c6d4e8" stroke="#111" strokeWidth={3} />
          <ellipse cx="132" cy="52" rx="79" ry="15" fill="white" opacity="0.20" />
          <line x1="90"  y1="43" x2="90"  y2="85" stroke="#9fb2c6" strokeWidth={1.5} opacity="0.55" />
          <line x1="116" y1="39" x2="116" y2="89" stroke="#9fb2c6" strokeWidth={1.5} opacity="0.45" />
          <line x1="150" y1="40" x2="150" y2="88" stroke="#9fb2c6" strokeWidth={1.5} opacity="0.45" />

          {/* Speed lines */}
          <line x1="72" y1="57" x2="46" y2="57" stroke="#7a8ea6" strokeWidth={2}   opacity="0.35" />
          <line x1="70" y1="64" x2="40" y2="64" stroke="#7a8ea6" strokeWidth={2.5} opacity="0.35" />
          <line x1="72" y1="71" x2="46" y2="71" stroke="#7a8ea6" strokeWidth={2}   opacity="0.35" />

          {/* ── FINS ── */}
          <path d="M 80 47 L 58 16 L 97 41 Z" fill="#6b82a0" stroke="#111" strokeWidth={2.5} />
          <path d="M 80 47 L 66 23 L 93 41 Z" fill="#92aabf" opacity="0.55" />
          <path d="M 80 81 L 58 112 L 97 87 Z" fill="#6b82a0" stroke="#111" strokeWidth={2.5} />
          <path d="M 80 81 L 66 105 L 93 87 Z" fill="#92aabf" opacity="0.55" />
          <path d="M 60 55 L 47 44 L 68 53 Z" fill="#8799b4" stroke="#111" strokeWidth={1.5} />
          <path d="M 60 73 L 47 84 L 68 75 Z" fill="#8799b4" stroke="#111" strokeWidth={1.5} />

          {/* ── COCKPIT ── */}
          <ellipse cx="158" cy="47" rx="27" ry="10" fill="#9eb0c4" stroke="#111" strokeWidth={2} />
          <ellipse cx="158" cy="37" rx="25" ry="22" fill="#56b6d6" stroke="#111" strokeWidth={2.5} opacity="0.80" />
          <ellipse cx="165" cy="28" rx="10" ry="7" fill="white" opacity="0.30"
            transform="rotate(-18 165 28)" />

          {/* Astronaut helmet */}
          <circle cx="157" cy="43" r="15" fill="#eeddc0" stroke="#1a1a1a" strokeWidth={2.2} />
          <ellipse cx="157" cy="44" rx="11" ry="10" fill="#3a8ec4" stroke="#222" strokeWidth={1.5} />
          <ellipse cx="161" cy="38" rx="4" ry="3" fill="white" opacity="0.50"
            transform="rotate(-22 161 38)" />
          <circle cx="153" cy="45" r="2" fill="#1a1a1a" />
          <circle cx="161" cy="45" r="2" fill="#1a1a1a" />
          <circle cx="154" cy="44" r="0.8" fill="white" opacity="0.85" />
          <circle cx="162" cy="44" r="0.8" fill="white" opacity="0.85" />

          {/* ── NOSE CONE ── */}
          <ellipse cx="203" cy="64" rx="12" ry="21" fill="#d2dfee" stroke="#111" strokeWidth={2.5} />
          <path d="M 205 43 Q 232 64 205 85 Z" fill="#b8cadc" stroke="#111" strokeWidth={2.5} />

          {/* ── RIVETS ── */}
          {RIVETS.flatMap((x) => [
            <circle key={`rt${x}`} cx={x} cy={51} r={2} fill="#8a9db5" stroke="#111" strokeWidth={1} />,
            <circle key={`rb${x}`} cx={x} cy={77} r={2} fill="#8a9db5" stroke="#111" strokeWidth={1} />,
          ])}

          {/* Comic star on hull */}
          <path
            d="M 175 57 L 177 64 L 184 66 L 177 68 L 175 75 L 173 68 L 166 66 L 173 64 Z"
            fill="#ffdd44"
            stroke="#333"
            strokeWidth={1}
          />
        </svg>
      </div>
    </div>
  );
}

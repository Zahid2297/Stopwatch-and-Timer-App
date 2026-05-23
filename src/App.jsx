import { useState, useEffect, useRef, useCallback } from "react";

const c = {
  bg: "linear-gradient(135deg, #07060f 0%, #0d0b1e 50%, #060b10 100%)",
  accent: "#7c6cfc",
  accentGlow: "rgba(124,108,252,0.14)",
  accentBorder: "rgba(124,108,252,0.28)",
  accentDim: "rgba(124,108,252,0.09)",
  accentMid: "rgba(124,108,252,0.18)",
  danger: "#f87171",
  dangerDim: "rgba(248,113,113,0.09)",
  dangerBorder: "rgba(248,113,113,0.28)",
  success: "#34d399",
  successDim: "rgba(52,211,153,0.09)",
  successBorder: "rgba(52,211,153,0.28)",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  text: "#e2e8f0",
  muted: "#8899aa",
  hint: "#3d4f63",
  num: "'DM Sans', system-ui, sans-serif" /* clean zeros, no slash/dot */,
  sans: "'DM Sans', system-ui, sans-serif",
  r: "12px",
  rsm: "8px",
};

const pad = (n) => String(Math.floor(n)).padStart(2, "0");

function fmt(ms, showCs = true) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  if (showCs) return `${pad(m)}:${pad(s)}.${pad(cs)}`;
  return `${pad(m)}:${pad(s)}`;
}

function Ring({
  progress,
  size = 220,
  sw = 5,
  color = c.accent,
  glow = c.accentGlow,
}) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(progress, 1));
  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", overflow: "visible" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={sw}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={glow}
        strokeWidth={sw + 10}
        strokeDasharray={circ}
        strokeDashoffset={off}
        strokeLinecap="round"
        style={{
          transition: "stroke-dashoffset 0.08s linear",
          filter: "blur(5px)",
        }}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={circ}
        strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.08s linear" }}
      />
    </svg>
  );
}

function Btn({ onClick, label, icon, variant = "ghost", disabled }) {
  const v = {
    primary: { bg: c.accentDim, border: c.accentBorder, color: c.accent },
    danger: { bg: c.dangerDim, border: c.dangerBorder, color: c.danger },
    ghost: { bg: c.surface, border: c.border, color: c.muted },
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        padding: "12px 20px",
        borderRadius: c.r,
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        minWidth: 72,
        fontFamily: c.sans,
        transition: "opacity 0.15s",
      }}
    >
      <i
        className={`ti ti-${icon}`}
        style={{ fontSize: 21 }}
        aria-hidden="true"
      />
      <span
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function LapRow({ idx, time, delta, best, worst }) {
  const bg = best
    ? c.successDim
    : worst
      ? c.dangerDim
      : "rgba(255,255,255,0.02)";
  const border = best ? c.successBorder : worst ? c.dangerBorder : c.border;
  const num = best ? c.success : worst ? c.danger : c.accent;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 14px",
        borderRadius: c.rsm,
        background: bg,
        border: `1px solid ${border}`,
        fontSize: 13,
        flexShrink: 0,
      }}
    >
      <span style={{ color: num, width: 28, fontWeight: 600 }}>#{idx}</span>
      <span
        style={{
          fontFamily: c.num,
          fontSize: 12,
          color: c.text,
          flex: 1,
          textAlign: "center",
        }}
      >
        {fmt(delta)}
      </span>
      <span
        style={{
          fontFamily: c.num,
          fontSize: 12,
          color: c.muted,
          flex: 1,
          textAlign: "right",
        }}
      >
        {fmt(time)}
      </span>
    </div>
  );
}

/* ── STOPWATCH ────────────────────────────────────────────────────── */
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const startRef = useRef(null);
  const baseRef = useRef(0);
  const rafRef = useRef(null);

  const tick = useCallback(() => {
    setElapsed(baseRef.current + (Date.now() - startRef.current));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
      baseRef.current = elapsed;
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    baseRef.current = 0;
    setLaps([]);
  };

  const deltas = laps.map((v, i) => v - (laps[i - 1] ?? 0));
  const bestDelta = deltas.length > 1 ? Math.min(...deltas) : -1;
  const worstDelta = deltas.length > 1 ? Math.max(...deltas) : -1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
        gap: 24,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 220,
          height: 220,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${c.accentGlow} 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
        <Ring progress={running ? (elapsed % 60000) / 60000 : 0} />
        <div style={{ position: "absolute", textAlign: "center" }}>
          <div
            style={{
              fontFamily: c.num,
              fontSize: 32,
              fontWeight: 600,
              color: c.text,
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            {fmt(elapsed)}
          </div>
          {laps.length > 0 && (
            <div
              style={{
                fontSize: 11,
                color: c.accent,
                marginTop: 8,
                fontFamily: c.num,
                letterSpacing: "0.05em",
              }}
            >
              {pad(laps.length + 1)} · {fmt(elapsed - laps[laps.length - 1])}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        {!running ? (
          <Btn
            onClick={() => setRunning(true)}
            label="Start"
            icon="player-play"
            variant="primary"
          />
        ) : (
          <Btn
            onClick={() => setRunning(false)}
            label="Pause"
            icon="player-pause"
            variant="primary"
          />
        )}
        <Btn
          onClick={() => setLaps((p) => [...p, elapsed])}
          label="Lap"
          icon="flag"
          disabled={!running}
        />
        <Btn
          onClick={reset}
          label="Reset"
          icon="refresh"
          variant="danger"
          disabled={elapsed === 0}
        />
      </div>

      <style>{`
        .lap-scroll::-webkit-scrollbar { width: 4px; }
        .lap-scroll::-webkit-scrollbar-track { background: transparent; }
        .lap-scroll::-webkit-scrollbar-thumb { background: rgba(124,108,252,0.35); border-radius: 99px; }
        .lap-scroll::-webkit-scrollbar-thumb:hover { background: rgba(124,108,252,0.55); }
        .lap-scroll { scrollbar-width: thin; scrollbar-color: rgba(124,108,252,0.35) transparent; }
      `}</style>
      <div
        className="lap-scroll"
        style={{
          width: "100%",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {laps.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "2px 14px",
                marginBottom: 4,
                flexShrink: 0,
              }}
            >
              {["Lap", "Split", "Total"].map((l) => (
                <span
                  key={l}
                  style={{
                    fontSize: 10,
                    color: c.hint,
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
            {[...laps].reverse().map((v, ri) => {
              const i = laps.length - 1 - ri;
              return (
                <LapRow
                  key={i}
                  idx={i + 1}
                  time={v}
                  delta={deltas[i]}
                  best={deltas[i] === bestDelta}
                  worst={deltas[i] === worstDelta}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

/* ── TIME INPUT ───────────────────────────────────────────────────── */
function TimeInput({ label, value, max, onChange }) {
  const intervalRef = useRef(null);

  const change = (dir) =>
    onChange((prev) => {
      const next = prev + dir;
      if (next > max) return 0;
      if (next < 0) return max;
      return next;
    });

  const startRepeat = (dir) => {
    change(dir);
    intervalRef.current = setInterval(() => change(dir), 120);
  };
  const stopRepeat = () => clearInterval(intervalRef.current);
  const onWheel = (e) => {
    e.preventDefault();
    change(e.deltaY < 0 ? 1 : -1);
  };

  const ArrowBtn = ({ dir, icon }) => (
    <button
      onMouseDown={() => startRepeat(dir)}
      onMouseUp={stopRepeat}
      onMouseLeave={stopRepeat}
      onTouchStart={() => startRepeat(dir)}
      onTouchEnd={stopRepeat}
      style={{
        width: "100%",
        padding: "3px 0",
        border: "none",
        background: "rgba(124,108,252,0.22)",
        color: "#c4b8ff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(124,108,252,0.40)")
      }
      onMouseLeave={(e) => {
        stopRepeat();
        e.currentTarget.style.background = "rgba(124,108,252,0.22)";
      }}
    >
      <i
        className={`ti ti-${icon}`}
        style={{ fontSize: 13 }}
        aria-hidden="true"
      />
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
      onWheel={onWheel}
    >
      <div
        style={{
          width: 62,
          borderRadius: c.rsm,
          overflow: "hidden",
          border: `1px solid ${c.accentBorder}`,
          display: "flex",
          flexDirection: "column",
          userSelect: "none",
        }}
      >
        <ArrowBtn dir={1} icon="chevron-up" />
        <div style={{ height: 1, background: c.accentBorder }} />
        <div
          style={{
            textAlign: "center",
            fontFamily: c.num,
            fontSize: 24,
            fontWeight: 600,
            padding: "7px 0",
            background: c.accentDim,
            color: c.text,
            letterSpacing: "0.02em",
          }}
        >
          {pad(value)}
        </div>
        <div style={{ height: 1, background: c.accentBorder }} />
        <ArrowBtn dir={-1} icon="chevron-down" />
      </div>
      <span
        style={{
          fontSize: 10,
          color: c.hint,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── TIMER ────────────────────────────────────────────────────────── */
function Timer() {
  const [h, setH] = useState(0);
  const [m, setM] = useState(5);
  const [s, setS] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const startRef = useRef(null);
  const baseRef = useRef(0);
  const rafRef = useRef(null);

  const total = h * 3600000 + m * 60000 + s * 1000;

  const tick = useCallback(() => {
    const left = Math.max(0, baseRef.current - (Date.now() - startRef.current));
    setRemaining(left);
    if (left <= 0) {
      setRunning(false);
      setFinished(true);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
      if (remaining !== null) baseRef.current = remaining;
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const start = () => {
    if (remaining === null) {
      baseRef.current = total;
      setRemaining(total);
    }
    setFinished(false);
    setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    setRemaining(null);
    setFinished(false);
    baseRef.current = 0;
  };

  const display = remaining !== null ? remaining : total;
  const progress = total > 0 ? display / total : 0;
  const isEditing = remaining === null;
  const isLow = remaining !== null && remaining < 10000 && remaining > 0;
  const ringColor = finished ? c.success : isLow ? c.danger : c.accent;
  const ringGlow = finished ? c.successDim : isLow ? c.dangerDim : c.accentGlow;

  const mkSetter = (set) => (fn) =>
    set((prev) => (typeof fn === "function" ? fn(prev) : fn));

  return (
    /* gap:0 + justifyContent:space-between pushes buttons flush to bottom */
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          width: "100%",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 220,
            height: 220,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${ringGlow} 0%, transparent 70%)`,
              pointerEvents: "none",
              transition: "background 0.4s",
            }}
          />
          <Ring progress={progress} color={ringColor} glow={ringGlow} />
          <div style={{ position: "absolute", textAlign: "center" }}>
            {finished ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i
                  className="ti ti-check"
                  style={{ fontSize: 44, color: c.success }}
                  aria-hidden="true"
                />
                <span
                  style={{
                    fontSize: 12,
                    color: c.success,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                  }}
                >
                  DONE
                </span>
              </div>
            ) : (
              <div
                style={{
                  fontFamily: c.num,
                  fontSize: 32,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                  color: isLow ? c.danger : c.text,
                  transition: "color 0.3s",
                }}
              >
                {fmt(display, false)}
              </div>
            )}
            {isEditing && !finished && (
              <div style={{ fontSize: 11, color: c.hint, marginTop: 8 }}>
                set time below
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {isEditing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TimeInput
                label="Hours"
                value={h}
                max={23}
                onChange={mkSetter(setH)}
              />
              <span
                style={{
                  fontSize: 20,
                  color: c.hint,
                  marginBottom: 20,
                  fontFamily: c.num,
                }}
              >
                :
              </span>
              <TimeInput
                label="Min"
                value={m}
                max={59}
                onChange={mkSetter(setM)}
              />
              <span
                style={{
                  fontSize: 20,
                  color: c.hint,
                  marginBottom: 20,
                  fontFamily: c.num,
                }}
              >
                :
              </span>
              <TimeInput
                label="Sec"
                value={s}
                max={59}
                onChange={mkSetter(setS)}
              />
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              {[
                ["+ 30s", 30000],
                ["+ 1m", 60000],
                ["+ 5m", 300000],
              ].map(([lbl, ms]) => (
                <button
                  key={lbl}
                  onClick={() => {
                    baseRef.current = (remaining ?? 0) + ms;
                    setRemaining((r) => (r ?? 0) + ms);
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: c.rsm,
                    fontSize: 13,
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                    color: c.muted,
                    cursor: "pointer",
                    fontFamily: c.sans,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = c.accentBorder;
                    e.currentTarget.style.color = c.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = c.border;
                    e.currentTarget.style.color = c.muted;
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* flush to bottom — no gap below */}
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        {!running ? (
          <Btn
            onClick={start}
            label="Start"
            icon="player-play"
            variant="primary"
            disabled={total === 0 && remaining === null}
          />
        ) : (
          <Btn
            onClick={() => setRunning(false)}
            label="Pause"
            icon="player-pause"
            variant="primary"
          />
        )}
        <Btn
          onClick={reset}
          label="Reset"
          icon="refresh"
          variant="danger"
          disabled={remaining === null}
        />
      </div>
    </div>
  );
}

/* ── APP ──────────────────────────────────────────────────────────── */
export default function App() {
  const [tab, setTab] = useState("stopwatch");
  return (
    <div
      style={{
        minHeight: "100vh",
        background: c.bg,
        fontFamily: c.sans,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "44px 16px 64px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "-15%",
          left: "-8%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          pointerEvents: "none",
          background:
            "radial-gradient(circle, rgba(124,108,252,0.10) 0%, transparent 65%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-15%",
          right: "-8%",
          width: 560,
          height: 560,
          borderRadius: "50%",
          pointerEvents: "none",
          background:
            "radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 65%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "35%",
          right: "5%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          pointerEvents: "none",
          background:
            "radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 65%)",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 500,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.03)",
            borderRadius: c.r,
            border: `1px solid ${c.border}`,
            padding: 4,
            marginBottom: 20,
            gap: 4,
          }}
        >
          {[
            { id: "stopwatch", icon: "player-play", label: "Stopwatch" },
            { id: "timer", icon: "hourglass", label: "Timer" },
          ].map(({ id, icon, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "11px 16px",
                  borderRadius: "9px",
                  background: active
                    ? "linear-gradient(135deg,rgba(124,108,252,0.18),rgba(167,139,250,0.12))"
                    : "transparent",
                  border: active
                    ? `1px solid ${c.accentBorder}`
                    : "1px solid transparent",
                  color: active ? c.text : c.muted,
                  fontFamily: c.sans,
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <i
                  className={`ti ti-${icon}`}
                  style={{ fontSize: 15 }}
                  aria-hidden="true"
                />
                {label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 18,
            border: `1px solid ${c.border}`,
            padding: "32px 28px",
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            height: 480,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {tab === "stopwatch" ? <Stopwatch key="sw" /> : <Timer key="tm" />}
        </div>
      </div>
    </div>
  );
}

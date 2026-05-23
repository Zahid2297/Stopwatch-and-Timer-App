import { useState, useEffect, useRef, useCallback } from "react";

const theme = {
  bg: "var(--color-background-tertiary)",
  surface: "var(--color-background-secondary)",
  card: "var(--color-background-primary)",
  border: "var(--color-border-tertiary)",
  borderMid: "var(--color-border-secondary)",
  text: "var(--color-text-primary)",
  muted: "var(--color-text-secondary)",
  hint: "var(--color-text-tertiary)",
  accent: "#E8A020",
  accentDim: "rgba(232,160,32,0.12)",
  accentBorder: "rgba(232,160,32,0.35)",
  danger: "var(--color-text-danger)",
  dangerBg: "var(--color-background-danger)",
  success: "var(--color-text-success)",
  successBg: "var(--color-background-success)",
  mono: "var(--font-mono)",
};

const pad = (n) => String(Math.floor(n)).padStart(2, "0");

function formatTime(ms, showMs = true) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  if (showMs) return `${pad(m)}:${pad(s)}.${pad(cs)}`;
  return `${pad(m)}:${pad(s)}`;
}

function RingProgress({
  progress,
  size = 220,
  stroke = 6,
  color = theme.accent,
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(progress, 1));
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
        stroke={theme.border}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.08s linear" }}
      />
    </svg>
  );
}

function ControlBtn({ onClick, label, icon, variant = "default", disabled }) {
  const styles = {
    default: { bg: theme.card, border: theme.borderMid, color: theme.text },
    primary: {
      bg: theme.accentDim,
      border: theme.accentBorder,
      color: theme.accent,
    },
    danger: {
      bg: theme.dangerBg,
      border: "var(--color-border-danger)",
      color: theme.danger,
    },
    success: {
      bg: theme.successBg,
      border: "var(--color-border-success)",
      color: theme.success,
    },
  };
  const s = styles[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "12px 16px",
        borderRadius: "var(--border-radius-lg)",
        background: s.bg,
        border: `0.5px solid ${s.border}`,
        color: s.color,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        minWidth: 72,
        fontFamily: "var(--font-sans)",
        transition: "opacity 0.15s",
      }}
    >
      <i
        className={`ti ti-${icon}`}
        style={{ fontSize: 22 }}
        aria-hidden="true"
      />
      <span style={{ fontSize: 11, letterSpacing: "0.05em", fontWeight: 500 }}>
        {label}
      </span>
    </button>
  );
}

function LapRow({ idx, time, delta, best, worst }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: "var(--border-radius-md)",
        background: best
          ? theme.successBg
          : worst
            ? theme.dangerBg
            : "transparent",
        border: `0.5px solid ${best ? "var(--color-border-success)" : worst ? "var(--color-border-danger)" : theme.border}`,
        fontSize: 13,
      }}
    >
      <span style={{ color: theme.muted, width: 32 }}>#{idx}</span>
      <span
        style={{
          fontFamily: theme.mono,
          color: theme.text,
          flex: 1,
          textAlign: "center",
        }}
      >
        {formatTime(delta)}
      </span>
      <span
        style={{
          fontFamily: theme.mono,
          color: theme.muted,
          flex: 1,
          textAlign: "right",
        }}
      >
        {formatTime(time)}
      </span>
    </div>
  );
}

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

  const handleStart = () => setRunning(true);
  const handlePause = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    baseRef.current = 0;
    setLaps([]);
  };
  const handleLap = () => setLaps((prev) => [...prev, elapsed]);

  const lapDeltas = laps.map((t, i) => t - (laps[i - 1] ?? 0));
  const bestDelta = lapDeltas.length > 1 ? Math.min(...lapDeltas) : -1;
  const worstDelta = lapDeltas.length > 1 ? Math.max(...lapDeltas) : -1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 220,
          height: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <RingProgress progress={running ? (elapsed % 60000) / 60000 : 0} />
        <div style={{ position: "absolute", textAlign: "center" }}>
          <div
            style={{
              fontFamily: theme.mono,
              fontSize: 40,
              fontWeight: 500,
              color: theme.text,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {formatTime(elapsed)}
          </div>
          {laps.length > 0 && (
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 6 }}>
              Lap {laps.length + 1} ·{" "}
              {formatTime(elapsed - laps[laps.length - 1])}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {!running ? (
          <ControlBtn
            onClick={handleStart}
            label="Start"
            icon="player-play"
            variant="primary"
          />
        ) : (
          <ControlBtn
            onClick={handlePause}
            label="Pause"
            icon="player-pause"
            variant="primary"
          />
        )}
        <ControlBtn
          onClick={handleLap}
          label="Lap"
          icon="flag"
          disabled={!running}
        />
        <ControlBtn
          onClick={handleReset}
          label="Reset"
          icon="refresh"
          variant="danger"
          disabled={elapsed === 0}
        />
      </div>

      {laps.length > 0 && (
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 12px",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: theme.hint,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Lap
            </span>
            <span
              style={{
                fontSize: 11,
                color: theme.hint,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Split
            </span>
            <span
              style={{
                fontSize: 11,
                color: theme.hint,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Total
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {[...laps].reverse().map((t, ri) => {
              const i = laps.length - 1 - ri;
              const delta = lapDeltas[i];
              return (
                <LapRow
                  key={i}
                  idx={i + 1}
                  time={t}
                  delta={delta}
                  best={delta === bestDelta}
                  worst={delta === worstDelta}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TimeInput({ label, value, max, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(Math.min(max, Math.max(0, parseInt(e.target.value) || 0)))
        }
        style={{
          width: 72,
          textAlign: "center",
          fontFamily: theme.mono,
          fontSize: 32,
          fontWeight: 500,
          padding: "8px 4px",
          background: theme.surface,
          border: `0.5px solid ${theme.borderMid}`,
          borderRadius: "var(--border-radius-md)",
          color: theme.text,
        }}
      />
      <span
        style={{
          fontSize: 11,
          color: theme.hint,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Timer() {
  const [hInput, setHInput] = useState(0);
  const [mInput, setMInput] = useState(5);
  const [sInput, setSInput] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const startRef = useRef(null);
  const baseRef = useRef(0);
  const rafRef = useRef(null);

  const totalInput = hInput * 3600000 + mInput * 60000 + sInput * 1000;

  const tick = useCallback(() => {
    const spent = Date.now() - startRef.current;
    const left = Math.max(0, baseRef.current - spent);
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

  const handleStart = () => {
    if (remaining === null) {
      baseRef.current = totalInput;
      setRemaining(totalInput);
    }
    setFinished(false);
    setRunning(true);
  };
  const handlePause = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    setRemaining(null);
    setFinished(false);
    baseRef.current = 0;
  };

  const display = remaining !== null ? remaining : totalInput;
  const progress = totalInput > 0 ? display / totalInput : 0;
  const isEditing = remaining === null;
  const isLow = remaining !== null && remaining < 10000 && remaining > 0;

  const ringColor = finished
    ? theme.success
    : isLow
      ? theme.danger
      : theme.accent;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 220,
          height: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <RingProgress progress={progress} color={ringColor} />
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
                style={{ fontSize: 40, color: theme.success }}
                aria-hidden="true"
              />
              <span
                style={{ fontSize: 14, color: theme.success, fontWeight: 500 }}
              >
                Done!
              </span>
            </div>
          ) : (
            <div
              style={{
                fontFamily: theme.mono,
                fontSize: 40,
                fontWeight: 500,
                color: isLow ? theme.danger : theme.text,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                transition: "color 0.3s",
              }}
            >
              {formatTime(display, false)}
            </div>
          )}
          {isEditing && !finished && (
            <div style={{ fontSize: 11, color: theme.hint, marginTop: 6 }}>
              Set time below
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TimeInput
            label="Hours"
            value={hInput}
            max={23}
            onChange={setHInput}
          />
          <span
            style={{
              fontSize: 28,
              color: theme.muted,
              marginBottom: 18,
              fontFamily: theme.mono,
            }}
          >
            :
          </span>
          <TimeInput label="Min" value={mInput} max={59} onChange={setMInput} />
          <span
            style={{
              fontSize: 28,
              color: theme.muted,
              marginBottom: 18,
              fontFamily: theme.mono,
            }}
          >
            :
          </span>
          <TimeInput label="Sec" value={sInput} max={59} onChange={setSInput} />
        </div>
      )}

      {!isEditing && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { label: "+30s", ms: 30000 },
            { label: "+1m", ms: 60000 },
            { label: "+5m", ms: 300000 },
          ].map(({ label, ms }) => (
            <button
              key={label}
              onClick={() => {
                baseRef.current = (remaining ?? 0) + ms;
                setRemaining((r) => (r ?? 0) + ms);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: "var(--border-radius-md)",
                fontSize: 12,
                background: theme.surface,
                border: `0.5px solid ${theme.borderMid}`,
                color: theme.muted,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {!running ? (
          <ControlBtn
            onClick={handleStart}
            label="Start"
            icon="player-play"
            variant="primary"
            disabled={totalInput === 0 && remaining === null}
          />
        ) : (
          <ControlBtn
            onClick={handlePause}
            label="Pause"
            icon="player-pause"
            variant="primary"
          />
        )}
        <ControlBtn
          onClick={handleReset}
          label="Reset"
          icon="refresh"
          variant="danger"
          disabled={remaining === null}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("stopwatch");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "40px 16px 60px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <h2 className="sr-only">Stopwatch and Timer Application</h2>

      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <i
              className="ti ti-clock"
              style={{ fontSize: 20, color: theme.accent }}
              aria-hidden="true"
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: theme.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Chronos
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            background: theme.surface,
            borderRadius: "var(--border-radius-lg)",
            border: `0.5px solid ${theme.border}`,
            padding: 4,
            marginBottom: 28,
            gap: 4,
          }}
        >
          {[
            { id: "stopwatch", icon: "player-play", label: "Stopwatch" },
            { id: "timer", icon: "hourglass", label: "Timer" },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: "var(--border-radius-md)",
                background: tab === id ? theme.card : "transparent",
                border:
                  tab === id
                    ? `0.5px solid ${theme.borderMid}`
                    : "0.5px solid transparent",
                color: tab === id ? theme.text : theme.muted,
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: tab === id ? 500 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <i
                className={`ti ti-${icon}`}
                style={{ fontSize: 16 }}
                aria-hidden="true"
              />
              {label}
            </button>
          ))}
        </div>

        <div
          style={{
            background: theme.card,
            borderRadius: "var(--border-radius-lg)",
            border: `0.5px solid ${theme.border}`,
            padding: "32px 24px",
          }}
        >
          {tab === "stopwatch" ? <Stopwatch key="sw" /> : <Timer key="tm" />}
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: theme.hint,
            marginTop: 20,
          }}
        >
          Stopwatch · Countdown Timer
        </p>
      </div>
    </div>
  );
}

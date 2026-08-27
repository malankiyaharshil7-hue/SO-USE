import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Home as HomeIcon, BarChart3, Timer, Trophy, User, Flame, Brain,
  Clock, ChevronRight, X, Check, Moon, Sun, Monitor, Instagram,
  Youtube, Gamepad2, MessageCircle, Shield, Bell, Lock, Download,
  Trash2, Info, Plus, Minus, ArrowLeft, Sparkles, TrendingDown,
  TrendingUp, Award, Zap, Wind, HeartCrack, PartyPopper
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell
} from "recharts";

/* ============================================================
   SO USE — design tokens
   Dark-first "control room" palette. A single ring motif
   (STOP → PAUSE → CONTROL → LIVE) recurs on Home, Focus and
   the Urge flow so the whole app reads as one instrument.
   ============================================================ */
const palette = {
  dark: {
    bg: "#0A0D10",
    surface: "#12161A",
    surface2: "#181D22",
    border: "#232A31",
    text: "#EDEFF1",
    subtext: "#8A959E",
    faint: "#5B656D",
    accent: "#3DDC97",
    accentDim: "#1F5C43",
    warn: "#F0A857",
    danger: "#E9705E",
    ring: "#232A31",
  },
  light: {
    bg: "#F4F6F5",
    surface: "#FFFFFF",
    surface2: "#EEF1F0",
    border: "#E1E6E4",
    text: "#12181A",
    subtext: "#5C6B6A",
    faint: "#8E9C9A",
    accent: "#0E9A6B",
    accentDim: "#CFEEE1",
    warn: "#C77A22",
    danger: "#C24A3C",
    ring: "#E1E6E4",
  },
};

const DISPLAY_FONT = "'Space Grotesk', 'Inter', sans-serif";
const BODY_FONT = "'Inter', sans-serif";

function useTheme() {
  const [mode, setMode] = useState("system"); // system | light | dark
  const systemDark = true; // container can't read OS pref reliably; default system->dark
  const resolved = mode === "system" ? (systemDark ? "dark" : "light") : mode;
  return { mode, setMode, colors: palette[resolved], resolved };
}

/* ---------------- small primitives ---------------- */

function Ring({ pct, size = 120, stroke = 10, c, colorOverride, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.ring} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={colorOverride || c.accent} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - clamped)}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function Card({ c, children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: c.surface, border: `1px solid ${c.border}`, borderRadius: 20,
        padding: 18, ...style, cursor: onClick ? "pointer" : "default",
      }}
    >
      {children}
    </div>
  );
}

function Pill({ c, children, tone = "default" }) {
  const bg = tone === "accent" ? c.accentDim : c.surface2;
  const fg = tone === "accent" ? c.accent : c.subtext;
  return (
    <span style={{ background: bg, color: fg, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Button({ c, children, onClick, variant = "primary", style, disabled }) {
  const base = {
    fontFamily: BODY_FONT, fontWeight: 700, fontSize: 15, padding: "14px 20px",
    borderRadius: 16, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    width: "100%", transition: "transform 120ms ease, opacity 120ms ease",
    opacity: disabled ? 0.5 : 1,
  };
  const styles = {
    primary: { background: c.accent, color: "#03130C" },
    secondary: { background: c.surface2, color: c.text, border: `1px solid ${c.border}` },
    danger: { background: "transparent", color: c.danger, border: `1px solid ${c.danger}55` },
    ghost: { background: "transparent", color: c.subtext },
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...base, ...styles[variant], ...style }}
    >
      {children}
    </button>
  );
}

function fmtMin(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/* ============================================================
   MOCK DATA — clearly marked. In a shipped Android build these
   come from UsageStatsManager, not from state initializers.
   ============================================================ */
const APP_CATALOG = [
  { id: "ig", name: "Instagram", icon: Instagram, color: "#E1306C" },
  { id: "yt", name: "YouTube", icon: Youtube, color: "#FF3B30" },
  { id: "game", name: "Gaming", icon: Gamepad2, color: "#9B6BFF" },
  { id: "chat", name: "Messenger", icon: MessageCircle, color: "#3DDC97" },
];

const WEEK_DATA = [
  { day: "Mon", mins: 112 }, { day: "Tue", mins: 168 }, { day: "Wed", mins: 96 },
  { day: "Thu", mins: 201 }, { day: "Fri", mins: 244 }, { day: "Sat", mins: 270 },
  { day: "Sun", mins: 134 },
];
const MONTH_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`, mins: 90 + Math.round(70 * Math.abs(Math.sin(i / 3))) + (i % 7 === 5 ? 60 : 0),
}));
const YEAR_DATA = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"].map((m, i) => ({
  day: m, mins: 150 + Math.round(40 * Math.sin(i)) ,
}));

/* ============================================================
   ONBOARDING
   ============================================================ */
function Onboarding({ c, onDone }) {
  const [step, setStep] = useState(0);
  const [goalHours, setGoalHours] = useState(2);
  const [distractors, setDistractors] = useState([]);
  const [improve, setImprove] = useState(null);

  const toggleDistractor = (id) =>
    setDistractors((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  const screens = [
    // 0
    <div key="0" style={{ textAlign: "center" }}>
      <div style={{ margin: "0 auto 28px", width: 88, height: 88, borderRadius: 24, background: c.accentDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Shield size={40} color={c.accent} />
      </div>
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 40, fontWeight: 700, letterSpacing: -1, color: c.text }}>SO USE</div>
      <div style={{ color: c.subtext, fontSize: 16, marginTop: 10 }}>Stop Over. Start Living.</div>
    </div>,
    // 1
    <div key="1">
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700, color: c.text, marginBottom: 6 }}>How much time do you want to spend on your phone?</div>
      <div style={{ color: c.subtext, fontSize: 14, marginBottom: 24 }}>Set a daily goal. You can change this anytime.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[1, 2, 3, 4].map((h) => (
          <div key={h} onClick={() => setGoalHours(h)} style={{
            padding: "18px 0", textAlign: "center", borderRadius: 16, cursor: "pointer",
            background: goalHours === h ? c.accentDim : c.surface, border: `1px solid ${goalHours === h ? c.accent : c.border}`,
          }}>
            <div style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700, color: goalHours === h ? c.accent : c.text }}>{h}h</div>
          </div>
        ))}
      </div>
    </div>,
    // 2
    <div key="2">
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700, color: c.text, marginBottom: 6 }}>Which apps distract you the most?</div>
      <div style={{ color: c.subtext, fontSize: 14, marginBottom: 24 }}>Select all that apply.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {APP_CATALOG.map((a) => {
          const on = distractors.includes(a.id);
          return (
            <div key={a.id} onClick={() => toggleDistractor(a.id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, cursor: "pointer",
              background: on ? c.accentDim : c.surface, border: `1px solid ${on ? c.accent : c.border}`,
            }}>
              <a.icon size={20} color={on ? c.accent : c.subtext} />
              <span style={{ color: c.text, fontWeight: 600, flex: 1 }}>{a.name}</span>
              {on && <Check size={18} color={c.accent} />}
            </div>
          );
        })}
      </div>
    </div>,
    // 3
    <div key="3">
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700, color: c.text, marginBottom: 6 }}>What do you want to improve?</div>
      <div style={{ color: c.subtext, fontSize: 14, marginBottom: 24 }}>Pick your main focus.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {["Productivity", "Study", "Sleep", "Gaming control", "Social media control", "General phone usage"].map((label) => (
          <div key={label} onClick={() => setImprove(label)} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 14, cursor: "pointer",
            background: improve === label ? c.accentDim : c.surface, border: `1px solid ${improve === label ? c.accent : c.border}`,
          }}>
            <span style={{ color: c.text, fontWeight: 600 }}>{label}</span>
            {improve === label && <Check size={18} color={c.accent} />}
          </div>
        ))}
      </div>
    </div>,
    // 4
    <div key="4" style={{ textAlign: "center" }}>
      <Ring pct={1} size={140} stroke={10} c={c}>
        <Sparkles size={40} color={c.accent} />
      </Ring>
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 26, fontWeight: 700, color: c.text, marginTop: 22 }}>Your journey starts now.</div>
      <div style={{ color: c.subtext, fontSize: 14, marginTop: 8 }}>Goal set to {goalHours}h/day. We'll start learning your habits from here.</div>
    </div>,
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "40px 24px 24px", background: c.bg }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 36 }}>
        {screens.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? c.accent : c.surface2 }} />
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>{screens[step]}</div>
      <Button
        c={c}
        onClick={() => (step === screens.length - 1 ? onDone({ goalHours, distractors, improve }) : setStep(step + 1))}
        style={{ marginTop: 20 }}
      >
        {step === screens.length - 1 ? "START MY JOURNEY" : step === 0 ? "Get Started" : "Continue"}
      </Button>
    </div>
  );
}

/* ============================================================
   HEADER / SCREEN SHELL
   ============================================================ */
function ScreenHeader({ c, title, subtitle, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div>
        <div style={{ fontFamily: DISPLAY_FONT, fontSize: 26, fontWeight: 700, color: c.text, letterSpacing: -0.5 }}>{title}</div>
        {subtitle && <div style={{ color: c.subtext, fontSize: 13, marginTop: 4 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

/* ============================================================
   HOME
   ============================================================ */
function HomeScreen({ c, state, onOpenUrge, onNav }) {
  const { screenTimeMin, goalMin, streak, focusScore, timeSavedMin, yesterdayDeltaPct } = state;
  const pct = screenTimeMin / goalMin;
  const overGoal = pct > 1;

  return (
    <div>
      <ScreenHeader c={c} title="Good evening" subtitle="Here's your digital-health status" />

      <Card c={c} style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 14 }}>
        <Ring pct={Math.min(pct, 1)} size={104} stroke={9} c={c} colorOverride={overGoal ? c.danger : c.accent}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, color: c.text }}>{fmtMin(screenTimeMin)}</div>
          </div>
        </Ring>
        <div style={{ flex: 1 }}>
          <div style={{ color: c.subtext, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>Today's Screen Time</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            {yesterdayDeltaPct <= 0 ? <TrendingDown size={16} color={c.accent} /> : <TrendingUp size={16} color={c.danger} />}
            <span style={{ color: yesterdayDeltaPct <= 0 ? c.accent : c.danger, fontSize: 13, fontWeight: 700 }}>
              {Math.abs(yesterdayDeltaPct)}% {yesterdayDeltaPct <= 0 ? "less" : "more"} than yesterday
            </span>
          </div>
          <div style={{ color: c.faint, fontSize: 12, marginTop: 10 }}>Daily goal: {fmtMin(goalMin)}</div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <Card c={c}>
          <Flame size={20} color={c.warn} />
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700, color: c.text, marginTop: 8 }}>{streak} Days</div>
          <div style={{ color: c.subtext, fontSize: 12, marginTop: 2 }}>Current streak</div>
        </Card>
        <Card c={c}>
          <Brain size={20} color={c.accent} />
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700, color: c.text, marginTop: 8 }}>{focusScore}/100</div>
          <div style={{ color: c.subtext, fontSize: 12, marginTop: 2 }}>Focus score</div>
        </Card>
      </div>

      <Card c={c} style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>Time Saved</div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700, color: c.accent, marginTop: 6 }}>{fmtMin(timeSavedMin)}</div>
        </div>
        <Award size={26} color={c.accent} />
      </Card>

      <div
        onClick={onOpenUrge}
        style={{
          background: `linear-gradient(135deg, ${c.accentDim}, ${c.surface})`, border: `1px solid ${c.accent}55`,
          borderRadius: 20, padding: 20, marginBottom: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: 700, color: c.text }}>I WANT TO SCROLL</div>
          <div style={{ color: c.subtext, fontSize: 13, marginTop: 4 }}>Feeling the urge? Pause here first.</div>
        </div>
        <div style={{ width: 46, height: 46, borderRadius: 23, background: c.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Wind size={22} color="#03130C" />
        </div>
      </div>

      <div onClick={() => onNav("focus")} style={{ cursor: "pointer" }}>
        <Card c={c} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Timer size={20} color={c.subtext} />
            <span style={{ color: c.text, fontWeight: 600 }}>Start a Focus Session</span>
          </div>
          <ChevronRight size={18} color={c.faint} />
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   URGE FLOW ("I WANT TO SCROLL")
   ============================================================ */
function UrgeFlow({ c, onClose, onResisted, onGaveIn }) {
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState(null);
  const [seconds, setSeconds] = useState(30);
  const timerRef = useRef(null);

  useEffect(() => {
    if (step !== 1) return;
    setSeconds(30);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(timerRef.current); setStep(2); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [step]);

  const reasons = ["I'm bored", "I'm stressed", "I need information", "I'm avoiding something", "I don't know"];
  const breathPhase = Math.floor((30 - seconds) / 5) % 2 === 0 ? "Breathe in" : "Breathe out";
  const scale = 1 + 0.25 * Math.abs(Math.sin(((30 - seconds) / 5) * Math.PI));

  return (
    <Overlay c={c} onClose={onClose}>
      {step === 0 && (
        <div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 4 }}>What are you looking for?</div>
          <div style={{ color: c.subtext, fontSize: 13, marginBottom: 22 }}>Naming the urge weakens it.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reasons.map((r) => (
              <div key={r} onClick={() => { setReason(r); setStep(1); }} style={{
                padding: "14px 16px", borderRadius: 14, border: `1px solid ${c.border}`, background: c.surface2,
                color: c.text, fontWeight: 600, cursor: "pointer",
              }}>{r}</div>
            ))}
          </div>
        </div>
      )}
      {step === 1 && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{
            width: 140, height: 140, borderRadius: "50%", margin: "0 auto 28px",
            background: c.accentDim, display: "flex", alignItems: "center", justifyContent: "center",
            transform: `scale(${scale})`, transition: "transform 900ms ease-in-out",
          }}>
            <Wind size={44} color={c.accent} />
          </div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, color: c.text }}>{breathPhase}</div>
          <div style={{ color: c.subtext, fontSize: 13, marginTop: 8 }}>{seconds}s left · just breathe</div>
        </div>
      )}
      {step === 2 && (
        <div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 4 }}>Do you still want to open the app?</div>
          <div style={{ color: c.subtext, fontSize: 13, marginBottom: 26 }}>No judgment either way — just check in with yourself.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button c={c} variant="secondary" onClick={() => { onGaveIn(reason); onClose(); }}>Yes, I really need it</Button>
            <Button c={c} onClick={() => { onResisted(reason); onClose(); }}>No, I'm good</Button>
          </div>
        </div>
      )}
    </Overlay>
  );
}

function Overlay({ c, onClose, children }) {
  return (
    <div style={{
      position: "absolute", inset: 0, background: c.bg, zIndex: 50,
      display: "flex", flexDirection: "column", padding: "24px 20px",
    }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <div onClick={onClose} style={{ cursor: "pointer", padding: 6 }}><X size={20} color={c.subtext} /></div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

/* ============================================================
   APP LIMIT INTERVENTION (full-screen "STOP")
   ============================================================ */
function LimitIntervention({ c, appName, limitMin, onExit, onExtend }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#050706", zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "center", padding: 28, textAlign: "center" }}>
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 44, fontWeight: 800, color: c.danger, letterSpacing: -1 }}>STOP.</div>
      <div style={{ color: "#C7CDD1", fontSize: 15, marginTop: 18, lineHeight: 1.6 }}>
        You planned <strong style={{ color: "#fff" }}>{limitMin} minutes</strong> on {appName}.<br />
        You've reached your limit.
      </div>
      <div style={{ color: "#8A959E", fontSize: 14, marginTop: 14 }}>Do you really want to continue?</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 32 }}>
        <Button c={c} onClick={onExit}>Exit App</Button>
        <Button c={c} variant="danger" onClick={onExtend}>Take 5 More Minutes</Button>
      </div>
    </div>
  );
}

/* ============================================================
   APP LIMITS SCREEN (settings list within Profile flow, but
   also reachable from Home shortcuts) 
   ============================================================ */
function AppLimits({ c, limits, setLimits, onTestIntervention }) {
  const adjust = (id, delta) => {
    setLimits((prev) => prev.map((l) => (l.id === id ? { ...l, limitMin: Math.max(5, l.limitMin + delta) } : l)));
  };
  return (
    <div>
      <ScreenHeader c={c} title="App Limits" subtitle="Set a daily ceiling per app" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {limits.map((l) => {
          const app = APP_CATALOG.find((a) => a.id === l.id);
          const usedPct = Math.min(1, l.usedMin / l.limitMin);
          const near = usedPct >= 0.85 && usedPct < 1;
          const over = usedPct >= 1;
          return (
            <Card key={l.id} c={c}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${app.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <app.icon size={20} color={app.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: c.text, fontWeight: 700 }}>{app.name}</div>
                  <div style={{ color: c.subtext, fontSize: 12, marginTop: 2 }}>{fmtMin(l.usedMin)} of {fmtMin(l.limitMin)}</div>
                </div>
                <div onClick={() => adjust(l.id, -5)} style={{ cursor: "pointer", padding: 6 }}><Minus size={16} color={c.subtext} /></div>
                <div onClick={() => adjust(l.id, 5)} style={{ cursor: "pointer", padding: 6 }}><Plus size={16} color={c.subtext} /></div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: c.surface2, marginTop: 12, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${usedPct * 100}%`, background: over ? c.danger : near ? c.warn : c.accent, transition: "width 400ms" }} />
              </div>
              {near && <div style={{ color: c.warn, fontSize: 12, marginTop: 8, fontWeight: 600 }}>You have {l.limitMin - l.usedMin} minutes left.</div>}
              {over && (
                <div onClick={() => onTestIntervention(l)} style={{ color: c.danger, fontSize: 12, marginTop: 8, fontWeight: 700, cursor: "pointer" }}>
                  Limit reached — tap to view intervention
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   FOCUS
   ============================================================ */
function FocusScreen({ c, sessionsCompleted, onComplete }) {
  const [durationMin, setDurationMin] = useState(null);
  const [customMin, setCustomMin] = useState(20);
  const [remaining, setRemaining] = useState(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  const messages = ["Stay with it.", "Real life is waiting.", "One less scroll.", "You control the screen."];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    const msgInt = setInterval(() => setMsgIdx((i) => (i + 1) % messages.length), 6000);
    return () => { clearInterval(intervalRef.current); clearInterval(msgInt); };
  }, [running]);

  const start = (min) => { setDurationMin(min); setRemaining(min * 60); setRunning(true); setDone(false); };
  const reset = () => { setDurationMin(null); setRemaining(null); setRunning(false); setDone(false); };
  const finishNow = () => { clearInterval(intervalRef.current); setRunning(false); setDone(true); };

  if (done) {
    return (
      <div style={{ textAlign: "center", paddingTop: 40 }}>
        <PartyPopper size={40} color={c.accent} style={{ marginBottom: 14 }} />
        <div style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700, color: c.text }}>Focus Session Complete</div>
        <div style={{ color: c.subtext, fontSize: 14, marginTop: 8 }}>You protected {durationMin} minutes of your life.</div>
        <Pill c={c} tone="accent">+20 XP</Pill>
        <div style={{ marginTop: 28 }}>
          <Button c={c} onClick={() => { onComplete(durationMin); reset(); }}>Done</Button>
        </div>
      </div>
    );
  }

  if (durationMin && remaining !== null) {
    const pct = 1 - remaining / (durationMin * 60);
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");
    return (
      <div style={{ textAlign: "center", paddingTop: 20 }}>
        <div style={{ color: c.subtext, fontSize: 13, marginBottom: 20 }}>Focus Mode active · distractions minimized</div>
        <Ring pct={pct} size={220} stroke={14} c={c}>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 40, fontWeight: 700, color: c.text }}>{mm}:{ss}</div>
        </Ring>
        <div style={{ color: c.accent, fontSize: 14, fontWeight: 600, marginTop: 24, minHeight: 20 }}>{messages[msgIdx]}</div>
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 10 }}>
          <Button c={c} variant="secondary" onClick={finishNow}>End Early</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader c={c} title="Focus" subtitle={`${sessionsCompleted} sessions completed`} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[5, 15, 25, 45].map((m) => (
          <div key={m} onClick={() => start(m)} style={{
            padding: "22px 0", textAlign: "center", borderRadius: 16, cursor: "pointer",
            background: c.surface, border: `1px solid ${c.border}`,
          }}>
            <div style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700, color: c.text }}>{m}</div>
            <div style={{ color: c.subtext, fontSize: 12, marginTop: 2 }}>minutes</div>
          </div>
        ))}
      </div>
      <Card c={c}>
        <div style={{ color: c.text, fontWeight: 700, marginBottom: 10 }}>Custom duration</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div onClick={() => setCustomMin((m) => Math.max(5, m - 5))} style={{ cursor: "pointer", width: 36, height: 36, borderRadius: 10, background: c.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={16} color={c.text} /></div>
          <div style={{ flex: 1, textAlign: "center", fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, color: c.text }}>{customMin} min</div>
          <div onClick={() => setCustomMin((m) => m + 5)} style={{ cursor: "pointer", width: 36, height: 36, borderRadius: 10, background: c.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={16} color={c.text} /></div>
        </div>
        <Button c={c} style={{ marginTop: 14 }} onClick={() => start(customMin)}>Start Focus Session</Button>
      </Card>
    </div>
  );
}

/* ============================================================
   TIME DEBT
   ============================================================ */
const ACTIVITIES = [
  { id: "walk", label: "Walk", icon: "🚶", minutes: 15 },
  { id: "study", label: "Study", icon: "📚", minutes: 30 },
  { id: "exercise", label: "Exercise", icon: "🏋️", minutes: 20 },
  { id: "hobby", label: "Hobby", icon: "🎨", minutes: 20 },
  { id: "clean", label: "Clean your room", icon: "🧹", minutes: 15 },
  { id: "family", label: "Spend time with family", icon: "👨‍👩‍👦", minutes: 30 },
  { id: "sleep", label: "Sleep early", icon: "😴", minutes: 30 },
];

function TimeDebt({ c, debtMin, onReduce, completedToday }) {
  return (
    <Card c={c} style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 22 }}>⚠️</div>
        <div>
          <div style={{ color: c.text, fontWeight: 700 }}>Time Debt: {fmtMin(Math.max(debtMin, 0))}</div>
          <div style={{ color: c.subtext, fontSize: 12, marginTop: 2 }}>Pay it back with real-life activities</div>
        </div>
      </div>
      {debtMin > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {ACTIVITIES.map((a) => {
            const done = completedToday.includes(a.id);
            return (
              <div key={a.id} onClick={() => !done && onReduce(a)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 999,
                background: done ? c.accentDim : c.surface2, border: `1px solid ${done ? c.accent : c.border}`,
                cursor: done ? "default" : "pointer", opacity: done ? 0.7 : 1,
              }}>
                <span>{a.icon}</span>
                <span style={{ color: done ? c.accent : c.text, fontSize: 13, fontWeight: 600 }}>{a.label}</span>
                {done && <Check size={13} color={c.accent} />}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: c.accent, fontSize: 13, fontWeight: 600, marginTop: 12 }}>No debt today. Nicely done.</div>
      )}
    </Card>
  );
}

/* ============================================================
   CHALLENGES
   ============================================================ */
function ChallengesScreen({ c, daily, weekly, toggleChallenge, xp, level, levelName, nextLevelXp }) {
  const Row = ({ ch }) => (
    <div onClick={() => toggleChallenge(ch.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: `1px solid ${c.border}`, cursor: "pointer" }}>
      <div style={{
        width: 24, height: 24, borderRadius: 8, border: `2px solid ${ch.done ? c.accent : c.faint}`,
        background: ch.done ? c.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {ch.done && <Check size={14} color="#03130C" />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: ch.done ? c.subtext : c.text, fontWeight: 600, textDecoration: ch.done ? "line-through" : "none" }}>{ch.label}</div>
      </div>
      <Pill c={c} tone={ch.done ? "accent" : "default"}>+{ch.xp} XP</Pill>
    </div>
  );

  return (
    <div>
      <ScreenHeader c={c} title="Challenges" />
      <Card c={c} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700 }}>LEVEL {level} · {levelName}</div>
            <div style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, color: c.text, marginTop: 4 }}>{xp} XP</div>
          </div>
          <Zap size={26} color={c.warn} />
        </div>
        <div style={{ height: 6, borderRadius: 3, background: c.surface2, marginTop: 12, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (xp / nextLevelXp) * 100)}%`, background: c.accent }} />
        </div>
        <div style={{ color: c.faint, fontSize: 11, marginTop: 6 }}>{nextLevelXp - xp > 0 ? `${nextLevelXp - xp} XP to next level` : "Level up!"}</div>
      </Card>

      <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Daily</div>
      <Card c={c} style={{ marginBottom: 16 }}>{daily.map((ch) => <Row key={ch.id} ch={ch} />)}</Card>

      <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Weekly</div>
      <Card c={c}>{weekly.map((ch) => <Row key={ch.id} ch={ch} />)}</Card>
    </div>
  );
}

/* ============================================================
   INSIGHTS
   ============================================================ */
function InsightsScreen({ c, state }) {
  const [range, setRange] = useState("Week");
  const data = range === "Week" ? WEEK_DATA : range === "Month" ? MONTH_DATA : range === "Year" ? YEAR_DATA : [WEEK_DATA[WEEK_DATA.length - 1]];

  const pieData = APP_CATALOG.map((a, i) => ({ name: a.name, value: [62, 42, 28, 14][i], color: a.color }));

  return (
    <div>
      <ScreenHeader c={c} title="Insights" subtitle="Your patterns, at a glance" />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["Today", "Week", "Month", "Year"].map((r) => (
          <div key={r} onClick={() => setRange(r)} style={{
            padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: range === r ? c.accent : c.surface2, color: range === r ? "#03130C" : c.subtext,
          }}>{r}</div>
        ))}
      </div>

      <Card c={c} style={{ marginBottom: 14 }}>
        <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>SCREEN TIME</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.accent} stopOpacity={0.4} />
                <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: c.faint, fontSize: 10 }} axisLine={false} tickLine={false} interval={range === "Month" ? 4 : 0} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => fmtMin(v)} />
            <Area type="monotone" dataKey="mins" stroke={c.accent} strokeWidth={2} fill="url(#fillArea)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <Card c={c}>
          <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700 }}>UNLOCKS</div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700, color: c.text, marginTop: 6 }}>{state.unlocks}</div>
        </Card>
        <Card c={c}>
          <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700 }}>LONGEST SESSION</div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700, color: c.text, marginTop: 6 }}>{fmtMin(state.longestSessionMin)}</div>
        </Card>
        <Card c={c}>
          <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700 }}>LATE-NIGHT USE</div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700, color: c.text, marginTop: 6 }}>{fmtMin(state.lateNightMin)}</div>
        </Card>
        <Card c={c}>
          <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700 }}>UNNECESSARY OPENS</div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700, color: c.text, marginTop: 6 }}>{state.unnecessaryOpens}</div>
        </Card>
      </div>

      <Card c={c} style={{ marginBottom: 14 }}>
        <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>MOST-USED APPS</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ResponsiveContainer width={100} height={100}>
            <PieChart>
              <Pie data={pieData} dataKey="value" innerRadius={28} outerRadius={46} paddingAngle={3} stroke="none">
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            {pieData.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: d.color }} />
                <div style={{ color: c.text, fontSize: 13, flex: 1 }}>{d.name}</div>
                <div style={{ color: c.subtext, fontSize: 12 }}>{fmtMin(d.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card c={c}>
          <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700 }}>YOUR BEST DAY</div>
          <div style={{ color: c.text, fontWeight: 700, marginTop: 8 }}>Monday</div>
          <div style={{ color: c.subtext, fontSize: 12, marginTop: 2 }}>Only 1h 52m screen time</div>
        </Card>
        <Card c={c}>
          <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700 }}>BIGGEST DISTRACTION</div>
          <div style={{ color: c.text, fontWeight: 700, marginTop: 8 }}>YouTube</div>
          <div style={{ color: c.subtext, fontSize: 12, marginTop: 2 }}>1h 42m this week</div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   STREAK / RECOVERY MODE
   ============================================================ */
function StreakBroken({ c, onRestart }) {
  return (
    <Card c={c} style={{ textAlign: "center", background: c.surface, border: `1px solid ${c.border}` }}>
      <HeartCrack size={26} color={c.subtext} style={{ marginBottom: 10 }} />
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: 700, color: c.text }}>Your streak ended. That's okay.</div>
      <div style={{ color: c.subtext, fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>One bad day doesn't erase your progress.</div>
      <Button c={c} style={{ marginTop: 16 }} onClick={onRestart}>Start again today · Recovery Mode</Button>
    </Card>
  );
}

/* ============================================================
   PROFILE
   ============================================================ */
function ProfileScreen({ c, theme, state, badges }) {
  const [tab, setTab] = useState(null); // null | privacy | limits

  if (tab === "limits") {
    return (
      <div>
        <div onClick={() => setTab(null)} style={{ display: "flex", alignItems: "center", gap: 6, color: c.subtext, cursor: "pointer", marginBottom: 14 }}>
          <ArrowLeft size={16} /> <span style={{ fontSize: 13 }}>Back</span>
        </div>
        <AppLimits c={c} limits={state.limits} setLimits={state.setLimits} onTestIntervention={() => {}} />
      </div>
    );
  }

  if (tab === "privacy") {
    return (
      <div>
        <div onClick={() => setTab(null)} style={{ display: "flex", alignItems: "center", gap: 6, color: c.subtext, cursor: "pointer", marginBottom: 14 }}>
          <ArrowLeft size={16} /> <span style={{ fontSize: 13 }}>Back</span>
        </div>
        <ScreenHeader c={c} title="Privacy" />
        <Card c={c} style={{ marginBottom: 12 }}>
          <div style={{ color: c.text, fontWeight: 700, marginBottom: 6 }}>What we collect</div>
          <div style={{ color: c.subtext, fontSize: 13, lineHeight: 1.6 }}>
            App usage duration and unlock counts, on-device only, to power your insights and limits. Nothing is sold, and usage data never leaves your device unless you export it yourself.
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SettingRow c={c} icon={Download} label="Export my data" />
          <SettingRow c={c} icon={Trash2} label="Delete all data" danger />
          <SettingRow c={c} icon={Lock} label="Permission management" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader c={c} title="Profile" />
      <Card c={c} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: c.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, color: c.accent }}>
          U
        </div>
        <div>
          <div style={{ color: c.text, fontWeight: 700, fontSize: 16 }}>You</div>
          <div style={{ color: c.subtext, fontSize: 12, marginTop: 2 }}>Level {state.level} · {state.levelName}</div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        <Card c={c} style={{ textAlign: "center", padding: 12 }}>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: 700, color: c.text }}>{state.streak}</div>
          <div style={{ color: c.subtext, fontSize: 11, marginTop: 2 }}>Streak</div>
        </Card>
        <Card c={c} style={{ textAlign: "center", padding: 12 }}>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: 700, color: c.text }}>{fmtMin(state.timeSavedMin)}</div>
          <div style={{ color: c.subtext, fontSize: 11, marginTop: 2 }}>Time saved</div>
        </Card>
        <Card c={c} style={{ textAlign: "center", padding: 12 }}>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: 700, color: c.text }}>{state.focusSessions}</div>
          <div style={{ color: c.subtext, fontSize: 11, marginTop: 2 }}>Focus sessions</div>
        </Card>
      </div>

      <div style={{ color: c.subtext, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Badges</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {badges.map((b) => (
          <div key={b.label} style={{ textAlign: "center", opacity: b.earned ? 1 : 0.35 }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: c.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `1px solid ${c.border}` }}>{b.emoji}</div>
            <div style={{ color: c.subtext, fontSize: 10, marginTop: 4, width: 56 }}>{b.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SettingRow c={c} icon={Shield} label="App limits" onClick={() => setTab("limits")} />
        <SettingRow c={c} icon={Bell} label="Notification settings" />
        <ThemeRow c={c} theme={theme} />
        <SettingRow c={c} icon={Lock} label="Privacy settings" onClick={() => setTab("privacy")} />
        <SettingRow c={c} icon={Info} label="About SO USE" />
      </div>
    </div>
  );
}

function SettingRow({ c, icon: Icon, label, onClick, danger }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: c.surface, border: `1px solid ${c.border}`, cursor: onClick ? "pointer" : "default" }}>
      <Icon size={18} color={danger ? c.danger : c.subtext} />
      <span style={{ color: danger ? c.danger : c.text, fontWeight: 600, flex: 1, fontSize: 14 }}>{label}</span>
      {onClick && <ChevronRight size={16} color={c.faint} />}
    </div>
  );
}

function ThemeRow({ c, theme }) {
  const opts = [{ id: "system", icon: Monitor }, { id: "light", icon: Sun }, { id: "dark", icon: Moon }];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 14, background: c.surface, border: `1px solid ${c.border}` }}>
      <span style={{ color: c.text, fontWeight: 600, flex: 1, fontSize: 14 }}>Theme</span>
      <div style={{ display: "flex", gap: 4, background: c.surface2, borderRadius: 10, padding: 3 }}>
        {opts.map((o) => (
          <div key={o.id} onClick={() => theme.setMode(o.id)} style={{
            padding: 7, borderRadius: 8, cursor: "pointer", background: theme.mode === o.id ? c.accent : "transparent",
          }}>
            <o.icon size={14} color={theme.mode === o.id ? "#03130C" : c.subtext} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PERMISSION / EMPTY STATES
   ============================================================ */
function PermissionGate({ c, onGrant }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: c.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Shield size={32} color={c.accent} />
      </div>
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 19, fontWeight: 700, color: c.text }}>SO USE needs Usage Access</div>
      <div style={{ color: c.subtext, fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>
        This permission allows us to understand your app usage and provide accurate insights. Nothing leaves your device.
      </div>
      <Button c={c} style={{ marginTop: 24 }} onClick={onGrant}>GRANT ACCESS</Button>
    </div>
  );
}

/* ============================================================
   TOP-LEVEL APP
   ============================================================ */
export default function SoUseApp() {
  const theme = useTheme();
  const c = theme.colors;

  const [onboarded, setOnboarded] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [nav, setNav] = useState("home");
  const [showUrge, setShowUrge] = useState(false);
  const [interventionApp, setInterventionApp] = useState(null);
  const [toast, setToast] = useState(null);

  const [goalMin, setGoalMin] = useState(150);
  const [screenTimeMin, setScreenTimeMin] = useState(134);
  const [streak, setStreak] = useState(12);
  const [streakBroken, setStreakBroken] = useState(false);
  const [focusScore, setFocusScore] = useState(82);
  const [timeSavedMin, setTimeSavedMin] = useState(106);
  const [focusSessions, setFocusSessions] = useState(7);
  const [urgesResisted, setUrgesResisted] = useState(4);
  const [xp, setXp] = useState(340);
  const [debtCompleted, setDebtCompleted] = useState([]);

  const [limits, setLimits] = useState([
    { id: "ig", limitMin: 45, usedMin: 41 },
    { id: "yt", limitMin: 60, usedMin: 58 },
    { id: "game", limitMin: 90, usedMin: 92 },
  ]);

  const [daily, setDaily] = useState([
    { id: "d1", label: "Keep screen time below 3 hours", xp: 30, done: true },
    { id: "d2", label: "Complete 2 Focus Sessions", xp: 40, done: false },
    { id: "d3", label: "No social media for 1 hour", xp: 30, done: false },
    { id: "d4", label: "Avoid phone during meals", xp: 20, done: true },
  ]);
  const [weekly, setWeekly] = useState([
    { id: "w1", label: "Reduce screen time by 20%", xp: 100, done: false },
    { id: "w2", label: "Complete 10 focus sessions", xp: 100, done: false },
    { id: "w3", label: "Achieve 7 successful days", xp: 150, done: false },
    { id: "w4", label: "Reduce unnecessary unlocks", xp: 80, done: false },
  ]);

  const toggleChallenge = (id) => {
    const bump = (list, setList) => {
      const item = list.find((i) => i.id === id);
      if (!item) return false;
      setList(list.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
      setXp((x) => x + (item.done ? -item.xp : item.xp));
      return true;
    };
    if (!bump(daily, setDaily)) bump(weekly, setWeekly);
  };

  const level = Math.max(1, Math.floor(xp / 250) + 1);
  const levelName = level >= 50 ? "Digital Warrior" : level >= 25 ? "Master" : level >= 10 ? "Disciplined" : level >= 5 ? "Focused" : "Beginner";
  const nextLevelXp = level * 250;

  const debtMin = Math.max(0, screenTimeMin - goalMin) - debtCompleted.reduce((s, id) => {
    const a = ACTIVITIES.find((x) => x.id === id);
    return s + (a ? a.minutes : 0);
  }, 0);

  const badges = [
    { emoji: "🔥", label: "7-Day", earned: streak >= 7 },
    { emoji: "🧠", label: "Focused", earned: focusScore >= 80 },
    { emoji: "🌙", label: "Night Owl Tamed", earned: true },
    { emoji: "💪", label: "100-Day", earned: streak >= 100 },
  ];

  const insightsState = {
    unlocks: 58, longestSessionMin: 47, lateNightMin: 22, unnecessaryOpens: 14,
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const handleUrgeResisted = () => {
    setUrgesResisted((n) => n + 1);
    setXp((x) => x + 15);
    setTimeSavedMin((t) => t + 8);
    showToast("Urge resisted · +15 XP");
  };
  const handleUrgeGaveIn = () => showToast("That's okay. Noted.");

  const handleFocusComplete = (min) => {
    setFocusSessions((n) => n + 1);
    setXp((x) => x + 20);
    setTimeSavedMin((t) => t + min);
    showToast(`Focus complete · +20 XP`);
  };

  const handleDebtReduce = (activity) => {
    setDebtCompleted((d) => [...d, activity.id]);
    showToast(`${activity.label} logged · debt reduced`);
  };

  if (!onboarded) {
    return (
      <Shell c={c} theme={theme}>
        <Onboarding c={c} onDone={(prefs) => { setGoalMin(prefs.goalHours * 60); setOnboarded(true); }} />
      </Shell>
    );
  }

  if (!permissionGranted) {
    return (
      <Shell c={c} theme={theme}>
        <PermissionGate c={c} onGrant={() => setPermissionGranted(true)} />
      </Shell>
    );
  }

  const navItems = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "insights", label: "Insights", icon: BarChart3 },
    { id: "focus", label: "Focus", icon: Timer },
    { id: "challenges", label: "Challenges", icon: Trophy },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <Shell c={c} theme={theme}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 18px 12px", WebkitOverflowScrolling: "touch" }}>
        {nav === "home" && (
          <>
            <HomeScreen
              c={c}
              state={{ screenTimeMin, goalMin, streak, focusScore, timeSavedMin, yesterdayDeltaPct: -32 }}
              onOpenUrge={() => setShowUrge(true)}
              onNav={setNav}
            />
            {streakBroken && <div style={{ marginTop: 14 }}><StreakBroken c={c} onRestart={() => { setStreakBroken(false); setStreak(0); }} /></div>}
            <TimeDebt c={c} debtMin={debtMin} onReduce={handleDebtReduce} completedToday={debtCompleted} />
            <div style={{ height: 8 }} />
            <div onClick={() => setStreakBroken((s) => !s)} style={{ textAlign: "center", color: c.faint, fontSize: 11, marginTop: 10, cursor: "pointer" }}>
              (demo) toggle streak-broken state
            </div>
          </>
        )}
        {nav === "insights" && <InsightsScreen c={c} state={insightsState} />}
        {nav === "focus" && <FocusScreen c={c} sessionsCompleted={focusSessions} onComplete={handleFocusComplete} />}
        {nav === "challenges" && (
          <ChallengesScreen c={c} daily={daily} weekly={weekly} toggleChallenge={toggleChallenge} xp={xp} level={level} levelName={levelName} nextLevelXp={nextLevelXp} />
        )}
        {nav === "profile" && (
          <ProfileScreen
            c={c} theme={theme}
            state={{ streak, timeSavedMin, focusSessions, level, levelName, limits, setLimits }}
            badges={badges}
          />
        )}
      </div>

      {showUrge && (
        <UrgeFlow c={c} onClose={() => setShowUrge(false)} onResisted={handleUrgeResisted} onGaveIn={handleUrgeGaveIn} />
      )}
      {interventionApp && (
        <LimitIntervention
          c={c} appName={APP_CATALOG.find((a) => a.id === interventionApp.id)?.name} limitMin={interventionApp.limitMin}
          onExit={() => setInterventionApp(null)}
          onExtend={() => { setLimits((prev) => prev.map((l) => (l.id === interventionApp.id ? { ...l, limitMin: l.limitMin + 5 } : l))); setInterventionApp(null); }}
        />
      )}

      {toast && (
        <div style={{
          position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: c.surface2, border: `1px solid ${c.border}`, borderRadius: 12, padding: "10px 16px",
          color: c.text, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", zIndex: 40,
        }}>{toast}</div>
      )}

      <div style={{ display: "flex", borderTop: `1px solid ${c.border}`, background: c.surface, padding: "10px 6px calc(10px + env(safe-area-inset-bottom))" }}>
        {navItems.map((item) => {
          const active = nav === item.id;
          return (
            <div key={item.id} onClick={() => setNav(item.id)} style={{ flex: 1, textAlign: "center", cursor: "pointer", padding: "4px 0" }}>
              <item.icon size={20} color={active ? c.accent : c.faint} style={{ margin: "0 auto", display: "block" }} />
              <div style={{ fontSize: 10, marginTop: 4, color: active ? c.accent : c.faint, fontWeight: active ? 700 : 500 }}>{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* quick test entry for the limit intervention, since real usage can't be simulated */}
      <div
        onClick={() => setInterventionApp(limits.find((l) => l.usedMin >= l.limitMin) || limits[0])}
        style={{ position: "absolute", top: 14, right: 14, fontSize: 10, color: c.faint, cursor: "pointer", opacity: 0.6 }}
      >
        demo: trigger limit
      </div>
    </Shell>
  );
}

function Shell({ c, theme, children }) {
  return (
    <div style={{
      width: "100%", maxWidth: 420, height: "100vh", maxHeight: 860, margin: "0 auto",
      background: c.bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
      fontFamily: BODY_FONT, boxShadow: "0 0 60px rgba(0,0,0,0.5)",
    }}>
      {children}
    </div>
  );
}

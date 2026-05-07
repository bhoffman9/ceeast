import { useState } from "react";

const STORAGE_KEY = "ceeast_auth_v1";
const VALID_DAYS = 30;

export default function PasswordGate({ children }) {
  const correctPassword = import.meta.env.VITE_APP_PASSWORD || "East";
  const [unlocked, setUnlocked] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const { expires } = JSON.parse(raw);
      return expires && Date.now() < expires;
    } catch {
      return false;
    }
  });
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (pw === correctPassword) {
      const expires = Date.now() + VALID_DAYS * 24 * 60 * 60 * 1000;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ expires })); } catch {}
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPw("");
    }
  };

  if (unlocked) return children;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#0b0d10",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'IBM Plex Mono', monospace", color: "#e8eaf0",
    }}>
      <form onSubmit={submit} style={{
        background: "#12151c", border: "2px solid #f47820", borderRadius: 8,
        padding: "40px 36px", width: "100%", maxWidth: 400,
        boxShadow: "0 0 60px rgba(244,120,32,.15)",
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900,
          letterSpacing: 3, textAlign: "center", marginBottom: 4,
        }}>
          <span style={{ color: "#f47820" }}>CE</span><span style={{ color: "#f5c542" }}>EAST</span>
        </div>
        <div style={{
          fontSize: 11, color: "#5a6370", textAlign: "center",
          letterSpacing: 2, textTransform: "uppercase", marginBottom: 24,
        }}>
          Capacity Express East · Authorized Access
        </div>
        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError(false); }}
          placeholder="Password"
          autoFocus
          style={{
            width: "100%", padding: "12px 14px", fontSize: 14,
            background: "#0b0d10",
            border: `2px solid ${error ? "#ff5252" : "#1f2535"}`,
            borderRadius: 6, color: "#e8eaf0", fontFamily: "inherit",
            outline: "none", marginBottom: 12, transition: "border-color .2s",
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: "#ff5252", marginBottom: 12, textAlign: "center" }}>
            Incorrect password
          </div>
        )}
        <button type="submit" style={{
          width: "100%", padding: "12px",
          background: "linear-gradient(135deg,#f47820,#c45e10)",
          border: "none", borderRadius: 6, color: "#fff",
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14,
          fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
          cursor: "pointer",
        }}>
          Unlock
        </button>
        <div style={{ fontSize: 10, color: "#5a6370", textAlign: "center", marginTop: 16 }}>
          Stays unlocked for {VALID_DAYS} days on this device
        </div>
      </form>
    </div>
  );
}

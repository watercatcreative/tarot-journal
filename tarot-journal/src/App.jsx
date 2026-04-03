import { useState, useEffect, useRef } from "react";

const TAROT_CARDS = [
  "The Fool","The Magician","The High Priestess","The Empress","The Emperor",
  "The Hierophant","The Lovers","The Chariot","Strength","The Hermit",
  "Wheel of Fortune","Justice","The Hanged Man","Death","Temperance",
  "The Devil","The Tower","The Star","The Moon","The Sun","Judgement","The World",
  "Ace of Wands","Two of Wands","Three of Wands","Four of Wands","Five of Wands",
  "Six of Wands","Seven of Wands","Eight of Wands","Nine of Wands","Ten of Wands",
  "Page of Wands","Knight of Wands","Queen of Wands","King of Wands",
  "Ace of Cups","Two of Cups","Three of Cups","Four of Cups","Five of Cups",
  "Six of Cups","Seven of Cups","Eight of Cups","Nine of Cups","Ten of Cups",
  "Page of Cups","Knight of Cups","Queen of Cups","King of Cups",
  "Ace of Swords","Two of Swords","Three of Swords","Four of Swords","Five of Swords",
  "Six of Swords","Seven of Swords","Eight of Swords","Nine of Swords","Ten of Swords",
  "Page of Swords","Knight of Swords","Queen of Swords","King of Swords",
  "Ace of Pentacles","Two of Pentacles","Three of Pentacles","Four of Pentacles","Five of Pentacles",
  "Six of Pentacles","Seven of Pentacles","Eight of Pentacles","Nine of Pentacles","Ten of Pentacles",
  "Page of Pentacles","Knight of Pentacles","Queen of Pentacles","King of Pentacles"
];

const STORAGE_KEY = "tarot-journal-entries";

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEntries(entries) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch {}
}

// Symbols for suits and majors
function cardSymbol(card) {
  if (["Wands"].some(s => card.includes(s))) return "🜂";
  if (["Cups"].some(s => card.includes(s))) return "🜄";
  if (["Swords"].some(s => card.includes(s))) return "🜁";
  if (["Pentacles"].some(s => card.includes(s))) return "🜃";
  return "✦";
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ── Reading component (AI-powered) ──────────────────────────────────────────
function ReadingPanel({ card, onSave, onCancel }) {
  const [reading, setReading] = useState("");
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState("");
  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchReading() {
      setLoading(true);
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: `You are a thoughtful, calm tarot reader. Your readings are reflective, poetic but grounded, and personal in tone — never dramatic or overwrought. Write in plain, warm language. No bullet points. No headings. Just 3–4 flowing paragraphs that feel like a quiet conversation. Avoid clichés like "the universe is calling you" or "a journey awaits." Be specific to the card's energy without being prescriptive.`,
            messages: [{ role: "user", content: `I drew ${card} today. Please give me a reading.` }]
          })
        });
        const data = await res.json();
        const text = data.content?.find(b => b.type === "text")?.text || "No reading available.";
        setReading(text);
      } catch {
        setReading("The reading couldn't be fetched right now. Take a moment to sit with the card on your own.");
      }
      setLoading(false);
    }
    fetchReading();
  }, [card]);

  function handleSave() {
    const entry = {
      id: Date.now(),
      card,
      date: dateStr,
      reading,
      reflection,
      createdAt: new Date().toISOString()
    };
    onSave(entry);
    setSaved(true);
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "32px" }}>
        <span style={{ fontSize: "28px", opacity: 0.3 }}>{cardSymbol(card)}</span>
        <h2 style={{ fontSize: "22px", fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, color: "#1a1a1a", margin: 0 }}>{card}</h2>
      </div>

      <div style={{ marginBottom: "32px", minHeight: "120px" }}>
        {loading ? (
          <div style={{ display: "flex", gap: "6px", alignItems: "center", paddingTop: "8px" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: "5px", height: "5px", borderRadius: "50%", background: "#b5a898",
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
        ) : (
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", lineHeight: "1.8",
            color: "#3a3530", margin: 0, whiteSpace: "pre-wrap",
            animation: "fadeUp 0.5s ease both"
          }}>{reading}</p>
        )}
      </div>

      {!loading && !saved && (
        <div style={{ animation: "fadeUp 0.4s 0.2s ease both", opacity: 0, animationFillMode: "forwards" }}>
          <div style={{ borderTop: "1px solid #e8e2db", paddingTop: "28px", marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "11px", letterSpacing: "0.1em", color: "#9a8f85", textTransform: "uppercase", marginBottom: "10px" }}>
              Your reflection
            </label>
            <textarea
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="What does this bring up for you today?"
              rows={4}
              style={{
                width: "100%", boxSizing: "border-box", border: "none", borderBottom: "1px solid #d4cdc5",
                background: "transparent", resize: "none", fontFamily: "'Cormorant Garamond', serif",
                fontSize: "16px", color: "#2a2520", lineHeight: "1.7", padding: "8px 0",
                outline: "none", caretColor: "#8a7060"
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <label style={{ fontSize: "11px", letterSpacing: "0.1em", color: "#9a8f85", textTransform: "uppercase" }}>Date</label>
            <input
              type="date"
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              style={{
                border: "none", borderBottom: "1px solid #d4cdc5", background: "transparent",
                fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", color: "#2a2520",
                padding: "4px 0", outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={handleSave} style={{
              background: "#2a2520", color: "#f5f0eb", border: "none", padding: "10px 24px",
              fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", cursor: "pointer",
              letterSpacing: "0.05em"
            }}>Save to journal</button>
            <button onClick={onCancel} style={{
              background: "transparent", color: "#9a8f85", border: "none", padding: "10px 16px",
              fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", cursor: "pointer"
            }}>Cancel</button>
          </div>
        </div>
      )}

      {saved && (
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", color: "#8a7060", animation: "fadeUp 0.3s ease both" }}>
          Saved. ✦
        </p>
      )}
    </div>
  );
}

// ── Log view ────────────────────────────────────────────────────────────────
function LogView({ entries }) {
  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  const [open, setOpen] = useState(null);

  if (!entries.length) return (
    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", color: "#b5a898", paddingTop: "40px" }}>
      No entries yet. Draw your first card.
    </p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {sorted.map(e => (
        <div key={e.id}>
          <div
            onClick={() => setOpen(open === e.id ? null : e.id)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              padding: "18px 0", borderBottom: "1px solid #e8e2db", cursor: "pointer",
              transition: "opacity 0.15s"
            }}
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
              <span style={{ fontSize: "14px", color: "#c5b8ac" }}>{cardSymbol(e.card)}</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", color: "#2a2520" }}>{e.card}</span>
            </div>
            <span style={{ fontSize: "12px", color: "#b5a898", letterSpacing: "0.05em" }}>{formatDate(e.date)}</span>
          </div>
          {open === e.id && (
            <div style={{ padding: "20px 0 24px", borderBottom: "1px solid #e8e2db", animation: "fadeUp 0.25s ease both" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", lineHeight: "1.75", color: "#3a3530", margin: "0 0 16px", whiteSpace: "pre-wrap" }}>{e.reading}</p>
              {e.reflection && (
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", lineHeight: "1.7", color: "#7a6f65", margin: 0, borderLeft: "2px solid #d4cdc5", paddingLeft: "16px", fontStyle: "italic" }}>
                  {e.reflection}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Insights view ───────────────────────────────────────────────────────────
function InsightsView({ entries }) {
  const [search, setSearch] = useState("");

  const freq = entries.reduce((acc, e) => {
    acc[e.card] = (acc[e.card] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const max = sorted[0]?.[1] || 1;

  const filtered = search.trim()
    ? entries.filter(e =>
        e.card.toLowerCase().includes(search.toLowerCase()) ||
        e.reflection?.toLowerCase().includes(search.toLowerCase())
      ).sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  if (!entries.length) return (
    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", color: "#b5a898", paddingTop: "40px" }}>
      Your patterns will appear here once you have a few entries.
    </p>
  );

  return (
    <div>
      <div style={{ marginBottom: "40px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9a8f85", marginBottom: "20px" }}>
          Most frequent cards
        </p>
        {sorted.map(([card, count]) => (
          <div key={card} style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", color: "#2a2520" }}>{card}</span>
              <span style={{ fontSize: "12px", color: "#b5a898" }}>{count}×</span>
            </div>
            <div style={{ height: "2px", background: "#ede8e2", borderRadius: "1px" }}>
              <div style={{ height: "2px", background: "#8a7060", borderRadius: "1px", width: `${(count / max) * 100}%`, transition: "width 0.6s ease" }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #e8e2db", paddingTop: "32px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9a8f85", marginBottom: "14px" }}>Search</p>
        <input
          type="text"
          placeholder="Card name or keyword..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box", border: "none", borderBottom: "1px solid #d4cdc5",
            background: "transparent", fontFamily: "'Cormorant Garamond', serif", fontSize: "16px",
            color: "#2a2520", padding: "6px 0", outline: "none", marginBottom: "24px"
          }}
        />
        {search && filtered.length === 0 && (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", color: "#b5a898" }}>No results.</p>
        )}
        {filtered.map(e => (
          <div key={e.id} style={{ borderBottom: "1px solid #e8e2db", padding: "14px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", color: "#2a2520" }}>{e.card}</span>
              <span style={{ fontSize: "12px", color: "#b5a898" }}>{formatDate(e.date)}</span>
            </div>
            {e.reflection && (
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "14px", color: "#7a6f65", margin: 0, fontStyle: "italic" }}>
                {e.reflection.slice(0, 120)}{e.reflection.length > 120 ? "…" : ""}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main app ─────────────────────────────────────────────────────────────────
export default function TarotJournal() {
  const [view, setView] = useState("today"); // today | log | insights
  const [entries, setEntries] = useState(loadEntries);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [reading, setReading] = useState(false);
  const inputRef = useRef();

  function handleQuery(val) {
    setQuery(val);
    if (val.length > 1) {
      setSuggestions(TAROT_CARDS.filter(c => c.toLowerCase().includes(val.toLowerCase())).slice(0, 6));
    } else {
      setSuggestions([]);
    }
  }

  function selectCard(card) {
    setSelectedCard(card);
    setQuery(card);
    setSuggestions([]);
    setReading(true);
  }

  function handleSave(entry) {
    const next = [entry, ...entries];
    setEntries(next);
    saveEntries(next);
  }

  function reset() {
    setSelectedCard(null);
    setQuery("");
    setReading(false);
    setSuggestions([]);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f7f3ee; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        textarea::placeholder, input::placeholder { color: #c5b8ac; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.3; cursor: pointer; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4cdc5; border-radius: 2px; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#f7f3ee", display: "flex",
        justifyContent: "center", padding: "0 20px"
      }}>
        <div style={{ width: "100%", maxWidth: "560px", paddingBottom: "60px" }}>

          {/* Header */}
          <div style={{ padding: "48px 0 40px", borderBottom: "1px solid #e0d9d0" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
              <span style={{ fontSize: "18px", color: "#c5b8ac" }}>✦</span>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "28px", color: "#1a1510", letterSpacing: "0.02em" }}>
                Tarot Journal
              </h1>
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "12px", color: "#b5a898", letterSpacing: "0.1em", textTransform: "uppercase", paddingLeft: "28px" }}>
              Daily draws · Readings · Patterns
            </p>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #e0d9d0", marginBottom: "36px" }}>
            {[["today", "Today"], ["log", "Log"], ["insights", "Insights"]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setView(key); reset(); }}
                style={{
                  background: "transparent", border: "none", padding: "16px 20px 14px",
                  fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "12px",
                  letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                  color: view === key ? "#2a2520" : "#b5a898",
                  borderBottom: view === key ? "1px solid #2a2520" : "1px solid transparent",
                  marginBottom: "-1px", transition: "color 0.2s"
                }}
              >{label}</button>
            ))}
          </div>

          {/* Today view */}
          {view === "today" && !reading && (
            <div style={{ animation: "fadeUp 0.4s ease both" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", color: "#5a4e45", lineHeight: "1.6", marginBottom: "32px" }}>
                Which card did you draw today?
              </p>
              <div style={{ position: "relative" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => handleQuery(e.target.value)}
                  placeholder="Start typing a card name..."
                  style={{
                    width: "100%", border: "none", borderBottom: "1px solid #c5b8ac",
                    background: "transparent", fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "20px", color: "#1a1510", padding: "8px 0", outline: "none",
                    caretColor: "#8a7060"
                  }}
                />
                {suggestions.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0,
                    background: "#faf7f3", border: "1px solid #e8e2db",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.06)", zIndex: 10, marginTop: "4px"
                  }}>
                    {suggestions.map(s => (
                      <div
                        key={s}
                        onClick={() => selectCard(s)}
                        style={{
                          padding: "12px 16px", fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "17px", color: "#2a2520", cursor: "pointer",
                          borderBottom: "1px solid #ede8e2", display: "flex",
                          gap: "12px", alignItems: "center",
                          transition: "background 0.1s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0ebe4"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{ color: "#c5b8ac", fontSize: "13px" }}>{cardSymbol(s)}</span>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "today" && reading && selectedCard && (
            <ReadingPanel card={selectedCard} onSave={handleSave} onCancel={reset} />
          )}

          {view === "log" && <LogView entries={entries} />}
          {view === "insights" && <InsightsView entries={entries} />}

        </div>
      </div>
    </>
  );
}

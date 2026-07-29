import { useState, useEffect, useCallback, useRef } from "react";

interface MatchRecord {
  winner: string;
  loser: string;
  timestamp: number;
}

type Phase = "fighting" | "results";

interface PersistedState {
  queue: string[];
  champion: string | null;
  challenger: string | null;
  history: MatchRecord[];
  phase: Phase;
}

type ToastType = "success" | "error" | "info";

interface RankedPilot {
  name: string;
  wins: number;
  losses: number;
  winRate: number;
}

const STORAGE_KEY = "ev71-dogfight-state";

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (
        Array.isArray(p.queue) &&
        Array.isArray(p.history) &&
        (p.champion === null || typeof p.champion === "string") &&
        (p.challenger === null || typeof p.challenger === "string")
      ) {
        return p;
      }
    }
  } catch {}
  return { queue: ["Alex", "Bianca", "Carlos", "Diana"], champion: null, challenger: null, history: [], phase: "fighting" };
}

function computeRecords(history: MatchRecord[]): Record<string, { wins: number; losses: number }> {
  const map: Record<string, { wins: number; losses: number }> = {};
  for (const m of history) {
    if (!map[m.winner]) map[m.winner] = { wins: 0, losses: 0 };
    if (!map[m.loser]) map[m.loser] = { wins: 0, losses: 0 };
    map[m.winner].wins++;
    map[m.loser].losses++;
  }
  return map;
}

function getRanked(history: MatchRecord[], allPilots: string[]): RankedPilot[] {
  const records = computeRecords(history);
  return allPilots
    .map((name) => {
      const rec = records[name] || { wins: 0, losses: 0 };
      const total = rec.wins + rec.losses;
      return {
        name,
        wins: rec.wins,
        losses: rec.losses,
        winRate: total > 0 ? Math.round((rec.wins / total) * 100) : 0,
      };
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.winRate - a.winRate;
    });
}

function computeStreaks(history: MatchRecord[], pilots: string[]): Record<string, { type: "win" | "loss"; count: number } | null> {
  const seqs: Record<string, ("win" | "loss")[]> = {};
  for (const p of pilots) seqs[p] = [];
  for (const m of history) {
    if (seqs[m.winner]) seqs[m.winner].push("win");
    if (seqs[m.loser]) seqs[m.loser].push("loss");
  }
  const result: Record<string, { type: "win" | "loss"; count: number } | null> = {};
  for (const p of pilots) {
    const seq = seqs[p] || [];
    if (seq.length === 0) {
      result[p] = null;
      continue;
    }
    const last = seq[seq.length - 1];
    let count = 1;
    for (let i = seq.length - 2; i >= 0; i--) {
      if (seq[i] === last) count++;
      else break;
    }
    result[p] = { type: last, count };
  }
  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generatePodiumImage(ranked: RankedPilot[], dateStr: string): Promise<Blob> {
  const W = 800;
  const H = 620;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0A0E17";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#E8B25C";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  ctx.fillStyle = "#E8B25C";
  ctx.font = "bold 34px Oswald";
  ctx.textAlign = "center";
  ctx.fillText("DOGFIGHT — ESCUADRON 71", W / 2, 65);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px Roboto";
  ctx.fillText(dateStr, W / 2, 90);

  const top3 = ranked.slice(0, 3);
  const steps = [
    { x: W / 2, baseY: 300, h: 220, label: "1°" },
    { x: W / 2 - 150, baseY: 310, h: 160, label: "2°" },
    { x: W / 2 + 150, baseY: 320, h: 130, label: "3°" },
  ];
  const medals = ["🥇", "🥈", "🥉"];
  const colors = ["#E8B25C", "#94a3b8", "#CD7F32"];

  top3.forEach((p, i) => {
    const s = steps[i];
    const cy = s.baseY - s.h + 40;

    ctx.fillStyle = colors[i];
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.roundRect(s.x - 55, cy, 110, s.h - 40, 12);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = colors[i];
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(s.x - 55, cy, 110, s.h - 40, 12);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.font = "40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(medals[i], s.x, cy + 30);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Oswald";
    ctx.fillText(p.name.toUpperCase(), s.x, cy + 70);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px Roboto";
    ctx.fillText(`${p.wins}V ${p.losses}D  —  ${p.winRate}% efectividad`, s.x, cy + 98);

    ctx.fillStyle = colors[i];
    ctx.font = "bold 13px Oswald";
    ctx.fillText(s.label, s.x, cy - 10);
  });

  if (ranked.length > 3) {
    const tableY = 380;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, tableY);
    ctx.lineTo(W - 80, tableY);
    ctx.stroke();

    const cols = [80, 150, 400, 450, 500];
    const headers = ["#", "PILOTO", "V", "D", "EFECT."];
    ctx.fillStyle = "#E8B25C";
    ctx.font = "bold 12px Oswald";
    ctx.textAlign = "left";
    headers.forEach((h, i) => ctx.fillText(h, cols[i], tableY + 24));

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    ctx.moveTo(80, tableY + 30);
    ctx.lineTo(W - 80, tableY + 30);
    ctx.stroke();

    ranked.slice(3).forEach((p, i) => {
      const y = tableY + 52 + i * 26;
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)";
      ctx.font = "13px Roboto";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 4}`, cols[0], y);
      ctx.fillText(p.name, cols[1], y);
      ctx.fillText(`${p.wins}`, cols[2], y);
      ctx.fillText(`${p.losses}`, cols[3], y);
      ctx.fillText(`${p.winRate}%`, cols[4], y);
    });
  }

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.font = "11px Roboto";
  ctx.textAlign = "center";
  ctx.fillText("escuadron71.co", W / 2, H - 35);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!)));
}

export default function DogfightApp() {
  const [queue, setQueue] = useState<string[]>(() => loadState().queue);
  const [champion, setChampion] = useState<string | null>(() => loadState().champion);
  const [challenger, setChallenger] = useState<string | null>(() => loadState().challenger);
  const [history, setHistory] = useState<MatchRecord[]>(() => loadState().history);
  const [phase, setPhase] = useState<Phase>(() => loadState().phase);
  const [inputValue, setInputValue] = useState("");
  const [toast, setToast] = useState<{ text: string; type: ToastType } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const dragSource = useRef<{ zone: string; index: number; name: string } | null>(null);

  const showToast = useCallback((text: string, type: ToastType = "info") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ queue, champion, challenger, history, phase })
    );
  }, [queue, champion, challenger, history, phase]);

  const allPilots = Array.from(
    new Set([...queue, ...(champion ? [champion] : []), ...(challenger ? [challenger] : [])])
  );

  const records = computeRecords(history);
  const streaks = computeStreaks(history, allPilots);
  const ranked = getRanked(history, allPilots);

  const addPilot = () => {
    const name = inputValue.trim();
    if (!name) { showToast("Escribe un callsign", "error"); return; }
    if (allPilots.includes(name)) { showToast(`"${name}" ya esta en la sesion`, "error"); setInputValue(""); return; }
    setQueue((prev) => [...prev, name]);
    setInputValue("");
    showToast(`${name} agregado`, "success");
  };

  const removePilot = (name: string) => {
    setQueue((prev) => prev.filter((p) => p !== name));
    if (champion === name) setChampion(null);
    if (challenger === name) setChallenger(null);
    setHistory((h) => h.filter((m) => m.winner !== name && m.loser !== name));
  };

  const selectForMatch = (name: string) => {
    if (!champion && !challenger) {
      setChampion(name);
      setQueue((prev) => prev.filter((p) => p !== name));
      showToast(`${name} es el primer campeon`, "success");
      return;
    }
    if (name === champion || name === challenger) return;
    if (champion && !challenger) {
      setChallenger(name);
      setQueue((prev) => prev.filter((p) => p !== name));
      return;
    }
    if (challenger) {
      setQueue((prev) => [...prev, challenger!]);
    }
    setChallenger(name);
    setQueue((prev) => prev.filter((p) => p !== name));
  };

  const sendToQueue = (zone: "champion" | "challenger") => {
    if (zone === "champion" && champion) {
      setQueue((prev) => [...prev, champion]);
      setChampion(null);
      if (queue.length > 0) {
        const next = queue[0];
        setQueue((prev) => prev.filter((p) => p !== next));
        setChampion(next);
      }
    }
    if (zone === "challenger" && challenger) {
      setQueue((prev) => [...prev, challenger]);
      setChallenger(null);
    }
  };

  const autoNextChallenger = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue((prev) => prev.filter((p) => p !== next));
      setChallenger(next);
    }
  };

  const handleWin = () => {
    if (!champion || !challenger) return;
    const winner = champion;
    const loser = challenger;
    setHistory((h) => [...h, { winner, loser, timestamp: Date.now() }]);
    setChallenger(null);
    setQueue((prev) => [...prev, loser]);
    showToast(`${winner} derribo a ${loser}`, "success");
    setTimeout(() => autoNextChallenger(), 100);
  };

  const handleLose = () => {
    if (!champion || !challenger) return;
    const winner = challenger;
    const loser = champion;
    setHistory((h) => [...h, { winner, loser, timestamp: Date.now() }]);
    setChampion(challenger);
    setChallenger(null);
    setQueue((prev) => [...prev, loser]);
    showToast(`${winner} es el nuevo campeon!`, "success");
    setTimeout(() => autoNextChallenger(), 100);
  };

  const calculateResults = () => {
    if (history.length === 0) {
      showToast("No hay combates registrados", "error");
      return;
    }
    setPhase("results");
    showToast("Resultados calculados", "success");
  };

  const downloadPng = async () => {
    try {
      const blob = await generatePodiumImage(
        ranked,
        formatDate(new Date())
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dogfight-ranking-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Imagen descargada", "success");
    } catch {
      showToast("Error al generar la imagen", "error");
    }
  };

  const newSession = () => {
    setQueue([]);
    setChampion(null);
    setChallenger(null);
    setHistory([]);
    setPhase("fighting");
    localStorage.removeItem(STORAGE_KEY);
    showToast("Nueva sesion lista", "info");
  };

  const handleDragStart = (zone: string, index: number, name: string) => {
    dragSource.current = { zone, index, name };
  };

  const handleQueueDrop = (targetIndex: number) => {
    const src = dragSource.current;
    if (!src) return;
    if (src.zone === "queue") {
      setQueue((prev) => {
        const next = [...prev];
        const [item] = next.splice(src.index, 1);
        const adj = src.index < targetIndex ? targetIndex - 1 : targetIndex;
        next.splice(Math.min(adj, next.length), 0, item);
        return next;
      });
    } else if (src.zone === "champion" && src.name) {
      setChampion(null);
      setQueue((prev) => {
        const next = [...prev];
        next.splice(Math.min(targetIndex, next.length), 0, src.name);
        return next;
      });
    } else if (src.zone === "challenger" && src.name) {
      setChallenger(null);
      setQueue((prev) => {
        const next = [...prev];
        next.splice(Math.min(targetIndex, next.length), 0, src.name);
        return next;
      });
    }
    dragSource.current = null;
    setDragOverIndex(null);
  };

  const handleSlotDrop = (slot: "champion" | "challenger") => {
    const src = dragSource.current;
    if (!src) return;
    if (src.zone === "queue") {
      const pilot = src.name;
      if (slot === "champion") {
        setQueue((prev) => prev.filter((p) => p !== pilot));
        if (champion) setQueue((prev) => [...prev, champion!]);
        setChampion(pilot);
      } else {
        setQueue((prev) => prev.filter((p) => p !== pilot));
        if (challenger) setQueue((prev) => [...prev, challenger!]);
        setChallenger(pilot);
      }
    } else if (src.zone === "champion" && slot === "challenger" && src.name) {
      setChampion(challenger);
      setChallenger(src.name);
    } else if (src.zone === "challenger" && slot === "champion" && src.name) {
      setChallenger(champion);
      setChampion(src.name);
    }
    dragSource.current = null;
    setDragOverIndex(null);
  };

  const renderToast = () =>
    toast && (
      <div className={`dogfight-toast dogfight-toast--${toast.type}`} role="alert">
        {toast.text}
      </div>
    );

  if (phase === "results") {
    const top3 = ranked.slice(0, 3);
    const rest = ranked.slice(3);
    const dateStr = formatDate(new Date());

    return (
      <div className="dogfight-app">
        {renderToast()}

        <div className="dogfight-header">
          <h1 className="dogfight-title">Resultados</h1>
          <p className="dogfight-subtitle">
            Ranking final de la sesion de Dogfight &mdash; {dateStr}
          </p>
        </div>

        <div className="podium">
          {top3.length >= 2 && (
            <div className="podium__step podium__step--2">
              <span className="podium__medal">🥈</span>
              <span className="podium__pos">2°</span>
              <span className="podium__name">{top3[1].name}</span>
              <span className="podium__record">{top3[1].wins}V {top3[1].losses}D</span>
              <span className="podium__wr">{top3[1].winRate}%</span>
            </div>
          )}
          {top3.length >= 1 && (
            <div className="podium__step podium__step--1">
              <span className="podium__medal">🥇</span>
              <span className="podium__pos">1°</span>
              <span className="podium__name">{top3[0].name}</span>
              <span className="podium__record">{top3[0].wins}V {top3[0].losses}D</span>
              <span className="podium__wr">{top3[0].winRate}%</span>
            </div>
          )}
          {top3.length >= 3 && (
            <div className="podium__step podium__step--3">
              <span className="podium__medal">🥉</span>
              <span className="podium__pos">3°</span>
              <span className="podium__name">{top3[2].name}</span>
              <span className="podium__record">{top3[2].wins}V {top3[2].losses}D</span>
              <span className="podium__wr">{top3[2].winRate}%</span>
            </div>
          )}
        </div>

        {rest.length > 0 && (
          <div className="dogfight-table-wrap results-table">
            <table className="dogfight-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Piloto</th>
                  <th>V</th>
                  <th>D</th>
                  <th>Efectividad</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((p, i) => (
                  <tr key={p.name}>
                    <td className="dogfight-cell--rank"><span>{i + 4}</span></td>
                    <td className="dogfight-cell--name"><span className="dogfight-pilot">{p.name}</span></td>
                    <td>{p.wins}</td>
                    <td>{p.losses}</td>
                    <td className="dogfight-cell--stats">
                      <div className="dogfight-winrate">
                        <div className="dogfight-bar">
                          <div className="dogfight-bar-fill" style={{ width: `${p.winRate}%` }} />
                        </div>
                        <span className="dogfight-winrate-text">{p.winRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="dogfight-footer">
          <button onClick={downloadPng} className="btn dogfight-btn--primary">
            Descargar PNG
          </button>
          <button onClick={newSession} className="dogfight-btn--reset">
            Nueva Sesion
          </button>
        </div>
      </div>
    );
  }

  const champRec = champion ? records[champion] || { wins: 0, losses: 0 } : null;
  const chalRec = challenger ? records[challenger] || { wins: 0, losses: 0 } : null;
  const champStreak = champion ? streaks[champion] : null;
  const chalStreak = challenger ? streaks[challenger] : null;

  return (
    <div className="dogfight-app">
      {renderToast()}

      <div className="dogfight-header">
        <div className="dogfight-title-row">
          <h1 className="dogfight-title">Dogfight</h1>
          <button
            className="dogfight-help-toggle"
            onClick={() => setShowHelp((p) => !p)}
            aria-label="Como funciona"
          >
            {showHelp ? "✕" : "?"}
          </button>
        </div>
        <p className="dogfight-subtitle">
          King of the Hill &mdash; el campeon vuela hasta que lo derriban.
          Arrastra la cola para reordenar, haz clic para retar.
        </p>
      </div>

      {showHelp && (
        <div className="dogfight-help-panel">
          <div className="dogfight-help-grid">
            <div className="dogfight-help-col">
              <h4>Como funciona</h4>
              <ol>
                <li>Anade pilotos a la cola de espera</li>
                <li>Haz clic en un piloto para retar al campeon</li>
                <li>
                  <strong>GANO</strong> &rarr; el campeon retiene el titulo
                </li>
                <li>
                  <strong>PERDIO</strong> &rarr; el retador es el nuevo as
                </li>
                <li>El siguiente de la cola se asigna automaticamente</li>
                <li>
                  Al final presiona <strong>Calcular Ganadores</strong>
                </li>
              </ol>
            </div>
            <div className="dogfight-help-col">
              <h4>Consejos</h4>
              <ul>
                <li>Arrastra la cola para reordenar los pilotos</li>
                <li>Usa &larr;&hyphen; para enviar a alguien de vuelta a la cola</li>
                <li>El campeon vuela hasta que lo derriban (sin limite)</li>
                <li>Todo se guarda automaticamente en tu navegador</li>
                <li>
                  "Nueva Sesion" para empezar la competencia siguiente
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="dogfight-controls">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addPilot(); }}
          placeholder="Callsign del piloto..."
          className="dogfight-input"
        />
        <button onClick={addPilot} className="btn dogfight-btn--primary">
          Anadir
        </button>
        <button onClick={newSession} className="dogfight-btn--reset">
          Nueva Sesion
        </button>
      </div>

      <div className="dogfight-queue-label">
        <span>Cola de espera</span>
        <small>{queue.length} piloto{queue.length !== 1 ? "s" : ""}</small>
      </div>
      <div className="dogfight-queue">
        {queue.length === 0 ? (
          <div className="dogfight-queue-empty">
            <span>Sin pilotos en espera</span>
            <small>Anade pilotos o arrastra aqui al campeon/retador</small>
          </div>
        ) : (
          queue.map((name, i) => (
            <div
              key={name}
              draggable
              onDragStart={() => handleDragStart("queue", i, name)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
              onDragLeave={() => { if (dragOverIndex === i) setDragOverIndex(null); }}
              onDrop={(e) => { e.preventDefault(); handleQueueDrop(i); }}
              onClick={() => selectForMatch(name)}
              className={`dogfight-queue-item ${dragOverIndex === i ? "dogfight-queue-item--over" : ""}`}
            >
              <span className="dogfight-queue-grip">⠿</span>
              <span>{name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removePilot(name); }}
                className="dogfight-queue-remove"
                title="Eliminar piloto"
              >
                &times;
              </button>
            </div>
          ))
        )}
        <div
          className="dogfight-queue-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleQueueDrop(queue.length); }}
        >
          {dragOverIndex === queue.length && <span className="dogfight-queue-indicator">Soltar aqui</span>}
        </div>
      </div>

      <div className="dogfight-match">
        <div
          className={`dogfight-slot dogfight-slot--champion ${!champion ? "dogfight-slot--empty" : ""}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleSlotDrop("champion"); }}
        >
          {champion ? (
            <>
              <div className="dogfight-slot-header">
                <span className="dogfight-slot-badge">CAMPEON</span>
                <button
                  onClick={() => sendToQueue("champion")}
                  className="dogfight-slot-back"
                  title="Enviar a la cola"
                >
                  ↩
                </button>
              </div>
              <span
                className="dogfight-slot-name"
                draggable
                onDragStart={() => handleDragStart("champion", -1, champion)}
              >
                {champion}
              </span>
              {champRec && (
                <span className="dogfight-slot-record">
                  {champRec.wins}V {champRec.losses}D
                  {champStreak && (
                    <span className={`dogfight-streak dogfight-streak--${champStreak.type}`}>
                      {" "}{champStreak.count}{champStreak.type === "win" ? "V" : "D"}
                    </span>
                  )}
                </span>
              )}
            </>
          ) : (
            <div className="dogfight-slot-empty-text">
              <span className="dogfight-slot-badge">CAMPEON</span>
              <span>Arrastra un piloto aqui</span>
              <small>o haz clic en la cola</small>
            </div>
          )}
        </div>

        <div className="dogfight-vs-divider">
          <span className="dogfight-vs-badge">VS</span>
        </div>

        <div
          className={`dogfight-slot dogfight-slot--challenger ${!challenger ? "dogfight-slot--empty" : ""}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleSlotDrop("challenger"); }}
        >
          {challenger ? (
            <>
              <div className="dogfight-slot-header">
                <span className="dogfight-slot-badge">RETADOR</span>
                <button
                  onClick={() => sendToQueue("challenger")}
                  className="dogfight-slot-back"
                  title="Enviar a la cola"
                >
                  ↩
                </button>
              </div>
              <span
                className="dogfight-slot-name"
                draggable
                onDragStart={() => handleDragStart("challenger", -1, challenger)}
              >
                {challenger}
              </span>
              {chalRec && (
                <span className="dogfight-slot-record">
                  {chalRec.wins}V {chalRec.losses}D
                  {chalStreak && (
                    <span className={`dogfight-streak dogfight-streak--${chalStreak.type}`}>
                      {" "}{chalStreak.count}{chalStreak.type === "win" ? "V" : "D"}
                    </span>
                  )}
                </span>
              )}
            </>
          ) : (
            <div className="dogfight-slot-empty-text">
              <span className="dogfight-slot-badge">RETADOR</span>
              <span>Arrastra un piloto aqui</span>
              <small>o haz clic en la cola</small>
            </div>
          )}
        </div>
      </div>

      {champion && challenger && (
        <div className="dogfight-match-actions">
          <button onClick={handleWin} className="dogfight-btn--win">
            GANO — {champion}
          </button>
          <button onClick={handleLose} className="dogfight-btn--lose">
            PERDIO — {champion}
          </button>
        </div>
      )}

      {(!champion || !challenger) && (
        <div className="dogfight-match-waiting">
          Selecciona un piloto de la cola para iniciar el combate
        </div>
      )}

      {history.length > 0 && (
        <div className="dogfight-history">
          <div className="dogfight-history-label">Historial de combates</div>
          <div className="dogfight-history-list">
            {[...history].reverse().slice(0, 10).map((m, i) => (
              <div key={m.timestamp} className="dogfight-history-item">
                <span className="dogfight-history-icon">⚔</span>
                <span className="dogfight-history-winner">{m.winner}</span>
                <span className="dogfight-history-vs">vencio a</span>
                <span className="dogfight-history-loser">{m.loser}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="dogfight-footer">
          <button onClick={calculateResults} className="btn dogfight-btn--primary">
            Calcular Ganadores
          </button>
        </div>
      )}
    </div>
  );
}

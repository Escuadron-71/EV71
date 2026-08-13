import { useEffect, useState } from "react";
import type { KneeboardCard } from "@/lib/planner/kneeboard";
import {
  KNEEDARK,
  KNEE_PANEL,
  KNEE_GOLD,
  KNEE_TEXT,
  KNEE_DIM,
} from "@/lib/planner/kneeboard";

interface KneeboardExportProps {
  open: boolean;
  onClose: () => void;
  cards: KneeboardCard[];
}

interface RenderedCard {
  id: string;
  title: string;
  url: string;
}

const SIZE = 512;
const PAD = 26;
const HEADER_H = 64;

function fontFor(fontSize: number, bold: boolean): string {
  return `${bold ? "bold " : ""}${fontSize}px Roboto, Arial, sans-serif`;
}

function measureSegments(
  ctx: CanvasRenderingContext2D,
  segments: KneeboardCard["lines"][number]["segments"],
  fontSize: number
): number {
  let width = 0;
  for (const s of segments) {
    ctx.font = fontFor(fontSize, s.bold ?? false);
    width += ctx.measureText(s.text).width;
  }
  return width;
}

function drawSegments(
  ctx: CanvasRenderingContext2D,
  segments: KneeboardCard["lines"][number]["segments"],
  fontSize: number,
  x: number,
  baseline: number
): void {
  let cursor = x;
  for (const s of segments) {
    ctx.font = fontFor(fontSize, s.bold ?? false);
    ctx.fillStyle = s.color ?? KNEE_TEXT;
    ctx.fillText(s.text, cursor, baseline);
    cursor += ctx.measureText(s.text).width;
  }
}

function drawCard(ctx: CanvasRenderingContext2D, card: KneeboardCard): void {
  ctx.fillStyle = KNEEDARK;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.fillStyle = KNEE_PANEL;
  ctx.fillRect(0, 0, SIZE, HEADER_H);
  ctx.fillStyle = KNEE_GOLD;
  ctx.fillRect(0, HEADER_H, SIZE, 3);

  ctx.textBaseline = "middle";
  ctx.fillStyle = KNEE_GOLD;
  ctx.font = "bold 20px Oswald, 'Arial Narrow', sans-serif";
  ctx.fillText(card.title, PAD, 26);
  if (card.subtitle) {
    ctx.fillStyle = KNEE_DIM;
    ctx.font = "12px Roboto, Arial, sans-serif";
    ctx.fillText(card.subtitle, PAD, 47);
  }

  const textWidth = SIZE - PAD * 2;
  const textHeight = SIZE - HEADER_H - PAD - 36;
  let fontSize = 16;
  for (let attempt = 0; attempt < 80; attempt++) {
    let maxWidth = 0;
    const totalHeight = card.lines.length * fontSize * 1.5;
    for (const ln of card.lines) {
      const w = measureSegments(ctx, ln.segments, fontSize);
      if (w > maxWidth) maxWidth = w;
    }
    if (maxWidth <= textWidth && totalHeight <= textHeight) break;
    fontSize -= 0.5;
  }
  fontSize = Math.max(fontSize, 8);

  let y = HEADER_H + 26;
  for (const ln of card.lines) {
    drawSegments(ctx, ln.segments, fontSize, PAD, y + fontSize * 0.35);
    y += fontSize * 1.5;
  }
}

function renderCardToDataUrl(card: KneeboardCard): string {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  drawCard(ctx, card);
  return canvas.toDataURL("image/png");
}

export default function KneeboardExport({
  open,
  onClose,
  cards,
}: KneeboardExportProps) {
  const [rendered, setRendered] = useState<RenderedCard[]>([]);

  useEffect(() => {
    if (!open) {
      setRendered([]);
      return;
    }
    setRendered(cards.map((c) => ({ id: c.id, title: c.title, url: renderCardToDataUrl(c) })));
  }, [open, cards]);

  if (!open) return null;

  const download = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadAll = () => {
    rendered.forEach((r, i) => {
      window.setTimeout(
        () => download(r.url, `ev71-kneeboard-${String(i + 1).padStart(2, "0")}.png`),
        i * 200
      );
    });
  };

  return (
    <div
      className="planner-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="planner-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Kneeboard"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="planner-modal-head">
          <h3>Kneeboard — {rendered.length} card{rendered.length === 1 ? "" : "s"}</h3>
          <p>
            Imágenes PNG 512×512 listas para el kneeboard de DCS. Copialas a{" "}
            <code>DCS World\Mods\aircraft\&lt;módulo&gt;\Kneeboard\</code>
          </p>
          <div className="planner-modal-actions">
            <button
              type="button"
              className="planner-modal-btn planner-modal-btn--primary"
              onClick={downloadAll}
              disabled={rendered.length === 0}
            >
              Descargar todas
            </button>
            <button type="button" className="planner-modal-btn" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
        <div className="planner-kneeboard-grid">
          {rendered.map((r) => (
            <figure key={r.id} className="planner-kneeboard-card">
              <img src={r.url} alt={`Card ${r.title}`} width={256} height={256} />
              <figcaption>
                <span>{r.title}</span>
                <button
                  type="button"
                  className="planner-modal-btn planner-modal-btn--small"
                  onClick={() => download(r.url, `ev71-kneeboard-${r.id}.png`)}
                >
                  Descargar
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

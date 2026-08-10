import { useState } from "react";
import ReorderableList from "@/islands/planner/widgets/ReorderableList";
import type { BrevityEntry } from "@/lib/planner/plugins/brevity";

interface BrevityListProps {
  codes: BrevityEntry[];
  onChange: (next: BrevityEntry[]) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export default function BrevityList({ codes, onChange }: BrevityListProps) {
  const [code, setCode] = useState("");
  const [meaning, setMeaning] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editMeaning, setEditMeaning] = useState("");

  const validate = (c: string, m: string): string | null => {
    if (!c.trim()) return "Ingresa el codigo brevity";
    if (!m.trim()) return "Ingresa el significado";
    return null;
  };

  const add = () => {
    const err = validate(code, meaning);
    if (err) {
      setError(err);
      return;
    }
    onChange([
      ...codes,
      { id: uid(), code: code.trim().toUpperCase(), meaning: meaning.trim() },
    ]);
    setCode("");
    setMeaning("");
    setError(null);
  };

  const remove = (id: string) => {
    onChange(codes.filter((c) => c.id !== id));
  };

  const startEdit = (entry: BrevityEntry) => {
    setEditingId(entry.id);
    setEditCode(entry.code);
    setEditMeaning(entry.meaning);
    setError(null);
  };

  const saveEdit = (id: string) => {
    const err = validate(editCode, editMeaning);
    if (err) {
      setError(err);
      return;
    }
    onChange(
      codes.map((c) =>
        c.id === id
          ? {
              ...c,
              code: editCode.trim().toUpperCase(),
              meaning: editMeaning.trim(),
            }
          : c,
      ),
    );
    setEditingId(null);
  };

  return (
    <div className="planner-list">
      <div className="planner-list-add">
        <input
          placeholder="Codigo (ej. BINGO)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          aria-label="Codigo brevity"
        />
        <input
          placeholder="Significado"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          aria-label="Significado del codigo"
        />
        <button onClick={add} title="Agregar codigo">
          Agregar
        </button>
      </div>
      {error && <p className="planner-list-error">{error}</p>}
      {codes.length === 0 ? (
        <div className="planner-empty">
          <span>Sin codigos</span>
          <small>Agrega un codigo brevity de referencia</small>
        </div>
      ) : (
        <ReorderableList
          items={codes}
          onReorder={onChange}
          className="planner-list-items"
          renderItem={(entry, _i, handle) => {
            if (editingId === entry.id) {
              return (
                <li
                  key={entry.id}
                  className="planner-list-item planner-list-item--edit"
                >
                  <input
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(entry.id)}
                    placeholder="Codigo"
                    aria-label="Editar codigo"
                  />
                  <input
                    value={editMeaning}
                    onChange={(e) => setEditMeaning(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(entry.id)}
                    placeholder="Significado"
                    aria-label="Editar significado"
                  />
                  <button onClick={() => saveEdit(entry.id)} title="Guardar">
                    ✓
                  </button>
                  <button
                    className="planner-wp-btn--danger"
                    onClick={() => setEditingId(null)}
                    title="Cancelar"
                  >
                    ✕
                  </button>
                </li>
              );
            }
            return (
              <li
                key={entry.id}
                className={`planner-list-item${handle.isOver ? " is-over" : ""}`}
                draggable
                onDragStart={handle.onDragStart}
                onDragOver={handle.onDragOver}
                onDragLeave={handle.onDragLeave}
                onDrop={handle.onDrop}
              >
                <span className="planner-drag-grip" aria-hidden="true">
                  ⠿
                </span>
                <span className="planner-item-main">
                  <span className="planner-brev-code">{entry.code}</span>
                  <span className="planner-brev-meaning">{entry.meaning}</span>
                </span>
                <span className="planner-wp-actions">
                  <button
                    className="planner-wp-btn"
                    title="Editar"
                    onClick={() => startEdit(entry)}
                  >
                    ✎
                  </button>
                  <button
                    className="planner-wp-btn planner-wp-btn--danger"
                    title="Eliminar"
                    onClick={() => remove(entry.id)}
                  >
                    ×
                  </button>
                </span>
              </li>
            );
          }}
        />
      )}
    </div>
  );
}

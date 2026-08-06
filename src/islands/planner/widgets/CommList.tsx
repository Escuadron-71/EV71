import { useState } from "react";
import ReorderableList from "@/islands/planner/widgets/ReorderableList";
import type { CommEntry } from "@/lib/planner/plugins/comms";
import {
  COMM_BAND_NAMES,
  bandForFrequency,
  isValidFrequency,
} from "@/lib/planner/plugins/comms";

interface CommListProps {
  entries: CommEntry[];
  onChange: (next: CommEntry[]) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export default function CommList({ entries, onChange }: CommListProps) {
  const [label, setLabel] = useState("");
  const [frequency, setFrequency] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editFrequency, setEditFrequency] = useState("");

  const validate = (lab: string, freq: string): string | null => {
    if (!lab.trim()) return "Ingresa una etiqueta";
    if (!isValidFrequency(freq)) return "Frecuencia fuera de banda (VHF/UHF/FM)";
    return null;
  };

  const add = () => {
    const err = validate(label, frequency.trim().replace(",", "."));
    if (err) {
      setError(err);
      return;
    }
    onChange([
      ...entries,
      {
        id: uid(),
        label: label.trim(),
        frequency: frequency.trim().replace(",", "."),
      },
    ]);
    setLabel("");
    setFrequency("");
    setError(null);
  };

  const remove = (id: string) => {
    onChange(entries.filter((e) => e.id !== id));
  };

  const startEdit = (entry: CommEntry) => {
    setEditingId(entry.id);
    setEditLabel(entry.label);
    setEditFrequency(entry.frequency);
    setError(null);
  };

  const saveEdit = (id: string) => {
    const err = validate(editLabel, editFrequency.trim().replace(",", "."));
    if (err) {
      setError(err);
      return;
    }
    onChange(
      entries.map((e) =>
        e.id === id
          ? { ...e, label: editLabel.trim(), frequency: editFrequency.trim().replace(",", ".") }
          : e
      )
    );
    setEditingId(null);
  };

  return (
    <div className="planner-list">
      <div className="planner-list-add">
        <input
          placeholder="Etiqueta (ej. Batumi TWR)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          aria-label="Etiqueta de la frecuencia"
        />
        <input
          placeholder="MHz (ej. 131.00)"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          aria-label="Frecuencia en MHz"
        />
        <button onClick={add} title="Agregar frecuencia">
          Agregar
        </button>
      </div>
      {error && <p className="planner-list-error">{error}</p>}
      {entries.length === 0 ? (
        <div className="planner-empty">
          <span>Sin frecuencias</span>
          <small>Agrega una red de radio (VHF/UHF/FM)</small>
        </div>
      ) : (
        <ReorderableList
          items={entries}
          onReorder={onChange}
          className="planner-list-items"
          renderItem={(entry, _i, handle) => {
            const band = bandForFrequency(entry.frequency);
            if (editingId === entry.id) {
              return (
                <li key={entry.id} className="planner-list-item planner-list-item--edit">
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(entry.id)}
                    placeholder="Etiqueta"
                    aria-label="Editar etiqueta"
                  />
                  <input
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(entry.id)}
                    placeholder="MHz"
                    aria-label="Editar frecuencia"
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
                  <span className="planner-list-label">{entry.label}</span>
                  <span className="planner-item-sub">
                    <span className="planner-freq-value">{entry.frequency}</span>
                    {band && (
                      <span className={`planner-band planner-band--${band}`}>
                        {COMM_BAND_NAMES[band]}
                      </span>
                    )}
                  </span>
                </span>
                <span className="planner-wp-actions">
                  <button className="planner-wp-btn" title="Editar" onClick={() => startEdit(entry)}>
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

import type { ReactNode } from "react";

interface PlannerBlockProps {
  id: string;
  title: string;
  badge?: string;
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  children: ReactNode;
}

export default function PlannerBlock({
  id,
  title,
  badge,
  open,
  onToggle,
  children,
}: PlannerBlockProps) {
  return (
    <details
      className={`planner-block${open ? " is-open" : ""}`}
      open={open}
      onToggle={(e) => onToggle(id, e.currentTarget.open)}
    >
      <summary className="planner-block-toggle">
        <span className="planner-block-title">{title}</span>
        {badge !== undefined && badge !== "" && (
          <span className="planner-block-badge">{badge}</span>
        )}
        <span className="planner-block-chevron" aria-hidden="true">
          ▾
        </span>
      </summary>
      <div className="planner-block-content">{children}</div>
    </details>
  );
}

import type { ReactNode, SVGProps } from "react";

export type PlannerTool = "waypoint" | "threat" | "bullseye";

interface ToolSelectorProps {
  tool: PlannerTool;
  onToolChange: (tool: PlannerTool) => void;
}

interface ToolDef {
  id: PlannerTool;
  label: string;
  title: string;
  icon: ReactNode;
}

const svgProps: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const TOOLS: ToolDef[] = [
  {
    id: "waypoint",
    label: "Navegación",
    title: "Clic agrega waypoints de navegación",
    icon: (
      <svg {...svgProps}>
        <circle cx="4.5" cy="19.5" r="1.7" />
        <circle cx="12" cy="12" r="1.7" />
        <circle cx="19.5" cy="4.5" r="1.7" />
        <path d="M5.8 18.2 11 13.2l6.9-7.4" />
      </svg>
    ),
  },
  {
    id: "threat",
    label: "Amenazas",
    title: "Clic coloca una amenaza SAM",
    icon: (
      <svg {...svgProps}>
        <path d="M12 3.8 20 19.2H4Z" />
        <path d="M12 8.6v4.6" />
        <path d="M12 16.4v.1" />
      </svg>
    ),
  },
  {
    id: "bullseye",
    label: "Referencia",
    title: "Clic coloca el punto de referencia (bullseye)",
    icon: (
      <svg {...svgProps}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export default function ToolSelector({ tool, onToolChange }: ToolSelectorProps) {
  return (
    <div className="planner-tools" role="group" aria-label="Herramienta activa">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`planner-tool${tool === t.id ? " is-active" : ""}`}
          onClick={() => onToolChange(t.id)}
          title={t.title}
          aria-pressed={tool === t.id}
        >
          {t.icon}
          <span className="planner-tool-label">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

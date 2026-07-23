import { useState, useRef, useEffect, useCallback } from "react";

interface UserDropdownItem {
  label?: string;
  href?: string;
  separator?: boolean;
}

interface Props {
  items: UserDropdownItem[];
  triggerIconHtml: string;
}

export default function UserDropdown({ items, triggerIconHtml }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [close]);

  return (
    <div ref={wrapperRef} className="dropdown-wrapper">
      <button
        className="dropdown-trigger header-cta px-3!"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        type="button"
      >
        <span dangerouslySetInnerHTML={{ __html: triggerIconHtml }} />
        <span className="sr-only">Cuenta</span>
      </button>
      <div
        ref={panelRef}
        className={`dropdown-panel ${isOpen ? "open" : ""}`}
        role="menu"
        aria-label="Menú de cuenta"
      >
        {items.map((item, i) => {
          if (item.separator) {
            return <div key={`sep-${i}`} className="dropdown-separator" role="separator" />;
          }
          return (
            <a
              key={item.label}
              href={item.href ?? "#"}
              className="dropdown-item"
              role="menuitem"
              onClick={close}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

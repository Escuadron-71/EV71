import { useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";

export interface ReorderHandle {
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  isOver: boolean;
}

interface ReorderableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (reordered: T[]) => void;
  renderItem: (item: T, index: number, handle: ReorderHandle) => ReactNode;
  className?: string;
}

/**
 * Lista reordenable con drag & drop nativo (HTML5). Patron equivalente al
 * usado en DogfightApp, pero generico para listas de planificacion (B9).
 */
export default function ReorderableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
}: ReorderableListProps<T>) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragSource = useRef<{ index: number; id: string } | null>(null);

  const handleDrop = (targetIndex: number) => {
    const src = dragSource.current;
    if (!src) return;
    if (src.index !== targetIndex) {
      onReorder(
        (() => {
          const next = [...items];
          const [item] = next.splice(src.index, 1);
          const adj = src.index < targetIndex ? targetIndex - 1 : targetIndex;
          next.splice(Math.min(adj, next.length), 0, item);
          return next;
        })()
      );
    }
    dragSource.current = null;
    setDragOverIndex(null);
  };

  return (
    <ul className={className}>
      {items.map((item, index) =>
        renderItem(item, index, {
          onDragStart: (e) => {
            e.dataTransfer.effectAllowed = "move";
            dragSource.current = { index, id: item.id };
          },
          onDragOver: (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOverIndex(index);
          },
          onDragLeave: () => {
            if (dragOverIndex === index) setDragOverIndex(null);
          },
          onDrop: () => handleDrop(index),
          isOver: dragOverIndex === index,
        })
      )}
    </ul>
  );
}

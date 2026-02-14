import { useRef } from "react";

export function RenderBadge() {
  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      renders: {renderCount.current}
    </span>
  );
}

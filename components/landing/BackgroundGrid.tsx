interface BackgroundGridProps {
  className?: string;
  gridLineStyles?: Record<number, React.CSSProperties>;
}

const LINE_POSITIONS = [10, 30, 50, 70, 90];

export default function BackgroundGrid({
  className = "",
  gridLineStyles = {},
}: BackgroundGridProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {LINE_POSITIONS.map((left, i) => {
        const distFromCenter = Math.abs(i - 2);
        const baseOpacity = 0.03 + (2 - distFromCenter) * 0.02;

        return (
          <div
            key={i}
            className="absolute top-0 h-full w-px"
            style={{
              left: `${left}%`,
              background: `linear-gradient(to bottom, transparent, rgba(127,238,100,${baseOpacity}) 25%, rgba(127,238,100,${baseOpacity}) 75%, transparent)`,
              ...gridLineStyles[i],
            }}
          />
        );
      })}
    </div>
  );
}

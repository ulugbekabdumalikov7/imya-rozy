/** Знак: роза-окно — круг и восемь лучей, тонкой линией. */
export function RoseMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line
            key={i}
            x1={16 + 4 * Math.cos(a)}
            y1={16 + 4 * Math.sin(a)}
            x2={16 + 13.5 * Math.cos(a)}
            y2={16 + 13.5 * Math.sin(a)}
            stroke="currentColor"
            strokeWidth="1"
          />
        );
      })}
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}

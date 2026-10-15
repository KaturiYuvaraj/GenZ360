export function Logo({
  compact = false,
  inverted = false,
}: {
  compact?: boolean;
  inverted?: boolean;
}) {
  const ink = inverted ? "#F3F0E8" : "#14161A";
  const accent = "#1857FF";
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="GenZ360">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="14.5" stroke={ink} strokeWidth="1.2" />
        <path
          d="M16 4.5a11.5 11.5 0 0 1 0 23"
          stroke={accent}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M7 10.5c3.2 2.4 7.2 3.5 9 3.5s5.8-1.1 9-3.5"
          stroke={ink}
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path
          d="M7 21.5c3.2-2.4 7.2-3.5 9-3.5s5.8 1.1 9 3.5"
          stroke={ink}
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle cx="16" cy="16" r="2.4" fill={accent} />
      </svg>
      {!compact ? (
        <span
          className="font-display text-[15px] font-semibold tracking-[-0.04em]"
          style={{ color: ink }}
        >
          GENZ360
        </span>
      ) : null}
    </span>
  );
}

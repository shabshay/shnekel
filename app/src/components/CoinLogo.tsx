interface CoinLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

const sizes = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 80,
};

export function CoinLogo({ size = 'md', className = '', animate = false }: CoinLogoProps) {
  const s = sizes[size];
  const r = s / 2 - 2;
  const innerR = r - 3;
  const notchCount = 24;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={`${animate ? 'animate-spin-slow' : ''} ${className}`}
      fill="none"
    >
      <defs>
        <linearGradient id={`coin-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a2540" />
          <stop offset="50%" stopColor="#131b2e" />
          <stop offset="100%" stopColor="#0f1520" />
        </linearGradient>
      </defs>

      {/* Ridged edge - small notches around the coin */}
      {Array.from({ length: notchCount }).map((_, i) => {
        const angle = (i * 360) / notchCount;
        const rad = (angle * Math.PI) / 180;
        const cx = s / 2;
        const cy = s / 2;
        const x1 = cx + (r - 1) * Math.cos(rad);
        const y1 = cy + (r - 1) * Math.sin(rad);
        const x2 = cx + (r + 0.5) * Math.cos(rad);
        const y2 = cy + (r + 0.5) * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#131b2e"
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.3}
          />
        );
      })}

      {/* Outer circle */}
      <circle
        cx={s / 2}
        cy={s / 2}
        r={r}
        fill={`url(#coin-grad-${size})`}
        stroke="#1a2540"
        strokeWidth={1.5}
      />

      {/* Inner ring */}
      <circle
        cx={s / 2}
        cy={s / 2}
        r={innerR}
        fill="none"
        stroke="#2a3a5c"
        strokeWidth={0.75}
        opacity={0.5}
      />

      {/* "2" number */}
      <text
        x={s / 2}
        y={s / 2 + s * 0.01}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontFamily="Lexend, sans-serif"
        fontWeight="800"
        fontSize={s * 0.42}
        letterSpacing="-0.02em"
      >
        2
      </text>

      {/* Small ₪ symbol */}
      <text
        x={s / 2 + s * 0.18}
        y={s / 2 - s * 0.14}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#4edea3"
        fontFamily="Lexend, sans-serif"
        fontWeight="700"
        fontSize={s * 0.15}
      >
        ₪
      </text>

      {/* Subtle shine highlight */}
      <ellipse
        cx={s / 2 - s * 0.1}
        cy={s / 2 - s * 0.12}
        rx={s * 0.2}
        ry={s * 0.08}
        fill="white"
        opacity={0.06}
        transform={`rotate(-30, ${s / 2}, ${s / 2})`}
      />
    </svg>
  );
}

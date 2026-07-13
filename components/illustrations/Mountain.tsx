interface IllustrationProps {
  className?: string;
}

export function MountainLogo({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 44 44" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="21" fill="var(--color-sage-100)" stroke="var(--color-sage-800)" strokeWidth="1.5" />
      <path d="M8 30 L17 16 L22 24 L26 18 L36 30 Z" fill="var(--color-sage-700)" />
      <path d="M17 16 L19.5 20 L14.5 20 Z" fill="white" />
      <path d="M26 18 L28 21 L24 21 Z" fill="white" />
    </svg>
  );
}

export function MountainScene({ className }: IllustrationProps) {
  const trees = [
    { x: 60, y: 300, scale: 1.1, fill: "fill-sage-800" },
    { x: 100, y: 320, scale: 0.85, fill: "fill-sage-700" },
    { x: 300, y: 310, scale: 1, fill: "fill-sage-800" },
    { x: 340, y: 290, scale: 0.75, fill: "fill-sage-700" },
    { x: 200, y: 330, scale: 0.9, fill: "fill-sage-900" },
    { x: 250, y: 315, scale: 0.7, fill: "fill-sage-700" },
  ];

  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3faec" />
          <stop offset="100%" stopColor="#dceccb" />
        </linearGradient>
        <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87986a" />
          <stop offset="100%" stopColor="#455924" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="400" fill="url(#sky)" />

      <polygon
        points="0,230 40,150 90,200 140,120 190,190 230,130 280,200 330,160 400,220 400,260 0,260"
        className="fill-sage-200"
      />
      <polygon points="40,150 55,178 25,178" fill="white" />
      <polygon points="140,120 155,150 125,150" fill="white" />
      <polygon points="230,130 245,158 215,158" fill="white" />

      <polygon
        points="0,270 60,205 110,245 160,190 220,240 270,200 320,245 400,215 400,280 0,280"
        className="fill-sage-300"
      />

      {trees.map((tree, i) => (
        <g key={i} transform={`translate(${tree.x} ${tree.y}) scale(${tree.scale})`} className={tree.fill}>
          <polygon points="0,-42 -15,-10 15,-10" />
          <polygon points="0,-30 -19,8 19,8" />
          <polygon points="0,-16 -23,24 23,24" />
          <rect x="-4" y="24" width="8" height="14" />
        </g>
      ))}

      <rect x="0" y="300" width="400" height="100" fill="url(#lake)" />
      <polygon
        points="0,300 60,335 110,315 160,340 220,318 270,338 320,315 400,325 400,300"
        className="fill-sage-500"
        opacity="0.4"
      />
      <rect x="20" y="345" width="120" height="3" rx="1.5" fill="white" opacity="0.25" />
      <rect x="220" y="360" width="160" height="3" rx="1.5" fill="white" opacity="0.2" />
      <rect x="60" y="375" width="90" height="3" rx="1.5" fill="white" opacity="0.2" />
    </svg>
  );
}

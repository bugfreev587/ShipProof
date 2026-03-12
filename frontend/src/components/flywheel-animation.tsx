"use client";

export default function FlywheelAnimation() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 8px var(--glow-color)); opacity: 1; }
          50% { filter: drop-shadow(0 0 20px var(--glow-color)); opacity: 0.9; }
        }
        @keyframes dash-flow {
          to { stroke-dashoffset: -20; }
        }
        @media (prefers-reduced-motion: reduce) {
          .flywheel-pulse, .flywheel-dash { animation: none !important; }
        }
      `}</style>

      <svg viewBox="0 0 400 380" className="w-full h-auto" aria-label="ShipProof flywheel: Ship, Collect, Display">
        {/* Arrows */}
        <defs>
          <marker id="arrow-indigo" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#6366F1" />
          </marker>
          <marker id="arrow-emerald" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#10B981" />
          </marker>
          <marker id="arrow-amber" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#F59E0B" />
          </marker>
        </defs>

        {/* Arrow: Ship → Collect */}
        <path
          d="M 240 110 Q 320 180 300 250"
          fill="none"
          stroke="#6366F1"
          strokeWidth="2"
          strokeDasharray="6 4"
          markerEnd="url(#arrow-indigo)"
          className="flywheel-dash"
          style={{ animation: "dash-flow 1.2s linear infinite", animationDelay: "0s" }}
        />
        {/* Arrow: Collect → Display */}
        <path
          d="M 260 290 Q 200 330 140 290"
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          strokeDasharray="6 4"
          markerEnd="url(#arrow-emerald)"
          className="flywheel-dash"
          style={{ animation: "dash-flow 1.2s linear infinite", animationDelay: "0.4s" }}
        />
        {/* Arrow: Display → Ship */}
        <path
          d="M 100 250 Q 80 180 160 110"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeDasharray="6 4"
          markerEnd="url(#arrow-amber)"
          className="flywheel-dash"
          style={{ animation: "dash-flow 1.2s linear infinite", animationDelay: "0.8s" }}
        />

        {/* Ship node (top center) */}
        <g
          className="flywheel-pulse"
          style={{
            "--glow-color": "#6366F1",
            animation: "pulse-glow 3s ease-in-out infinite",
            animationDelay: "0s",
          } as React.CSSProperties}
        >
          <circle cx="200" cy="80" r="40" fill="#1A1A1F" stroke="#6366F1" strokeWidth="2" />
          {/* Rocket icon */}
          <text x="200" y="78" textAnchor="middle" dominantBaseline="middle" fontSize="22" fill="#6366F1">
            &#9650;
          </text>
          <text x="200" y="135" textAnchor="middle" fontSize="14" fontWeight="600" fill="#F1F1F3">
            Ship
          </text>
          <text x="200" y="153" textAnchor="middle" fontSize="11" fill="#9CA3AF">
            AI launch copy
          </text>
        </g>

        {/* Collect node (bottom right) */}
        <g
          className="flywheel-pulse"
          style={{
            "--glow-color": "#10B981",
            animation: "pulse-glow 3s ease-in-out infinite",
            animationDelay: "1s",
          } as React.CSSProperties}
        >
          <circle cx="300" cy="270" r="40" fill="#1A1A1F" stroke="#10B981" strokeWidth="2" />
          <text x="300" y="268" textAnchor="middle" dominantBaseline="middle" fontSize="20" fill="#10B981">
            &#9733;
          </text>
          <text x="300" y="325" textAnchor="middle" fontSize="14" fontWeight="600" fill="#F1F1F3">
            Collect
          </text>
          <text x="300" y="343" textAnchor="middle" fontSize="11" fill="#9CA3AF">
            Gather praise
          </text>
        </g>

        {/* Display node (bottom left) */}
        <g
          className="flywheel-pulse"
          style={{
            "--glow-color": "#F59E0B",
            animation: "pulse-glow 3s ease-in-out infinite",
            animationDelay: "2s",
          } as React.CSSProperties}
        >
          <circle cx="100" cy="270" r="40" fill="#1A1A1F" stroke="#F59E0B" strokeWidth="2" />
          <text x="100" y="268" textAnchor="middle" dominantBaseline="middle" fontSize="20" fill="#F59E0B">
            &#9671;
          </text>
          <text x="100" y="325" textAnchor="middle" fontSize="14" fontWeight="600" fill="#F1F1F3">
            Display
          </text>
          <text x="100" y="343" textAnchor="middle" fontSize="11" fill="#9CA3AF">
            Widget & Wall
          </text>
        </g>

        {/* Center text */}
        <text x="200" y="230" textAnchor="middle" fontSize="11" fill="#6B7280">
          Each cycle makes your
        </text>
        <text x="200" y="246" textAnchor="middle" fontSize="11" fill="#6B7280">
          next launch stronger
        </text>
      </svg>
    </div>
  );
}

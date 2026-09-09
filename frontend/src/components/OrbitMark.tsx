interface OrbitMarkProps {
  size?: number
  className?: string
}

function OrbitMark({
  size = 42,
  className = '',
}: OrbitMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Orbit"
      role="img"
    >
      <circle
        cx="24"
        cy="24"
        r="14"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.85"
      />

      <ellipse
        cx="24"
        cy="24"
        rx="21"
        ry="8.5"
        transform="rotate(-32 24 24)"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />

      <circle
        cx="36.5"
        cy="13.5"
        r="3.5"
        fill="currentColor"
      />

      <circle
        cx="36.5"
        cy="13.5"
        r="6"
        fill="currentColor"
        opacity="0.12"
      />
    </svg>
  )
}

export default OrbitMark
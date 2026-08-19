interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

// Thin wrapper over Material Symbols Outlined. Pass a className for size/color.
export default function Icon({ name, className = "", filled = false }: IconProps) {
  const fill = filled ? "1" : "0";
  return (
    <span
      className={`icon ${className}`}
      style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";

/** Circular progress (uploads). Track = recessed, arc = signal. */
export function ProgressRing({
  progress,
  size = 44,
  stroke = 4,
}: {
  progress: number;
  size?: number;
  stroke?: number;
}) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={t.control.track}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={t.control.fill}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${c}`}
        strokeDashoffset={c * (1 - p)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

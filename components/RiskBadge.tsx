import { Badge } from "@/components/ui/badge";
import type { Risk } from "@/lib/types";

export const riskLabel: Record<Risk, string> = { high: "Didelė rizika", medium: "Vidutinė rizika", low: "Maža rizika" };
export const riskDot: Record<Risk, string> = { high: "bg-risk-high", medium: "bg-risk-medium", low: "bg-risk-low" };
const tone: Record<Risk, string> = {
  high: "bg-risk-high/10 text-risk-high",
  medium: "bg-risk-medium/10 text-risk-medium",
  low: "bg-risk-low/10 text-risk-low",
};

export default function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <Badge variant="secondary" className={tone[risk]}>
      <span className={`size-1.5 rounded-full ${riskDot[risk]}`} aria-hidden />
      {riskLabel[risk]}
    </Badge>
  );
}

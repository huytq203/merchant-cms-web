import { Badge } from "@/components/ui/badge/Badge";

export type StatusTone = "success" | "warning" | "info" | "danger" | "neutral";

interface StatusBadgeProps {
  label?: string | null;
  tone?: StatusTone;
}

const toneClasses: Record<StatusTone, string> = {
  success: "bg-success/[0.16] text-success",
  warning: "bg-warning/[0.16] text-warning",
  info: "bg-info/[0.16] text-info",
  danger: "bg-danger/[0.12] text-danger",
  neutral: "bg-muted text-muted-foreground",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={`min-w-[1rem] justify-center border-transparent ${toneClasses[tone]}`}>
      {label?.trim() || "Không xác định"}
    </Badge>
  );
}

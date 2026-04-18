import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

type Status = "QUEUED" | "BUILDING" | "READY" | "FAILED";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

const config: Record<
  Status,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    Icon: typeof Clock;
  }
> = {
  QUEUED: {
    label: "Queued",
    color: "text-[#888]",
    bg: "bg-[#888]/10",
    border: "border-[#888]/20",
    Icon: Clock,
  },
  BUILDING: {
    label: "Building",
    color: "text-[#f5a623]",
    bg: "bg-[#f5a623]/10",
    border: "border-[#f5a623]/20",
    Icon: Loader2,
  },
  READY: {
    label: "Ready",
    color: "text-[#00c951]",
    bg: "bg-[#00c951]/10",
    border: "border-[#00c951]/20",
    Icon: CheckCircle,
  },
  FAILED: {
    label: "Failed",
    color: "text-[#ff4444]",
    bg: "bg-[#ff4444]/10",
    border: "border-[#ff4444]/20",
    Icon: XCircle,
  },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { label, color, bg, border, Icon } = config[status];
  const isBuilding = status === "BUILDING";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const textSize = size === "sm" ? "text-xs" : "text-xs";

  return (
    <span
      data-testid={`status-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center gap-1 leading-none rounded-md px-1.5 py-0.5 font-semibold border tabular-nums ${textSize} ${color} ${bg} ${border}`}
    >
      <Icon
        className={`${iconSize} ${isBuilding ? "animate-spin status-pulse" : ""}`}
      />
      {label}
    </span>
  );
}

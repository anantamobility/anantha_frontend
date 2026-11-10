import { cn } from "@/features/shared/utils/cn";

const TONE_CLASS: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-800",
  blue: "bg-sky-100 text-sky-800",
  amber: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-800",
  slate: "bg-slate-100 text-slate-700",
  purple: "bg-violet-100 text-violet-800",
};

function toneForStatus(status: string): string {
  const value = status.toUpperCase();
  if (["ACTIVE", "IDLE", "PAID", "CLEARED", "VERIFIED", "COMPLETED"].includes(value)) {
    return "green";
  }
  if (["DEPLOYED", "PENDING", "DRAFT", "ONBOARDING", "PARTIALLY_PAID"].includes(value)) {
    return "blue";
  }
  if (["ON_HOLD", "OVERDUE", "UNDER_REPAIR", "SUSPENDED", "PENDING_APPROVAL"].includes(value)) {
    return "amber";
  }
  if (["FAILED", "CANCELLED", "TERMINATED", "OUT_OF_SERVICE", "REVERSED"].includes(value)) {
    return "red";
  }
  if (["IN_SERVICE", "UNDER_REVIEW"].includes(value)) return "purple";
  return "slate";
}

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASS[toneForStatus(status)],
        className,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

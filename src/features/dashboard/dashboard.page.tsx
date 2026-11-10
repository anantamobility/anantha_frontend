import { useState } from "react";
import {
  DateRangeFilterBar,
  LoadingSkeleton,
  PageHeader,
} from "@/features/shared/components/common";
import {
  getDateRangeForPreset,
  type DateRangePreset,
  type DateRangeValue,
} from "@/features/shared/utils/dateRange";
import { formatMoney } from "@/features/shared/utils/money";
import { useDashboardQuery } from "./hooks/useDashboardQuery";

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [preset, setPreset] = useState<DateRangePreset>("month");
  const [dateRange, setDateRange] = useState<DateRangeValue>(() =>
    getDateRangeForPreset("month"),
  );
  const query = useDashboardQuery(dateRange.start, dateRange.end);
  const data = query.data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live operations and collections snapshot."
      />
      <div className="mb-6">
        <DateRangeFilterBar
          preset={preset}
          dateRange={dateRange}
          onPresetChange={setPreset}
          onDateRangeChange={setDateRange}
        />
      </div>

      {query.isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Vehicles" value={data?.live?.vehicles?.total ?? "—"} />
          <KpiCard label="Riders" value={data?.live?.riders?.total ?? "—"} />
          <KpiCard
            label="Collections (cleared)"
            value={formatMoney(data?.collectionDue?.totalCollectedAmount)}
          />
          <KpiCard
            label="Pending dues"
            value={formatMoney(data?.collectionDue?.totalPendingAmount)}
          />
          <KpiCard
            label="Open dues count"
            value={data?.collectionDue?.collectionsDue ?? "—"}
          />
          <KpiCard
            label="Overdue dues"
            value={data?.collectionDue?.overdueCollections ?? "—"}
          />
          <KpiCard
            label="Overdue amount"
            value={formatMoney(data?.collectionDue?.totalOverdueAmount)}
          />
          <KpiCard
            label="Open deposits"
            value={data?.deposits?.openCount ?? "—"}
          />
        </div>
      )}
    </div>
  );
}

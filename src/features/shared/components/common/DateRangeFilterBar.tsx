import {
  getDateRangeForPreset,
  type DateRangePreset,
  type DateRangeValue,
} from "@/features/shared/utils/dateRange";

const PRESET_LABELS: Record<Exclude<DateRangePreset, "custom">, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Last 7 Days",
  month: "This Month",
};

type DateRangeFilterBarProps = {
  preset: DateRangePreset;
  dateRange: DateRangeValue;
  onPresetChange: (preset: DateRangePreset) => void;
  onDateRangeChange: (range: DateRangeValue) => void;
};

export function DateRangeFilterBar({
  preset,
  dateRange,
  onPresetChange,
  onDateRangeChange,
}: DateRangeFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex w-fit gap-1 rounded-lg bg-muted p-1">
        {(Object.keys(PRESET_LABELS) as Array<Exclude<DateRangePreset, "custom">>).map(
          (key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onPresetChange(key);
                onDateRangeChange(getDateRangeForPreset(key));
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                preset === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {PRESET_LABELS[key]}
            </button>
          ),
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Start
          </span>
          <input
            type="date"
            value={dateRange.start}
            onChange={(event) => {
              onPresetChange("custom");
              onDateRangeChange({ ...dateRange, start: event.target.value });
            }}
            className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            End
          </span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(event) => {
              onPresetChange("custom");
              onDateRangeChange({ ...dateRange, end: event.target.value });
            }}
            className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs"
          />
        </label>
      </div>
    </div>
  );
}

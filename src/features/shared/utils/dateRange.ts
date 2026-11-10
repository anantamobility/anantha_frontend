export type DateRangePreset = "today" | "yesterday" | "week" | "month" | "custom";

export type DateRangeValue = {
  start: string;
  end: string;
};

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateRangeForPreset(
  preset: Exclude<DateRangePreset, "custom">,
): DateRangeValue {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (preset === "today") {
    const value = toInputDate(today);
    return { start: value, end: value };
  }

  if (preset === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const value = toInputDate(yesterday);
    return { start: value, end: value };
  }

  if (preset === "week") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start: toInputDate(start), end: toInputDate(today) };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { start: toInputDate(start), end: toInputDate(today) };
}

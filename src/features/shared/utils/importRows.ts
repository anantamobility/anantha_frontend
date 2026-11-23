/**
 * Strip empty/null import cells so Zod `.optional()` fields (non-nullable)
 * like vehicle `isActive` are omitted instead of sent as null.
 */
export function omitEmptyImportFields<T extends Record<string, unknown>>(
  row: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "string" && value.trim() === "") continue;
    out[key] = typeof value === "string" ? value.trim() : value;
  }
  return out;
}

/** Best-effort normalize spreadsheet dates to YYYY-MM-DD for z.coerce.date(). */
export function normalizeImportDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const slash = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    let year = Number(slash[3]);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return raw;
}

export function sanitizeImportRows<T extends Record<string, unknown>>(
  rows: T[],
  dateFields: string[] = [],
): Record<string, unknown>[] {
  const dateSet = new Set(dateFields);
  return rows.map((row) => {
    const next: Record<string, unknown> = { ...row };
    for (const field of dateSet) {
      if (field in next) {
        next[field] = normalizeImportDate(next[field]);
      }
    }
    return omitEmptyImportFields(next);
  });
}

import type { ReactNode } from "react";

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border border-border p-3">
      <legend className="px-1 text-sm font-medium text-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm";

export const textareaClass =
  "min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

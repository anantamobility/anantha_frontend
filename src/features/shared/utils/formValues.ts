export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function emptyToNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

export function emptyToDate(value: string): string | null {
  return emptyToNull(value);
}

export function toDateInput(value?: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export function parseOptionalJson(value: string): unknown | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return JSON.parse(trimmed) as unknown;
}

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export type AddressForm = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export const EMPTY_ADDRESS: AddressForm = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export function addressFromUnknown(value: unknown): AddressForm {
  if (!value || typeof value !== "object") return { ...EMPTY_ADDRESS };
  const record = value as Record<string, unknown>;
  return {
    line1: typeof record.line1 === "string" ? record.line1 : "",
    line2: typeof record.line2 === "string" ? record.line2 : "",
    city: typeof record.city === "string" ? record.city : "",
    state: typeof record.state === "string" ? record.state : "",
    postalCode: typeof record.postalCode === "string" ? record.postalCode : "",
    country: typeof record.country === "string" ? record.country : "India",
  };
}

export function addressPayload(address: AddressForm) {
  const payload = {
    line1: emptyToNull(address.line1) ?? undefined,
    line2: emptyToNull(address.line2) ?? undefined,
    city: emptyToNull(address.city) ?? undefined,
    state: emptyToNull(address.state) ?? undefined,
    postalCode: emptyToNull(address.postalCode) ?? undefined,
    country: emptyToNull(address.country) ?? undefined,
  };
  const hasAny = Object.values(payload).some((value) => value !== undefined);
  return hasAny ? payload : null;
}

export type VehicleImportColumnDef = {
  field: string;
  header: string;
  required?: boolean;
  example?: string;
  coerce?: "number" | "boolean";
};

/** Columns for vehicle import template / file parsing (create-only). */
export const VEHICLE_IMPORT_COLUMNS: VehicleImportColumnDef[] = [
  {
    field: "registrationNumber",
    header: "Registration Number",
    required: true,
    example: "TS09AB1234",
  },
  {
    field: "hubCode",
    header: "Hub Code",
    required: true,
    example: "TS-HYD-001",
  },
  { field: "make", header: "Make", example: "Ather" },
  { field: "model", header: "Model", example: "450X" },
  { field: "year", header: "Year", example: "2024", coerce: "number" },
  { field: "color", header: "Color", example: "White" },
  { field: "vin", header: "VIN", example: "MA1TA2ABCD1234567" },
  { field: "acquiredAt", header: "Acquired At", example: "2024-01-15" },
  { field: "isActive", header: "Is Active", example: "true", coerce: "boolean" },
  { field: "vehicleCategory", header: "Vehicle Category", example: "SCOOTER" },
  { field: "vehicleType", header: "Vehicle Type", example: "EV" },
  { field: "batteryType", header: "Battery Type", example: "Lithium" },
  {
    field: "batteryCapacity",
    header: "Battery Capacity",
    example: "40",
    coerce: "number",
  },
  {
    field: "nominalRange",
    header: "Nominal Range",
    example: "120",
    coerce: "number",
  },
  { field: "chargingOptions", header: "Charging Options", example: "fast" },
  {
    field: "chargerProvided",
    header: "Charger Provided",
    example: "true",
    coerce: "boolean",
  },
  { field: "noOfTyres", header: "Number of Tyres", example: "2", coerce: "number" },
  { field: "batteryNumber", header: "Battery Number", example: "BN001" },
  {
    field: "batteryModelNumber",
    header: "Battery Model Number",
    example: "BM-40",
  },
  { field: "batteryBrand", header: "Battery Brand", example: "Ather" },
  {
    field: "registrationType",
    header: "Registration Type",
    example: "commercial",
  },
  { field: "ownershipType", header: "Ownership Type", example: "owned" },
  { field: "dateOfPurchase", header: "Date of Purchase", example: "2024-01-01" },
  { field: "dateOfDelivery", header: "Date of Delivery", example: "2024-01-10" },
  {
    field: "dateOfRegistration",
    header: "Date of Registration",
    example: "2024-01-20",
  },
  {
    field: "dateOfOperation",
    header: "Date of Operation",
    example: "2024-02-01",
  },
  {
    field: "warrantyStartDate",
    header: "Warranty Start",
    example: "2024-01-01",
  },
  { field: "warrantyEndDate", header: "Warranty End", example: "2027-01-01" },
  {
    field: "telematicsExpiryDate",
    header: "Telematics Expiry",
    example: "2026-12-31",
  },
  { field: "loanProvider", header: "Loan Provider", example: "HDFC" },
  { field: "emiAmount", header: "EMI Amount", example: "15000", coerce: "number" },
  {
    field: "tenurePeriod",
    header: "Tenure Period (months)",
    example: "48",
    coerce: "number",
  },
  { field: "emiDueDate", header: "EMI Due Date", example: "2024-02-05" },
  {
    field: "insurancePolicyNumber",
    header: "Insurance Policy Number",
    example: "POL123",
  },
  {
    field: "insuranceProvider",
    header: "Insurance Provider",
    example: "ICICI Lombard",
  },
  {
    field: "insurancePolicyType",
    header: "Insurance Policy Type",
    example: "comprehensive",
  },
  {
    field: "insuranceValidFrom",
    header: "Insurance Valid From",
    example: "2024-01-01",
  },
  {
    field: "insuranceValidTo",
    header: "Insurance Valid To",
    example: "2025-01-01",
  },
  {
    field: "insurancePremiumAmount",
    header: "Insurance Premium",
    example: "8000",
    coerce: "number",
  },
  { field: "insuranceStatus", header: "Insurance Status", example: "active" },
  {
    field: "insuranceThirdParty",
    header: "Insurance Third Party",
    example: "yes",
  },
];

export function getVehicleImportHeaderMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const col of VEHICLE_IMPORT_COLUMNS) {
    map.set(col.header.toLowerCase(), col.field);
    map.set(col.field.toLowerCase(), col.field);
  }
  return map;
}

export function getVehicleImportCoerceMap(): Map<string, "number" | "boolean"> {
  const map = new Map<string, "number" | "boolean">();
  for (const col of VEHICLE_IMPORT_COLUMNS) {
    if (col.coerce) map.set(col.field, col.coerce);
  }
  return map;
}

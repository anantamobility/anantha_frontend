export type RiderImportColumnDef = {
  field: string;
  header: string;
  required?: boolean;
  example?: string;
};

/** Columns for rider import template / file parsing (create-only). */
export const RIDER_IMPORT_COLUMNS: RiderImportColumnDef[] = [
  { field: "fullName", header: "Full Name", required: true, example: "Ravi Kumar" },
  {
    field: "phoneNumber",
    header: "Phone Number",
    required: true,
    example: "9876543210",
  },
  {
    field: "rentalType",
    header: "Rental Type",
    required: true,
    example: "B2C",
  },
  {
    field: "b2cMode",
    header: "B2C Mode",
    example: "INDIVIDUAL_RIDER",
  },
  {
    field: "b2bRiderMgmt",
    header: "B2B Rider Mgmt",
    example: "CLIENT_MANAGED",
  },
  { field: "clientCode", header: "Client Code", example: "CL-001" },
  { field: "hubCode", header: "Hub Code", example: "TS-HYD-001" },
  { field: "email", header: "Email", example: "ravi@example.com" },
  { field: "riderCode", header: "Rider Code", example: "R100" },
  { field: "dateOfBirth", header: "Date of Birth", example: "1995-01-15" },
  { field: "gender", header: "Gender", example: "MALE" },
  { field: "addressLine1", header: "Address Line 1", example: "12 MG Road" },
  { field: "addressLine2", header: "Address Line 2", example: "Near Metro" },
  { field: "addressCity", header: "Address City", example: "Hyderabad" },
  { field: "addressState", header: "Address State", example: "Telangana" },
  {
    field: "addressPostalCode",
    header: "Address Postal Code",
    example: "500001",
  },
  { field: "addressCountry", header: "Address Country", example: "India" },
  {
    field: "emergencyContactName",
    header: "Emergency Contact Name",
    example: "Sita",
  },
  {
    field: "emergencyContactPhone",
    header: "Emergency Contact Phone",
    example: "9876500000",
  },
  { field: "aadharNumber", header: "Aadhar Number", example: "123456789012" },
  { field: "panNumber", header: "PAN Number", example: "ABCDE1234F" },
  { field: "licenseNumber", header: "License Number", example: "TS123456" },
  {
    field: "medicalReportExpiryDate",
    header: "Medical Report Expiry",
    example: "2026-12-31",
  },
  { field: "agreementDate", header: "Agreement Date", example: "2024-01-01" },
  {
    field: "policeVerificationValidUpto",
    header: "Police Verification Valid Upto",
    example: "2026-06-30",
  },
  {
    field: "backgroundVerificationExpiryDate",
    header: "BGV Expiry",
    example: "2026-06-30",
  },
  {
    field: "dateOfLastWorkingDay",
    header: "Date of Last Working Day",
    example: "",
  },
  { field: "bankName", header: "Bank Name", example: "HDFC" },
  { field: "branch", header: "Branch", example: "Madhapur" },
];

export function getRiderImportHeaderMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const col of RIDER_IMPORT_COLUMNS) {
    map.set(col.header.toLowerCase(), col.field);
    map.set(col.field.toLowerCase(), col.field);
  }
  return map;
}

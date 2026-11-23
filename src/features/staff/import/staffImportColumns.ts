export type StaffImportColumnDef = {
  field: string;
  header: string;
  required?: boolean;
  example?: string;
};

/** Columns for staff import template / file parsing (create-only). */
export const STAFF_IMPORT_COLUMNS: StaffImportColumnDef[] = [
  { field: "fullName", header: "Full Name", required: true, example: "Priya Nair" },
  {
    field: "gender",
    header: "Gender",
    required: true,
    example: "FEMALE",
  },
  {
    field: "phoneNumber",
    header: "Phone Number",
    required: true,
    example: "9876543210",
  },
  {
    field: "roleName",
    header: "Role Name",
    required: true,
    example: "SUPERVISOR",
  },
  { field: "email", header: "Email", example: "priya@example.com" },
  { field: "hubCode", header: "Hub Code", example: "KA-BLR-001" },
  { field: "employeeCode", header: "Employee Code", example: "S100" },
  { field: "dateOfBirth", header: "Date of Birth", example: "1992-05-20" },
  { field: "department", header: "Department", example: "Operations" },
  { field: "jobTitle", header: "Job Title", example: "Hub Supervisor" },
  { field: "status", header: "Status", example: "ACTIVE" },
  {
    field: "employmentType",
    header: "Employment Type",
    example: "FULL_TIME",
  },
  { field: "workMode", header: "Work Mode", example: "ONSITE" },
  {
    field: "educationalQualification",
    header: "Educational Qualification",
    example: "B.Tech",
  },
  { field: "bloodGroup", header: "Blood Group", example: "O+" },
  { field: "addressLine1", header: "Address Line 1", example: "12 MG Road" },
  { field: "addressLine2", header: "Address Line 2", example: "Near Metro" },
  { field: "addressCity", header: "Address City", example: "Bengaluru" },
  { field: "addressState", header: "Address State", example: "Karnataka" },
  {
    field: "addressPostalCode",
    header: "Address Postal Code",
    example: "560001",
  },
  { field: "addressCountry", header: "Address Country", example: "India" },
  {
    field: "alternatePhone",
    header: "Alternate Phone",
    example: "9876500001",
  },
  {
    field: "emergencyContactName",
    header: "Emergency Contact Name",
    example: "Arun",
  },
  {
    field: "emergencyContactPhone",
    header: "Emergency Contact Phone",
    example: "9876500000",
  },
  { field: "anniversary", header: "Anniversary", example: "" },
  { field: "dateOfJoining", header: "Date of Joining", example: "2024-01-15" },
  {
    field: "probationEndDate",
    header: "Probation End Date",
    example: "2024-07-15",
  },
  {
    field: "dateOfLastWorkingDay",
    header: "Date of Last Working Day",
    example: "",
  },
  { field: "dateOfRelieving", header: "Date of Relieving", example: "" },
  { field: "aadharNumber", header: "Aadhar Number", example: "123456789012" },
  { field: "panNumber", header: "PAN Number", example: "ABCDE1234F" },
  { field: "bankName", header: "Bank Name", example: "HDFC" },
  { field: "branch", header: "Branch", example: "Indiranagar" },
  {
    field: "bankAccountNumber",
    header: "Bank Account Number",
    example: "123456789012",
  },
  { field: "bankIfsc", header: "Bank IFSC", example: "HDFC0001234" },
  {
    field: "bankHolderName",
    header: "Bank Holder Name",
    example: "Priya Nair",
  },
];

export function getStaffImportHeaderMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const col of STAFF_IMPORT_COLUMNS) {
    map.set(col.header.toLowerCase(), col.field);
    map.set(col.field.toLowerCase(), col.field);
  }
  return map;
}

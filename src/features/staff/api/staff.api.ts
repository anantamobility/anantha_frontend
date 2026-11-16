import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";

export type StaffAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type StaffMember = {
  id: string;
  fullName: string;
  employeeCode?: string | null;
  gender: string;
  dateOfBirth?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  hubId?: string | null;
  status: string;
  alternatePhone?: string | null;
  address?: StaffAddress | Record<string, unknown> | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bloodGroup?: string | null;
  employmentType?: string | null;
  workMode?: string | null;
  educationalQualification?: string | null;
  anniversary?: string | null;
  dateOfJoining?: string | null;
  probationEndDate?: string | null;
  dateOfLastWorkingDay?: string | null;
  dateOfRelieving?: string | null;
  aadharNumber?: string | null;
  panNumber?: string | null;
  bankName?: string | null;
  branch?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  bankHolderName?: string | null;
  user?: {
    id: string;
    email?: string | null;
    phoneNumber: string;
  } | null;
};

export type StaffCreatePayload = {
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  phoneNumber: string;
  email?: string | null;
  password: string;
  roleId?: string;
  roleName?: string;
  dateOfBirth?: string | null;
  department?: string | null;
  employeeCode?: string | null;
  hubId?: string | null;
  jobTitle?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  alternatePhone?: string | null;
  address?: StaffAddress | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bloodGroup?: string | null;
  employmentType?:
    | "INTERN"
    | "TRAINEE"
    | "FULL_TIME"
    | "PART_TIME"
    | "CONSULTANT"
    | null;
  workMode?: "REMOTE" | "ONSITE" | "HYBRID" | null;
  educationalQualification?: string | null;
  anniversary?: string | null;
  dateOfJoining?: string | null;
  probationEndDate?: string | null;
  dateOfLastWorkingDay?: string | null;
  dateOfRelieving?: string | null;
  aadharNumber?: string | null;
  panNumber?: string | null;
  bankName?: string | null;
  branch?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  bankHolderName?: string | null;
};

export type StaffUpdatePayload = Omit<
  StaffCreatePayload,
  "phoneNumber" | "email" | "password" | "roleId" | "roleName"
>;

export async function listStaff(params: PaginatedListParams) {
  const response = await apiClient.get("/staff", { params });
  return unwrapData<{ staff: StaffMember[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function getStaff(id: string) {
  const response = await apiClient.get(`/staff/${id}`);
  return unwrapData<{ staff: StaffMember }>(response.data).staff;
}

export async function createStaff(payload: StaffCreatePayload) {
  const response = await apiClient.post("/staff", payload);
  return unwrapData<{ staff: StaffMember }>(response.data).staff;
}

export async function updateStaff(id: string, payload: Partial<StaffUpdatePayload>) {
  const response = await apiClient.patch(`/staff/${id}`, payload);
  return unwrapData<{ staff: StaffMember }>(response.data).staff;
}

export async function deleteStaff(id: string) {
  await apiClient.delete(`/staff/${id}`);
}

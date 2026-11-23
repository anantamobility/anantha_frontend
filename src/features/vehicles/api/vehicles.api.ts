import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { Vehicle, VehicleTyre } from "@/features/shared/entities";
import { sanitizeImportRows } from "@/features/shared/utils/importRows";
import type {
  VehicleImportCommitResponse,
  VehicleImportRow,
  VehicleImportValidateResponse,
} from "./vehicleImport.types";

const VEHICLE_IMPORT_DATE_FIELDS = [
  "acquiredAt",
  "dateOfPurchase",
  "dateOfDelivery",
  "dateOfRegistration",
  "dateOfOperation",
  "warrantyStartDate",
  "warrantyEndDate",
  "telematicsExpiryDate",
  "emiDueDate",
  "insuranceValidFrom",
  "insuranceValidTo",
];

function prepareVehicleImportRows(rows: VehicleImportRow[]) {
  return sanitizeImportRows(
    rows as Record<string, unknown>[],
    VEHICLE_IMPORT_DATE_FIELDS,
  );
}

export type VehiclePayload = {
  registrationNumber: string;
  hubId?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  vin?: string | null;
  acquiredAt?: string | null;
  isActive?: boolean;
  vehicleCategory?: string | null;
  vehicleType?: string | null;
  batteryType?: string | null;
  batteryCapacity?: number | null;
  nominalRange?: number | null;
  chargingOptions?: string | null;
  chargerProvided?: boolean | null;
  noOfTyres?: number | null;
  tyres?: VehicleTyre[] | null;
  batteryNumber?: string | null;
  batteryModelNumber?: string | null;
  batteryBrand?: string | null;
  registrationType?: string | null;
  ownershipType?: string | null;
  dateOfPurchase?: string | null;
  dateOfDelivery?: string | null;
  dateOfRegistration?: string | null;
  dateOfOperation?: string | null;
  warrantyStartDate?: string | null;
  warrantyEndDate?: string | null;
  telematicsExpiryDate?: string | null;
  loanProvider?: string | null;
  emiAmount?: number | null;
  tenurePeriod?: number | null;
  emiDueDate?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceProvider?: string | null;
  insurancePolicyType?: string | null;
  insuranceValidFrom?: string | null;
  insuranceValidTo?: string | null;
  insurancePremiumAmount?: number | null;
  insuranceStatus?: string | null;
  insuranceThirdParty?: string | null;
};

export type VehicleStatusPayload = {
  status:
    | "IDLE"
    | "DEPLOYED"
    | "IN_SERVICE"
    | "UNDER_REPAIR"
    | "OUT_OF_SERVICE"
    | "RETIRED";
  reason?: string;
  notes?: string;
};

export async function listVehicles(params: PaginatedListParams) {
  const response = await apiClient.get("/vehicles", { params });
  return unwrapData<{ vehicles: Vehicle[]; pagination: PaginationMeta }>(response.data);
}

export async function getVehicle(id: string) {
  const response = await apiClient.get(`/vehicles/${id}`);
  return unwrapData<{ vehicle: Vehicle }>(response.data).vehicle;
}

export async function createVehicle(payload: VehiclePayload) {
  const response = await apiClient.post("/vehicles", payload);
  return unwrapData<{ vehicle: Vehicle }>(response.data).vehicle;
}

export async function updateVehicle(id: string, payload: Partial<VehiclePayload>) {
  const response = await apiClient.patch(`/vehicles/${id}`, payload);
  return unwrapData<{ vehicle: Vehicle }>(response.data).vehicle;
}

export async function updateVehicleStatus(id: string, payload: VehicleStatusPayload) {
  const response = await apiClient.patch(`/vehicles/${id}/status`, payload);
  return unwrapData<{ vehicle: Vehicle }>(response.data).vehicle;
}

export async function deleteVehicle(id: string) {
  await apiClient.delete(`/vehicles/${id}`);
}

export async function validateVehicleImport(rows: VehicleImportRow[]) {
  const response = await apiClient.post("/vehicles/import/validate", {
    rows: prepareVehicleImportRows(rows),
  });
  return unwrapData<VehicleImportValidateResponse>(response.data);
}

export async function importVehicles(rows: VehicleImportRow[]) {
  const response = await apiClient.post("/vehicles/import", {
    rows: prepareVehicleImportRows(rows),
  });
  return unwrapData<VehicleImportCommitResponse>(response.data);
}

import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type {
  Collection,
  Deposit,
  Rental,
  RentalDue,
} from "@/features/shared/entities";

export type ManualPricingPayload = {
  dailyRate: string;
  weeklyRate?: string | null;
  fortnightlyRate?: string | null;
  monthlyRate?: string | null;
  securityDeposit?: string | null;
  notes?: string | null;
};

export type CreateRentalPayload = {
  rentalType: "B2C" | "B2B";
  b2cMode?: "AML_RIDER" | "INDIVIDUAL_RIDER" | null;
  b2bRiderMgmt?: "CLIENT_MANAGED" | "AML_MANAGED" | null;
  clientId: string;
  riderId?: string | null;
  hubId: string;
  vehicleId: string;
  startDate: string;
  expectedEndDate?: string | null;
  collectionPeriod: "WEEKLY" | "FORTNIGHTLY" | "MONTHLY";
  securityDepositAmount: string;
  manualPricing: ManualPricingPayload;
  notes?: string | null;
};

export type CloseRentalPayload = {
  endDate?: string;
  vehicleReturnStatus?: "IDLE" | "IN_SERVICE" | "UNDER_REPAIR" | "OUT_OF_SERVICE";
  notes?: string;
};

export type ReceiveDepositPayload = {
  amount: string;
  paymentMethod:
    | "CASH"
    | "UPI"
    | "CARD"
    | "BANK_TRANSFER"
    | "CHEQUE"
    | "OTHER";
  reference?: string | null;
  reason?: string | null;
  receivedAt?: string;
};

export type RefundDepositPayload = {
  amount: string;
  reference?: string | null;
  reason?: string | null;
};

export type RentalDepositView = {
  deposit: Deposit;
  balance: string | number;
  totalCredits: string | number;
  totalDebits: string | number;
};

function idempotencyHeaders() {
  return {
    "Idempotency-Key":
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
}

export async function listRentals(params: PaginatedListParams) {
  const response = await apiClient.get("/rentals", { params });
  return unwrapData<{ rentals: Rental[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function getRental(id: string) {
  const response = await apiClient.get(`/rentals/${id}`);
  return unwrapData<{ rental: Rental }>(response.data).rental;
}

export async function createRental(payload: CreateRentalPayload) {
  const response = await apiClient.post("/rentals", payload);
  return unwrapData<{ rental: Rental }>(response.data).rental;
}

export async function closeRental(id: string, payload: CloseRentalPayload = {}) {
  const response = await apiClient.patch(`/rentals/${id}/close`, payload);
  return unwrapData<{ rental: Rental }>(response.data);
}

export async function listRentalDues(id: string, params: PaginatedListParams = {}) {
  const response = await apiClient.get(`/rentals/${id}/dues`, { params });
  return unwrapData<{ dues: RentalDue[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function generateRentalDues(
  id: string,
  payload: { throughDate?: string } = {},
) {
  const response = await apiClient.post(`/rentals/${id}/dues/generate`, payload);
  return unwrapData<{ generated?: number; dues?: RentalDue[] }>(response.data);
}

export async function listRentalCollections(
  id: string,
  params: PaginatedListParams = {},
) {
  const response = await apiClient.get("/collections", {
    params: { ...params, rentalId: id },
  });
  return unwrapData<{ collections: Collection[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function getRentalDeposit(id: string) {
  const response = await apiClient.get(`/rentals/${id}/deposit`);
  return unwrapData<RentalDepositView>(response.data);
}

export async function receiveRentalDeposit(
  id: string,
  payload: ReceiveDepositPayload,
) {
  const response = await apiClient.post(`/rentals/${id}/deposit/receive`, payload, {
    headers: idempotencyHeaders(),
  });
  return unwrapData<unknown>(response.data);
}

export async function refundRentalDeposit(
  id: string,
  payload: RefundDepositPayload,
) {
  const response = await apiClient.post(`/rentals/${id}/deposit/refund`, payload, {
    headers: idempotencyHeaders(),
  });
  return unwrapData<unknown>(response.data);
}

export type DepositLedgerTransaction = {
  id: string;
  type: string;
  direction: string;
  amount: string | number;
  reference?: string | null;
  reason?: string | null;
  createdAt?: string;
};

export async function getDepositLedger(
  depositId: string,
  params: PaginatedListParams = {},
) {
  const response = await apiClient.get(`/deposits/${depositId}/ledger`, {
    params,
  });
  return unwrapData<{
    depositId: string;
    balance: string | number;
    totalCredits: string | number;
    totalDebits: string | number;
    transactions: DepositLedgerTransaction[];
    pagination: PaginationMeta;
  }>(response.data);
}

import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";

export type PayStatementStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "PAYABLE"
  | "APPROVED"
  | "PAID"
  | "FAILED"
  | "RECONCILED"
  | "REVERSED"
  | string;

export type PayStatementLine = {
  id: string;
  lineType: string;
  direction: string;
  amount: string | number;
  description?: string | null;
  rentalId?: string | null;
  createdAt?: string;
};

export type PayStatement = {
  id: string;
  statementNumber: string;
  riderId: string;
  periodStart: string;
  periodEnd: string;
  status: PayStatementStatus;
  grossCredits: string | number;
  totalDeductions: string | number;
  netPayable: string | number;
  shortfallAmount?: string | number | null;
  requiresManualReview?: boolean;
  paidAt?: string | null;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  failureReason?: string | null;
  rider?: {
    id: string;
    riderCode?: string | null;
    fullName: string;
  } | null;
  lines?: PayStatementLine[];
  createdAt?: string;
};

export type GeneratePayStatementPayload = {
  riderId: string;
  periodStart: string;
  cycle?: "WEEKLY";
  grossCredits: string;
  earningsReference?: string | null;
  notes?: string | null;
};

export type PayStatementPaymentPayload = {
  paymentMethod:
    | "CASH"
    | "UPI"
    | "CARD"
    | "BANK_TRANSFER"
    | "CHEQUE"
    | "OTHER";
  referenceNumber?: string | null;
  paidAt?: string;
  notes?: string | null;
};

function idempotencyHeaders() {
  return {
    "Idempotency-Key":
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
}

export async function listPayStatements(
  params: PaginatedListParams & {
    riderId?: string;
    status?: string;
  } = {},
) {
  const response = await apiClient.get("/pay-statements", { params });
  return unwrapData<{
    payStatements: PayStatement[];
    pagination: PaginationMeta;
  }>(response.data);
}

export async function getPayStatement(id: string) {
  const response = await apiClient.get(`/pay-statements/${id}`);
  return unwrapData<{ payStatement: PayStatement }>(response.data)
    .payStatement;
}

export async function generatePayStatement(
  payload: GeneratePayStatementPayload,
) {
  const response = await apiClient.post("/pay-statements/generate", payload, {
    headers: idempotencyHeaders(),
  });
  return unwrapData<{
    payStatement: PayStatement;
    duplicate?: boolean;
  }>(response.data);
}

export async function payPayStatement(
  id: string,
  payload: PayStatementPaymentPayload,
) {
  const response = await apiClient.post(`/pay-statements/${id}/pay`, payload, {
    headers: idempotencyHeaders(),
  });
  return unwrapData<{
    payStatement: PayStatement;
    duplicate?: boolean;
  }>(response.data);
}

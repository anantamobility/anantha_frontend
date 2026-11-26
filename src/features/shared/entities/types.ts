import type { AddressForm } from "@/features/shared/utils/formValues";

export type Hub = {
  id: string;
  name: string;
  hubCode: string;
  city: string;
  state: string;
  address?: AddressForm | Record<string, unknown> | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  isActive: boolean;
  createdAt?: string;
};

export type VehicleTyre = {
  position?: string | null;
  size?: string | null;
  serialNumber?: string | null;
  brand?: string | null;
};

export type Vehicle = {
  id: string;
  registrationNumber: string;
  hubId?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  vin?: string | null;
  acquiredAt?: string | null;
  status: string;
  statusChangedAt?: string | null;
  isActive: boolean;
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
  emiAmount?: string | number | null;
  tenurePeriod?: number | null;
  emiDueDate?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceProvider?: string | null;
  insurancePolicyType?: string | null;
  insuranceValidFrom?: string | null;
  insuranceValidTo?: string | null;
  insurancePremiumAmount?: string | number | null;
  insuranceStatus?: string | null;
  insuranceThirdParty?: string | null;
};

export type RiderUser = {
  id: string;
  email?: string | null;
  phoneNumber: string;
  status?: "ONBOARDING" | "ACTIVE" | "SUSPENDED" | string;
  role?: { id: string; name: string } | null;
};

export type Rider = {
  id: string;
  userId?: string;
  fullName: string;
  riderCode?: string | null;
  status: string;
  statusChangedAt?: string | null;
  rentalType: string;
  b2cMode?: string | null;
  b2bRiderMgmt?: string | null;
  clientId?: string | null;
  hubId?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: AddressForm | Record<string, unknown> | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  aadharNumber?: string | null;
  panNumber?: string | null;
  licenseNumber?: string | null;
  medicalReportExpiryDate?: string | null;
  agreementDate?: string | null;
  policeVerificationValidUpto?: string | null;
  backgroundVerificationExpiryDate?: string | null;
  dateOfLastWorkingDay?: string | null;
  bankName?: string | null;
  branch?: string | null;
  user?: RiderUser | null;
  createdAt?: string;
};

export type RateCard = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  rentalType?: string | null;
  dailyRate: string | number;
  weeklyRate?: string | number | null;
  fortnightlyRate?: string | number | null;
  monthlyRate?: string | number | null;
  securityDeposit?: string | number | null;
  vehicleCategory?: string | null;
  terms?: unknown;
  isActive: boolean;
};

export type ClientContract = {
  id: string;
  contractNumber: string;
  clientId: string;
  hubId?: string | null;
  riderManagement: "CLIENT_MANAGED" | "AML_MANAGED" | string;
  startDate: string;
  endDate?: string | null;
  vehicleCount: number;
  vehicleModels: string[];
  dailyRate: string | number;
  securityDeposit?: string | number | null;
  billingFrequency: "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | string;
  minBillingDays?: number | null;
  graceDays?: number | null;
  paymentTermsDays?: number | null;
  replacementRules?: string | null;
  downtimeRules?: string | null;
  damageRecoveryRules?: string | null;
  taxDetails?: unknown;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Client = {
  id: string;
  clientCode?: string | null;
  name: string;
  companyName?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  contracts?: ClientContract[];
  createdAt?: string;
  updatedAt?: string;
};

export type Rental = {
  id: string;
  rentalNumber?: string;
  rentalType: "B2C" | "B2B";
  b2cMode?: string | null;
  b2bRiderMgmt?: string | null;
  status: string;
  clientId: string;
  riderId?: string | null;
  hubId: string;
  startDate: string;
  expectedEndDate?: string | null;
  endDate?: string | null;
  activatedAt?: string | null;
  closedAt?: string | null;
  collectionPeriod: string;
  securityDepositRequired?: string | number | null;
  notes?: string | null;
  client?: { id: string; name: string; clientCode?: string | null } | null;
  rider?: { id: string; fullName: string; riderCode?: string | null } | null;
  hub?: { id: string; name: string; hubCode?: string } | null;
  assignments?: Array<{
    id: string;
    vehicleId: string;
    status: string;
    vehicle?: { id: string; registrationNumber: string } | null;
  }>;
  createdAt?: string;
};

export type RentalDue = {
  id: string;
  rentalId: string;
  status: string;
  dueDate: string;
  periodStart?: string;
  periodEnd?: string;
  amountDue?: string | number;
  amountCollected?: string | number;
  outstandingAmount?: string | number;
};

export type Collection = {
  id: string;
  rentalDueId?: string | null;
  clientId?: string | null;
  riderId?: string | null;
  purpose?: string;
  amount: string | number;
  paymentMethod: string;
  referenceNumber?: string | null;
  receivedAt?: string;
  notes?: string | null;
  rentalDue?: {
    id: string;
    rentalId?: string;
    periodStart?: string;
    periodEnd?: string;
  } | null;
  createdAt?: string;
};

export type Deposit = {
  id: string;
  rentalId?: string;
  amountRequired?: string | number;
  status?: string;
  dueDate?: string | null;
  notes?: string | null;
};

export type LedgerEntry = {
  id: string;
  riderId?: string | null;
  rentalId?: string | null;
  entryType?: string;
  direction?: string;
  amount: string | number;
  occurredAt?: string;
  description?: string | null;
  rider?: { id: string; riderCode?: string | null; fullName: string } | null;
  rental?: { id: string; rentalNumber?: string; status?: string } | null;
  createdAt?: string;
};

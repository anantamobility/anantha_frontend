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
  effectiveFrom?: string;
  effectiveTo?: string | null;
  terms?: unknown;
  isActive: boolean;
};

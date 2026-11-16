export type Hub = {
  id: string;
  name: string;
  hubCode: string;
  city: string;
  state: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  isActive: boolean;
  createdAt?: string;
};

export type Vehicle = {
  id: string;
  registrationNumber: string;
  hubId?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  status: string;
  statusChangedAt?: string | null;
  isActive: boolean;
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
  policeVerificationValidUpto?: string | null;
  backgroundVerificationExpiryDate?: string | null;
  user?: RiderUser | null;
};

export type RateCard = {
  id: string;
  code: string;
  name: string;
  rentalType?: string | null;
  dailyRate: string | number;
  weeklyRate?: string | number | null;
  fortnightlyRate?: string | number | null;
  monthlyRate?: string | number | null;
  securityDeposit?: string | number | null;
  vehicleCategory?: string | null;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isActive: boolean;
};

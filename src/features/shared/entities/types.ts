export type Hub = {
  id: string;
  name: string;
  code: string;
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
  isActive: boolean;
};

export type Rider = {
  id: string;
  fullName: string;
  riderCode?: string | null;
  phoneNumber: string;
  email?: string | null;
  status: string;
  rentalType: string;
  b2cMode?: string | null;
  clientId?: string | null;
  hubId?: string | null;
};

export type Client = {
  id: string;
  clientCode: string;
  type: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
};

export type RateCard = {
  id: string;
  code: string;
  name: string;
  rentalType?: string | null;
  billingFrequency?: string | null;
  dailyRate: string | number;
  weeklyRate?: string | number | null;
  securityDeposit?: string | number | null;
  currency: string;
  isActive: boolean;
};

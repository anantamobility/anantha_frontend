import type { Vehicle, VehicleTyre } from "@/features/shared/entities";
import {
  emptyToDate,
  emptyToNull,
  emptyToNumber,
  toDateInput,
} from "@/features/shared/utils/formValues";
import type { VehiclePayload } from "./api/vehicles.api";

export type VehicleFormState = {
  registrationNumber: string;
  hubId: string;
  make: string;
  model: string;
  year: string;
  color: string;
  vin: string;
  acquiredAt: string;
  isActive: boolean;
  vehicleCategory: string;
  vehicleType: string;
  batteryType: string;
  batteryCapacity: string;
  nominalRange: string;
  chargingOptions: string;
  chargerProvided: "" | "true" | "false";
  noOfTyres: string;
  tyres: VehicleTyre[];
  batteryNumber: string;
  batteryModelNumber: string;
  batteryBrand: string;
  registrationType: string;
  ownershipType: string;
  dateOfPurchase: string;
  dateOfDelivery: string;
  dateOfRegistration: string;
  dateOfOperation: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  telematicsExpiryDate: string;
  loanProvider: string;
  emiAmount: string;
  tenurePeriod: string;
  emiDueDate: string;
  insurancePolicyNumber: string;
  insuranceProvider: string;
  insurancePolicyType: string;
  insuranceValidFrom: string;
  insuranceValidTo: string;
  insurancePremiumAmount: string;
  insuranceStatus: string;
  insuranceThirdParty: string;
};

export const EMPTY_VEHICLE_FORM: VehicleFormState = {
  registrationNumber: "",
  hubId: "",
  make: "",
  model: "",
  year: "",
  color: "",
  vin: "",
  acquiredAt: "",
  isActive: true,
  vehicleCategory: "",
  vehicleType: "",
  batteryType: "",
  batteryCapacity: "",
  nominalRange: "",
  chargingOptions: "",
  chargerProvided: "",
  noOfTyres: "",
  tyres: [],
  batteryNumber: "",
  batteryModelNumber: "",
  batteryBrand: "",
  registrationType: "",
  ownershipType: "",
  dateOfPurchase: "",
  dateOfDelivery: "",
  dateOfRegistration: "",
  dateOfOperation: "",
  warrantyStartDate: "",
  warrantyEndDate: "",
  telematicsExpiryDate: "",
  loanProvider: "",
  emiAmount: "",
  tenurePeriod: "",
  emiDueDate: "",
  insurancePolicyNumber: "",
  insuranceProvider: "",
  insurancePolicyType: "",
  insuranceValidFrom: "",
  insuranceValidTo: "",
  insurancePremiumAmount: "",
  insuranceStatus: "",
  insuranceThirdParty: "",
};

export function vehicleToForm(vehicle: Vehicle): VehicleFormState {
  return {
    registrationNumber: vehicle.registrationNumber,
    hubId: vehicle.hubId ?? "",
    make: vehicle.make ?? "",
    model: vehicle.model ?? "",
    year: vehicle.year != null ? String(vehicle.year) : "",
    color: vehicle.color ?? "",
    vin: vehicle.vin ?? "",
    acquiredAt: toDateInput(vehicle.acquiredAt),
    isActive: vehicle.isActive,
    vehicleCategory: vehicle.vehicleCategory ?? "",
    vehicleType: vehicle.vehicleType ?? "",
    batteryType: vehicle.batteryType ?? "",
    batteryCapacity:
      vehicle.batteryCapacity != null ? String(vehicle.batteryCapacity) : "",
    nominalRange: vehicle.nominalRange != null ? String(vehicle.nominalRange) : "",
    chargingOptions: vehicle.chargingOptions ?? "",
    chargerProvided:
      vehicle.chargerProvided == null
        ? ""
        : vehicle.chargerProvided
          ? "true"
          : "false",
    noOfTyres: vehicle.noOfTyres != null ? String(vehicle.noOfTyres) : "",
    tyres: vehicle.tyres?.length
      ? vehicle.tyres.map((tyre) => ({
          position: tyre.position ?? "",
          size: tyre.size ?? "",
          serialNumber: tyre.serialNumber ?? "",
          brand: tyre.brand ?? "",
        }))
      : [],
    batteryNumber: vehicle.batteryNumber ?? "",
    batteryModelNumber: vehicle.batteryModelNumber ?? "",
    batteryBrand: vehicle.batteryBrand ?? "",
    registrationType: vehicle.registrationType ?? "",
    ownershipType: vehicle.ownershipType ?? "",
    dateOfPurchase: toDateInput(vehicle.dateOfPurchase),
    dateOfDelivery: toDateInput(vehicle.dateOfDelivery),
    dateOfRegistration: toDateInput(vehicle.dateOfRegistration),
    dateOfOperation: toDateInput(vehicle.dateOfOperation),
    warrantyStartDate: toDateInput(vehicle.warrantyStartDate),
    warrantyEndDate: toDateInput(vehicle.warrantyEndDate),
    telematicsExpiryDate: toDateInput(vehicle.telematicsExpiryDate),
    loanProvider: vehicle.loanProvider ?? "",
    emiAmount: vehicle.emiAmount != null ? String(vehicle.emiAmount) : "",
    tenurePeriod: vehicle.tenurePeriod != null ? String(vehicle.tenurePeriod) : "",
    emiDueDate: toDateInput(vehicle.emiDueDate),
    insurancePolicyNumber: vehicle.insurancePolicyNumber ?? "",
    insuranceProvider: vehicle.insuranceProvider ?? "",
    insurancePolicyType: vehicle.insurancePolicyType ?? "",
    insuranceValidFrom: toDateInput(vehicle.insuranceValidFrom),
    insuranceValidTo: toDateInput(vehicle.insuranceValidTo),
    insurancePremiumAmount:
      vehicle.insurancePremiumAmount != null
        ? String(vehicle.insurancePremiumAmount)
        : "",
    insuranceStatus: vehicle.insuranceStatus ?? "",
    insuranceThirdParty: vehicle.insuranceThirdParty ?? "",
  };
}

export function vehicleFormToPayload(form: VehicleFormState): VehiclePayload {
  const tyres = form.tyres
    .map((tyre) => ({
      position: emptyToNull(String(tyre.position ?? "")),
      size: emptyToNull(String(tyre.size ?? "")),
      serialNumber: emptyToNull(String(tyre.serialNumber ?? "")),
      brand: emptyToNull(String(tyre.brand ?? "")),
    }))
    .filter((tyre) =>
      Object.values(tyre).some((value) => value !== null),
    );

  return {
    registrationNumber: form.registrationNumber.trim(),
    hubId: form.hubId || null,
    make: emptyToNull(form.make),
    model: emptyToNull(form.model),
    year: emptyToNumber(form.year),
    color: emptyToNull(form.color),
    vin: emptyToNull(form.vin),
    acquiredAt: emptyToDate(form.acquiredAt),
    isActive: form.isActive,
    vehicleCategory: emptyToNull(form.vehicleCategory),
    vehicleType: emptyToNull(form.vehicleType),
    batteryType: emptyToNull(form.batteryType),
    batteryCapacity: emptyToNumber(form.batteryCapacity),
    nominalRange: emptyToNumber(form.nominalRange),
    chargingOptions: emptyToNull(form.chargingOptions),
    chargerProvided:
      form.chargerProvided === ""
        ? null
        : form.chargerProvided === "true",
    noOfTyres: emptyToNumber(form.noOfTyres),
    tyres: tyres.length ? tyres : null,
    batteryNumber: emptyToNull(form.batteryNumber),
    batteryModelNumber: emptyToNull(form.batteryModelNumber),
    batteryBrand: emptyToNull(form.batteryBrand),
    registrationType: emptyToNull(form.registrationType),
    ownershipType: emptyToNull(form.ownershipType),
    dateOfPurchase: emptyToDate(form.dateOfPurchase),
    dateOfDelivery: emptyToDate(form.dateOfDelivery),
    dateOfRegistration: emptyToDate(form.dateOfRegistration),
    dateOfOperation: emptyToDate(form.dateOfOperation),
    warrantyStartDate: emptyToDate(form.warrantyStartDate),
    warrantyEndDate: emptyToDate(form.warrantyEndDate),
    telematicsExpiryDate: emptyToDate(form.telematicsExpiryDate),
    loanProvider: emptyToNull(form.loanProvider),
    emiAmount: emptyToNumber(form.emiAmount),
    tenurePeriod: emptyToNumber(form.tenurePeriod),
    emiDueDate: emptyToDate(form.emiDueDate),
    insurancePolicyNumber: emptyToNull(form.insurancePolicyNumber),
    insuranceProvider: emptyToNull(form.insuranceProvider),
    insurancePolicyType: emptyToNull(form.insurancePolicyType),
    insuranceValidFrom: emptyToDate(form.insuranceValidFrom),
    insuranceValidTo: emptyToDate(form.insuranceValidTo),
    insurancePremiumAmount: emptyToNumber(form.insurancePremiumAmount),
    insuranceStatus: emptyToNull(form.insuranceStatus),
    insuranceThirdParty: emptyToNull(form.insuranceThirdParty),
  };
}

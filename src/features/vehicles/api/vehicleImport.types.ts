export type VehicleImportRow = Record<string, string | number | boolean | null>;

export type VehicleImportValidateRowResult = {
  rowIndex: number;
  ok: boolean;
  errors: string[];
};

export type VehicleImportValidateResponse = {
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
  results: VehicleImportValidateRowResult[];
};

export type VehicleImportCommitRowResult = {
  rowIndex: number;
  ok: boolean;
  id?: string;
  errors?: string[];
};

export type VehicleImportCommitResponse = {
  summary: {
    total: number;
    created: number;
    failed: number;
  };
  results: VehicleImportCommitRowResult[];
};

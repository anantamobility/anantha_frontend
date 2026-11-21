export type RiderImportRow = Record<string, string | null>;

export type RiderImportValidateRowResult = {
  rowIndex: number;
  ok: boolean;
  errors: string[];
};

export type RiderImportValidateResponse = {
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
  results: RiderImportValidateRowResult[];
};

export type RiderImportCommitRowResult = {
  rowIndex: number;
  ok: boolean;
  id?: string;
  phoneNumber?: string;
  temporaryPassword?: string;
  errors?: string[];
};

export type RiderImportCommitResponse = {
  summary: {
    total: number;
    created: number;
    failed: number;
  };
  results: RiderImportCommitRowResult[];
};

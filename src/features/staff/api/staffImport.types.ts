export type StaffImportRow = Record<string, string | null>;

export type StaffImportValidateRowResult = {
  rowIndex: number;
  ok: boolean;
  errors: string[];
};

export type StaffImportValidateResponse = {
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
  results: StaffImportValidateRowResult[];
};

export type StaffImportCommitRowResult = {
  rowIndex: number;
  ok: boolean;
  id?: string;
  phoneNumber?: string;
  fullName?: string;
  temporaryPassword?: string;
  errors?: string[];
};

export type StaffImportCommitResponse = {
  summary: {
    total: number;
    created: number;
    failed: number;
  };
  results: StaffImportCommitRowResult[];
};

export type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  redirectTo?: string;
  temporaryPassword?: string;
  requiresTotp?: boolean;
  recoveryCodes?: string[];
  qrCodeDataUrl?: string;
  fieldErrors?: Record<string, string>;
};

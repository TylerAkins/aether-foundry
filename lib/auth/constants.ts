export const SESSION_COOKIE_NAME = "aether_session";
export const PRODUCTION_SESSION_COOKIE_NAME = "__Host-aether_session";
export const PENDING_LOGIN_COOKIE_NAME = "aether_pending_login";
export const PRODUCTION_PENDING_LOGIN_COOKIE_NAME = "__Host-aether_pending_login";

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
export const PENDING_LOGIN_TTL_MS = 1000 * 60 * 10;
export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
export const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 30;
export const MAX_PENDING_LOGIN_ATTEMPTS = 5;
export const RECOVERY_CODE_COUNT = 10;

export const LOGIN_INVALID_MESSAGE =
  "The email or password you entered is incorrect.";
export const RESET_REQUEST_MESSAGE =
  "If an active employee account exists for that email, a reset link has been sent.";
export const VERIFICATION_REQUEST_MESSAGE =
  "If that employee account needs verification, a verification link has been sent.";
export const TOTP_INVALID_MESSAGE = "The verification code is invalid.";

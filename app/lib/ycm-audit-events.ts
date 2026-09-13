export const YCM_AUDIT_EVENTS = [
  'AUTH_LOGIN_SUCCESS',
  'AUTH_LOGIN_FAILED',
  'AUTH_OTP_ISSUED',
  'AUTH_OTP_VERIFIED',
  'AUTH_LOGOUT',
  'AUTH_SESSION_EXPIRED',
  'AUTH_ACCESS_DENIED',
  'AUTH_PRIVILEGED_REAUTH',
  'FAMILY_RESOURCE_ACCESS',
  'EMPLOYEE_CASE_ACCESS',
  'SENSITIVE_DATA_ACCESS',
  'CONSENT_CREATED',
  'CONSENT_REVOKED',
] as const;

export type YcmAuditEvent = (typeof YCM_AUDIT_EVENTS)[number];

export type YcmAuditRecord = {
  event: YcmAuditEvent;
  subject: string;
  role: string;
  sessionId?: string;
  familyId?: string;
  employeeId?: string;
  resourceType?: string;
  resourceId?: string;
  success: boolean;
  createdAt: string;
};

export function buildAuditRecord(input: Omit<YcmAuditRecord, 'createdAt'>): YcmAuditRecord {
  return { ...input, createdAt: new Date().toISOString() };
}

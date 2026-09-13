export const YCM_SECURITY_POLICY = {
  session: {
    cookieName: 'ycm_session',
    httpOnly: true,
    sameSite: 'lax' as const,
    secureInProduction: true,
    maxAgeSeconds: 8 * 60 * 60,
    noStore: true,
  },
  privilegedRoles: ['ceo', 'management', 'admin'] as const,
  identityVerification: {
    family: ['otp'] as const,
    employee: ['credential', 'otp-or-mfa'] as const,
    management: ['credential', 'mfa'] as const,
    ceo: ['credential', 'mfa', 'reauth-for-sensitive-actions'] as const,
    admin: ['credential', 'mfa'] as const,
    partner: ['credential', 'otp-or-mfa'] as const,
    referral: ['credential', 'otp-or-mfa'] as const,
  },
  isolation: {
    familyRequiresMatchingFamilyId: true,
    employeeRequiresAssignedEmployeeId: true,
    privilegedAccessMustUseRolePermissionChecks: true,
    denyByDefaultForUnknownProtectedResources: true,
  },
  sensitiveData: {
    rawAadhaarStorage: false,
    consentRequiredForProtectedFamilyData: true,
    auditRequiredForAuthAndSensitiveActions: true,
  },
} as const;

export type YcmPrivilegedRole = (typeof YCM_SECURITY_POLICY.privilegedRoles)[number];

export function isPrivilegedRole(role: string): role is YcmPrivilegedRole {
  return (YCM_SECURITY_POLICY.privilegedRoles as readonly string[]).includes(role);
}

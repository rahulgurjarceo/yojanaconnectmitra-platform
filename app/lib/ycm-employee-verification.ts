import type postgres from 'postgres';

export type EmployeeVerificationStatus = 'pending' | 'verified' | 'suspended' | 'rejected';

export async function getEmployeeVerificationStatus(
  sql: ReturnType<typeof postgres>,
  userId: string,
): Promise<EmployeeVerificationStatus | null> {
  const row = (await sql`SELECT status FROM ycm_employee_verifications
    WHERE user_id=${userId} LIMIT 1`)[0] as { status?: EmployeeVerificationStatus } | undefined;
  return row?.status || null;
}

export async function requireVerifiedEmployee(
  sql: ReturnType<typeof postgres>,
  role: string,
  userId: string,
) {
  if (role !== 'employee') return null;
  const status = await getEmployeeVerificationStatus(sql, userId);
  if (status !== 'verified') {
    return {
      success: false,
      code: 'EMPLOYEE_VERIFICATION_REQUIRED',
      verificationStatus: status || 'pending',
    } as const;
  }
  return null;
}

import postgres from 'postgres';
import type { CustomerFamilyRepository, FamilyActivationState, FamilyOtpChallenge, FamilyRecord } from './customer-family-db';

function getClient() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;
  return postgres(url, { max: 5, prepare: false, connect_timeout: 10, idle_timeout: 20 });
}
function mapRow(row: Record<string, unknown>): FamilyRecord {
  return { familyId: String(row.family_id), status: row.status as FamilyRecord['status'], fullName: String(row.full_name), mobile: String(row.mobile), country: String(row.country), createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString() };
}
function mapOtpRow(row: Record<string, unknown>): FamilyOtpChallenge {
  return {
    familyId: row.family_id == null ? null : String(row.family_id),
    mobile: String(row.mobile),
    status: row.status as FamilyOtpChallenge['status'],
    expiresAt: new Date(String(row.expires_at)).toISOString(),
  };
}
export class PostgresCustomerFamilyRepository implements CustomerFamilyRepository {
  private readonly sql = getClient();
  isConfigured(): boolean { return this.sql !== null; }
  async create(input: Omit<FamilyRecord, 'createdAt' | 'updatedAt'>): Promise<FamilyRecord> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    const rows = await this.sql`INSERT INTO ycm_families (family_id, plan_name, amount_paise, currency, validity_years, status, full_name, mobile, country) VALUES (${input.familyId}, 'Family Registration', 9900, 'INR', 2, ${input.status}, ${input.fullName}, ${input.mobile}, ${input.country}) RETURNING family_id, status, full_name, mobile, country, created_at, updated_at`;
    return mapRow(rows[0] as unknown as Record<string, unknown>);
  }
  async findById(familyId: string): Promise<FamilyRecord | null> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    const rows = await this.sql`SELECT family_id, status, full_name, mobile, country, created_at, updated_at FROM ycm_families WHERE family_id = ${familyId} LIMIT 1`;
    return rows.length ? mapRow(rows[0] as unknown as Record<string, unknown>) : null;
  }
  async updateStatus(familyId: string, status: FamilyRecord['status']): Promise<FamilyRecord | null> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    const rows = await this.sql`UPDATE ycm_families SET status = ${status}, updated_at = NOW() WHERE family_id = ${familyId} RETURNING family_id, status, full_name, mobile, country, created_at, updated_at`;
    return rows.length ? mapRow(rows[0] as unknown as Record<string, unknown>) : null;
  }
  async getActivationState(familyId: string): Promise<FamilyActivationState> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    const familyRows = await this.sql`SELECT mobile FROM ycm_families WHERE family_id = ${familyId} LIMIT 1`;
    if (!familyRows.length) throw new Error('FAMILY_NOT_FOUND');
    const mobile = String(familyRows[0].mobile);
    const otpRows = await this.sql`SELECT 1 FROM ycm_family_otp_challenges WHERE family_id = ${familyId} AND mobile = ${mobile} AND status = 'verified' ORDER BY verified_at DESC NULLS LAST, created_at DESC LIMIT 1`;
    const paymentRows = await this.sql`SELECT 1 FROM ycm_family_payments WHERE family_id = ${familyId} AND status = 'success' AND signature_verified = TRUE ORDER BY created_at DESC LIMIT 1`;
    return { otpVerified: otpRows.length > 0, paymentVerified: paymentRows.length > 0 };
  }
  async createOtpChallenge(input: { challengeId: string; familyId?: string; mobile: string; provider: string; expiresAt: string }): Promise<void> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    await this.sql`INSERT INTO ycm_family_otp_challenges (challenge_id, family_id, mobile, provider, status, expires_at) VALUES (${input.challengeId}, ${input.familyId || null}, ${input.mobile}, ${input.provider}, 'sent', ${input.expiresAt})`;
  }
  async getOtpChallenge(challengeId: string): Promise<FamilyOtpChallenge | null> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    const rows = await this.sql`SELECT family_id, mobile, status, expires_at FROM ycm_family_otp_challenges WHERE challenge_id = ${challengeId} LIMIT 1`;
    return rows.length ? mapOtpRow(rows[0] as unknown as Record<string, unknown>) : null;
  }
  async markOtpChallengeVerified(challengeId: string): Promise<boolean> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    const rows = await this.sql`UPDATE ycm_family_otp_challenges SET status = 'verified', verified_at = NOW() WHERE challenge_id = ${challengeId} AND status IN ('created','sent') AND expires_at > NOW() RETURNING challenge_id`;
    return rows.length > 0;
  }
  async markPaymentVerified(orderId: string, paymentId: string): Promise<boolean> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    const rows = await this.sql`UPDATE ycm_family_payments SET status = 'success', signature_verified = TRUE, provider_reference = ${paymentId} WHERE provider_reference = ${orderId} AND status IN ('created','pending') RETURNING payment_id`;
    return rows.length > 0;
  }
  async close(): Promise<void> { if (this.sql) await this.sql.end({ timeout: 5 }); }
}
let repository: PostgresCustomerFamilyRepository | null | undefined;
export function getPostgresCustomerFamilyRepository(): PostgresCustomerFamilyRepository | null {
  if (repository === undefined) { repository = new PostgresCustomerFamilyRepository(); if (!repository.isConfigured()) repository = null; }
  return repository;
}

import postgres from 'postgres';
import type { CustomerFamilyRepository, FamilyRecord } from './customer-family-db';

function getClient() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;
  return postgres(url, {
    max: 5,
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 20,
  });
}

function mapRow(row: Record<string, unknown>): FamilyRecord {
  return {
    familyId: String(row.family_id),
    status: row.status as FamilyRecord['status'],
    fullName: String(row.full_name),
    mobile: String(row.mobile),
    country: String(row.country),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export class PostgresCustomerFamilyRepository implements CustomerFamilyRepository {
  private readonly sql = getClient();

  isConfigured(): boolean {
    return this.sql !== null;
  }

  async create(input: Omit<FamilyRecord, 'createdAt' | 'updatedAt'>): Promise<FamilyRecord> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    const rows = await this.sql`
      INSERT INTO ycm_families
        (family_id, plan_name, amount_paise, currency, validity_years, status, full_name, mobile, country)
      VALUES
        (${input.familyId}, 'Family Registration', 9900, 'INR', 2, ${input.status}, ${input.fullName}, ${input.mobile}, ${input.country})
      RETURNING family_id, status, full_name, mobile, country, created_at, updated_at
    `;
    return mapRow(rows[0] as unknown as Record<string, unknown>);
  }

  async findById(familyId: string): Promise<FamilyRecord | null> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    const rows = await this.sql`
      SELECT family_id, status, full_name, mobile, country, created_at, updated_at
      FROM ycm_families
      WHERE family_id = ${familyId}
      LIMIT 1
    `;
    return rows.length ? mapRow(rows[0] as unknown as Record<string, unknown>) : null;
  }

  async updateStatus(familyId: string, status: FamilyRecord['status']): Promise<FamilyRecord | null> {
    if (!this.sql) throw new Error('DATABASE_NOT_CONFIGURED');
    const rows = await this.sql`
      UPDATE ycm_families
      SET status = ${status}, updated_at = NOW()
      WHERE family_id = ${familyId}
      RETURNING family_id, status, full_name, mobile, country, created_at, updated_at
    `;
    return rows.length ? mapRow(rows[0] as unknown as Record<string, unknown>) : null;
  }

  async close(): Promise<void> {
    if (this.sql) await this.sql.end({ timeout: 5 });
  }
}

let repository: PostgresCustomerFamilyRepository | null | undefined;

export function getPostgresCustomerFamilyRepository(): PostgresCustomerFamilyRepository | null {
  if (repository === undefined) {
    repository = new PostgresCustomerFamilyRepository();
    if (!repository.isConfigured()) repository = null;
  }
  return repository;
}

import postgres from 'postgres';

function client() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 3, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null;
}

export async function getFamilyResources(familyId: string) {
  const sql = client();
  if (!sql) throw new Error('DATABASE_NOT_CONFIGURED');
  try {
    const [cases, documents, consents, cri] = await Promise.all([
      sql`SELECT case_id, member_id, case_category_id, case_category_name, sub_service, status, created_at, updated_at FROM ycm_family_cases WHERE family_id = ${familyId} ORDER BY updated_at DESC`,
      sql`SELECT document_id, member_id, document_type, status, created_at, uploaded_at FROM ycm_family_documents WHERE family_id = ${familyId} ORDER BY created_at DESC`,
      sql`SELECT consent_id, member_id, consent_type, granted, policy_version, granted_at, created_at FROM ycm_family_consents WHERE family_id = ${familyId} ORDER BY created_at DESC`,
      sql`SELECT cri_id, case_id, assignment_status, tat_due_at, outcome, score, csat_score, feedback, created_at, updated_at FROM ycm_family_cri WHERE family_id = ${familyId} ORDER BY updated_at DESC`,
    ]);
    return { cases, documents, consents, cri };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function createFamilyCase(input: { familyId: string; memberId?: string | null; categoryId: string; categoryName: string; subService?: string | null }) {
  const sql = client();
  if (!sql) throw new Error('DATABASE_NOT_CONFIGURED');
  try {
    const rows = await sql`INSERT INTO ycm_family_cases (case_id, family_id, member_id, case_category_id, case_category_name, sub_service, status) VALUES (gen_random_uuid(), ${input.familyId}, ${input.memberId || null}, ${input.categoryId}, ${input.categoryName}, ${input.subService || null}, 'new') RETURNING case_id, family_id, member_id, case_category_id, case_category_name, sub_service, status, created_at, updated_at`;
    return rows[0];
  } finally { await sql.end({ timeout: 5 }); }
}

export async function createFamilyConsent(input: { familyId: string; memberId?: string | null; consentType: string; granted: boolean; policyVersion: string }) {
  const sql = client();
  if (!sql) throw new Error('DATABASE_NOT_CONFIGURED');
  try {
    const rows = await sql`INSERT INTO ycm_family_consents (consent_id, family_id, member_id, consent_type, granted, policy_version, granted_at) VALUES (gen_random_uuid(), ${input.familyId}, ${input.memberId || null}, ${input.consentType}, ${input.granted}, ${input.policyVersion}, ${input.granted ? sql`NOW()` : null}) RETURNING consent_id, family_id, member_id, consent_type, granted, policy_version, granted_at, created_at`;
    return rows[0];
  } finally { await sql.end({ timeout: 5 }); }
}

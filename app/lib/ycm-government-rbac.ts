import postgres from 'postgres';
import type { YcmSession } from './ycm-access-control';

export type GovernmentManagerScope = {
  geographyLevel: 'india'|'state'|'district'|'block'|'gram_panchayat'|'village'|'ward';
  stateCode?: string|null;
  districtCode?: string|null;
  blockCode?: string|null;
  gramPanchayatCode?: string|null;
  villageCode?: string|null;
  wardCode?: string|null;
};

export function canManageGovernmentContacts(session: YcmSession) {
  return ['ceo','management','admin','branch_manager'].includes(session.role);
}

export function isGlobalGovernmentExecutive(session: YcmSession) {
  return ['ceo','management','admin'].includes(session.role);
}

export function scopeMatches(scope: GovernmentManagerScope, target: GovernmentManagerScope) {
  if (scope.geographyLevel === 'india') return true;
  if (scope.geographyLevel === 'state') return scope.stateCode === target.stateCode;
  if (scope.geographyLevel === 'district') return scope.stateCode === target.stateCode && scope.districtCode === target.districtCode;
  if (scope.geographyLevel === 'block') return scope.stateCode === target.stateCode && scope.districtCode === target.districtCode && scope.blockCode === target.blockCode;
  if (scope.geographyLevel === 'gram_panchayat') return scope.stateCode === target.stateCode && scope.districtCode === target.districtCode && scope.blockCode === target.blockCode && scope.gramPanchayatCode === target.gramPanchayatCode;
  if (scope.geographyLevel === 'village') return scope.stateCode === target.stateCode && scope.districtCode === target.districtCode && scope.blockCode === target.blockCode && scope.gramPanchayatCode === target.gramPanchayatCode && scope.villageCode === target.villageCode;
  return scope.stateCode === target.stateCode && scope.districtCode === target.districtCode && scope.blockCode === target.blockCode && scope.wardCode === target.wardCode;
}

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? postgres(url, { max: 3, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null;
}

export async function governmentScopeAllows(session: YcmSession, target: GovernmentManagerScope) {
  if (isGlobalGovernmentExecutive(session)) return true;
  if (session.role !== 'branch_manager') return false;
  const sql = getDb();
  if (!sql) throw new Error('DATABASE_NOT_CONFIGURED');
  try {
    const rows = await sql.unsafe(
      `SELECT geography_level,state_code,district_code,block_code,gram_panchayat_code,village_code,ward_code
       FROM ycm_government_manager_scopes
       WHERE user_id=(SELECT id FROM ycm_users WHERE user_id=$1 LIMIT 1) AND active=TRUE`,
      [session.sub]
    );
    return rows.some((row: GovernmentManagerScope) => scopeMatches(row, target));
  } finally {
    await sql.end({ timeout: 3 });
  }
}

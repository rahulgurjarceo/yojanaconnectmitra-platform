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

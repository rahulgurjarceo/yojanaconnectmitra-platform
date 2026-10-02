export type YcmServiceStatus = 'draft' | 'pending_approval' | 'published' | 'paused' | 'archived';

export type YcmServiceActorRole =
  | 'ceo'
  | 'admin'
  | 'management'
  | 'employee';

export const YCM_SERVICE_PERMISSIONS = {
  ceo: ['service:create', 'service:edit', 'service:submit', 'service:approve', 'service:publish', 'service:pause', 'commission:configure'],
  admin: ['service:create', 'service:edit', 'service:submit', 'service:approve', 'service:publish', 'service:pause', 'commission:configure'],
  management: ['service:create', 'service:edit', 'service:submit', 'service:approve', 'service:publish', 'service:pause', 'commission:configure'],
  employee: ['service:create', 'service:edit', 'service:submit'],
} as const;

export type YcmServicePermission = typeof YCM_SERVICE_PERMISSIONS[keyof typeof YCM_SERVICE_PERMISSIONS][number];

export function hasServicePermission(role: string, permission: YcmServicePermission) {
  const permissions = YCM_SERVICE_PERMISSIONS[role as keyof typeof YCM_SERVICE_PERMISSIONS];
  return Boolean(permissions?.includes(permission as never));
}

export function canTransitionServiceStatus(role: string, from: YcmServiceStatus, to: YcmServiceStatus) {
  if (to === 'pending_approval') return hasServicePermission(role, 'service:submit') && (from === 'draft' || from === 'paused');
  if (to === 'published') return hasServicePermission(role, 'service:publish') && (from === 'pending_approval' || from === 'paused');
  if (to === 'paused') return hasServicePermission(role, 'service:pause') && from === 'published';
  if (to === 'archived') return hasServicePermission(role, 'service:edit') && from !== 'archived';
  return false;
}

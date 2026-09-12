export const CUSTOMER_FAMILY_360_INTEGRATION = {
  frontend: [
    'Family registration form',
    'Family ID display',
    'Member management',
    'Consent ledger',
    'Document vault',
    'Case/application tracking',
    'TAT and outcome status',
  ],
  backend: [
    'Route handlers',
    'Validation',
    'Database repository adapter',
    'OTP verification adapter',
    'Payment signature verification',
    'Activation gate',
    'Audit logging',
  ],
  infrastructure: [
    'DATABASE_URL',
    'OTP provider credentials',
    'Payment provider credentials',
    'HTTPS',
    'Backups',
    'Monitoring',
  ],
} as const;

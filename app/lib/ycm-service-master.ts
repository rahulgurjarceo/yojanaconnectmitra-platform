import type { YcmServiceMode } from '../ycm-service-catalog';

export type YcmServiceRecord = {
  serviceId: string;
  serviceCode: string;
  name: string;
  description?: string | null;
  domainId: string;
  category?: string | null;
  countryCode: string;
  stateCode?: string | null;
  providerCode?: string | null;
  providerServiceCode?: string | null;
  mode: YcmServiceMode;
  requiresConsent: boolean;
  eligibilityRules: Record<string, unknown>;
  documentRequirements: Array<Record<string, unknown>>;
  metadata: Record<string, unknown>;
  status: 'draft' | 'pending_approval' | 'published' | 'paused' | 'archived';
  createdBy?: string | null;
  updatedBy?: string | null;
  approvedBy?: string | null;
  publishedAt?: string | null;
};

export type YcmServiceSearch = {
  q?: string;
  domainId?: string;
  category?: string;
  countryCode?: string;
  stateCode?: string;
  providerCode?: string;
  mode?: YcmServiceMode;
  status?: YcmServiceRecord['status'];
  limit?: number;
};

export const YCM_SERVICE_MASTER_LIMIT = 50000;

export type RegistrationRole =
  | 'customer'
  | 'artist'
  | 'community_manager'
  | 'supplier'
  | 'curator'
  | 'production_operator'
  | 'support_agent'
  | 'finance_admin'
  | 'platform_admin'
  | 'affiliate';

export type RegistrationStatus = 'empty' | 'draft' | 'incomplete' | 'pending_review' | 'approved' | 'active' | 'paused' | 'blocked';

export interface RoleRegistrationPolicy {
  role: RegistrationRole;
  sections: string[];
  requiredFields: string[];
  editableBy: RegistrationRole[];
  impactSensitiveFields: string[];
  defaultStatus: RegistrationStatus;
}

const policies: Record<RegistrationRole, RoleRegistrationPolicy> = {
  customer: {
    role: 'customer',
    sections: ['profile', 'addresses', 'preferences', 'support'],
    requiredFields: ['name', 'email', 'phone'],
    editableBy: ['customer', 'support_agent', 'platform_admin'],
    impactSensitiveFields: [],
    defaultStatus: 'draft',
  },
  artist: {
    role: 'artist',
    sections: ['artistProfile', 'portfolio', 'artworks', 'financial'],
    requiredFields: ['displayName', 'bio', 'termsAccepted', 'payoutRecipient'],
    editableBy: ['artist', 'platform_admin'],
    impactSensitiveFields: ['payoutRecipient', 'termsAccepted'],
    defaultStatus: 'draft',
  },
  community_manager: {
    role: 'community_manager',
    sections: ['organization', 'campaigns', 'members', 'financial'],
    requiredFields: ['organizationName', 'responsibleName', 'termsAccepted'],
    editableBy: ['community_manager', 'platform_admin'],
    impactSensitiveFields: ['financialRecipient', 'campaignBudget'],
    defaultStatus: 'draft',
  },
  supplier: {
    role: 'supplier',
    sections: ['company', 'productBase', 'material', 'priceTable', 'freightRules', 'productionCapacity'],
    requiredFields: ['companyName', 'cnpj', 'productionAddress', 'priceTable', 'freightRule', 'productionLeadTime'],
    editableBy: ['supplier', 'platform_admin'],
    impactSensitiveFields: ['priceTable', 'freightRule', 'productionLeadTime', 'materialSpec', 'productionCapacity'],
    defaultStatus: 'pending_review',
  },
  curator: {
    role: 'curator',
    sections: ['queueSpecialty', 'reviewChecklist', 'reviewHistory'],
    requiredFields: ['specialty'],
    editableBy: ['curator', 'platform_admin'],
    impactSensitiveFields: [],
    defaultStatus: 'active',
  },
  production_operator: {
    role: 'production_operator',
    sections: ['jobs', 'occurrences', 'shipping'],
    requiredFields: ['operatorName'],
    editableBy: ['production_operator', 'platform_admin'],
    impactSensitiveFields: ['shippingCode', 'shippingCarrier'],
    defaultStatus: 'active',
  },
  support_agent: {
    role: 'support_agent',
    sections: ['tickets', 'macros', 'handoff'],
    requiredFields: ['agentName'],
    editableBy: ['support_agent', 'platform_admin'],
    impactSensitiveFields: [],
    defaultStatus: 'active',
  },
  finance_admin: {
    role: 'finance_admin',
    sections: ['commissionRules', 'ledger', 'payout', 'refund', 'chargeback'],
    requiredFields: ['ownerName'],
    editableBy: ['finance_admin', 'platform_admin'],
    impactSensitiveFields: ['commissionRule', 'payoutDecision', 'gatewayFeeRule', 'refundDecision'],
    defaultStatus: 'active',
  },
  platform_admin: {
    role: 'platform_admin',
    sections: ['users', 'roles', 'policies', 'risk', 'audit'],
    requiredFields: ['ownerName'],
    editableBy: ['platform_admin'],
    impactSensitiveFields: ['rolePermission', 'policyVersion', 'commissionRule', 'gatewayFeeRule'],
    defaultStatus: 'active',
  },
  affiliate: {
    role: 'affiliate',
    sections: ['profile', 'links', 'performance', 'rewards'],
    requiredFields: ['displayName', 'email'],
    editableBy: ['affiliate', 'platform_admin'],
    impactSensitiveFields: ['rewardRecipient'],
    defaultStatus: 'draft',
  },
};

export function getRegistrationPolicy(role: RegistrationRole): RoleRegistrationPolicy {
  return policies[role];
}

export function canEditRoleRegistration(targetRole: RegistrationRole, actorRole: string): boolean {
  return policies[targetRole].editableBy.includes(actorRole as RegistrationRole);
}

export function isImpactSensitiveField(targetRole: RegistrationRole, fieldName: string): boolean {
  return policies[targetRole].impactSensitiveFields.includes(fieldName);
}

export function detectImpactSensitiveFields(targetRole: RegistrationRole, fields: string[]): string[] {
  const sensitive = new Set(policies[targetRole].impactSensitiveFields);
  return fields.filter((field) => sensitive.has(field));
}

export function evaluateRequiredFieldsCompletion(targetRole: RegistrationRole, values: Record<string, unknown>) {
  const missing = policies[targetRole].requiredFields.filter((field) => {
    const value = values[field];
    if (typeof value === 'string') return value.trim().length === 0;
    return value === null || value === undefined;
  });
  return {
    complete: missing.length === 0,
    missing,
  };
}

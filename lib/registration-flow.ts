import type { UserRole } from '@/lib/auth-session';
import type { TermType } from '@/lib/terms-acceptance-store';
import type { RegistrationPersona } from '@/lib/registration-store';
import { evaluateRequiredFieldsCompletion, type RegistrationStatus } from '@/lib/role-matrix/registration-matrix';

export interface RegistrationPayloadLike {
  persona: RegistrationPersona;
  fullName: string;
  email: string;
  password: string;
  termsAccepted: boolean;
  draft: Record<string, unknown>;
}

export const PERSONA_ROLE: Record<RegistrationPersona, UserRole> = {
  ALMA: 'customer',
  FAROL: 'community_manager',
  SOPRO: 'artist',
};

export const PERSONA_TERM: Record<RegistrationPersona, TermType> = {
  ALMA: 'consumer_base',
  FAROL: 'industry_base',
  SOPRO: 'artist_base',
};

const REQUIRED_BY_PERSONA: Record<RegistrationPersona, string[]> = {
  ALMA: ['fullName', 'email', 'cpf', 'phone', 'password', 'termsAccepted'],
  FAROL: ['institutionName', 'leaderName', 'whatsapp', 'password', 'termsAccepted'],
  SOPRO: ['artisticName', 'creativeEmail', 'portfolioUrl', 'password', 'termsAccepted'],
};

function buildSource(payload: RegistrationPayloadLike) {
  const role = PERSONA_ROLE[payload.persona];
  const source = {
    ...payload.draft,
    fullName: payload.fullName,
    email: payload.email,
    password: payload.password,
    termsAccepted: payload.termsAccepted,
  } as Record<string, unknown>;

  // Mirror keys expected by role matrix to avoid drift between persona and role contracts.
  source.name = source.name ?? payload.fullName;
  source.displayName = source.displayName ?? source.artisticName ?? payload.fullName;
  source.organizationName = source.organizationName ?? source.institutionName;
  source.responsibleName = source.responsibleName ?? source.leaderName;
  source.phone = source.phone ?? source.whatsapp;
  source.bio = source.bio ?? source.artistBio ?? '';
  source.payoutRecipient = source.payoutRecipient ?? source.pixKey ?? source.bankAccount ?? '';
  source.termsAccepted = payload.termsAccepted;

  return { role, source };
}

export function evaluateRegistrationCompleteness(payload: RegistrationPayloadLike) {
  const { role, source } = buildSource(payload);
  const personaMissing = REQUIRED_BY_PERSONA[payload.persona].filter((field) => {
    const value = source[field];
    if (typeof value === 'string') return value.trim().length === 0;
    return value !== true;
  });
  const roleCompletion = evaluateRequiredFieldsCompletion(role, source);
  const missing = Array.from(new Set([...personaMissing, ...roleCompletion.missing]));
  return {
    complete: missing.length === 0,
    missing,
  };
}

export function normalizeTermVersion(termType: TermType) {
  if (termType === 'artist_base') return process.env.TERM_VERSION_ARTIST_BASE?.trim() || 'v1';
  if (termType === 'industry_base') return process.env.TERM_VERSION_INDUSTRY_BASE?.trim() || 'v1';
  return process.env.TERM_VERSION_CONSUMER_BASE?.trim() || 'v1';
}

export function resolveRegistrationStatus(payload: RegistrationPayloadLike): RegistrationStatus {
  const completeness = evaluateRegistrationCompleteness(payload);
  return completeness.complete ? 'active' : 'incomplete';
}

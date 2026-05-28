import type { UserRole } from '@/lib/auth-session';
import type { TermType } from '@/lib/terms-acceptance-store';
import type { RegistrationPersona } from '@/lib/registration-store';
import type { RegistrationStatus } from '@/lib/role-matrix/registration-matrix';

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

export function normalizeTermVersion(termType: TermType) {
  if (termType === 'artist_base') return process.env.TERM_VERSION_ARTIST_BASE?.trim() || 'v1';
  if (termType === 'industry_base') return process.env.TERM_VERSION_INDUSTRY_BASE?.trim() || 'v1';
  return process.env.TERM_VERSION_CONSUMER_BASE?.trim() || 'v1';
}

export function resolveRegistrationStatus(payload: RegistrationPayloadLike): RegistrationStatus {
  const source = {
    ...payload.draft,
    fullName: payload.fullName,
    email: payload.email,
    password: payload.password,
    termsAccepted: payload.termsAccepted,
  } as Record<string, unknown>;

  const complete = REQUIRED_BY_PERSONA[payload.persona].every((field) => {
    const value = source[field];
    if (typeof value === 'string') return value.trim().length > 0;
    return value === true;
  });
  return complete ? 'active' : 'incomplete';
}

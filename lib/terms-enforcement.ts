import { hasAcceptedTerms, type TermType } from '@/lib/terms-acceptance-store';

function isEnabled(envVar: string) {
  return process.env[envVar]?.toLowerCase() === 'true';
}

export function isTermsGateEnabledFor(stage: 'artist' | 'industry' | 'consumer') {
  if (stage === 'artist') return isEnabled('TERMS_ENFORCE_ARTIST');
  if (stage === 'industry') return isEnabled('TERMS_ENFORCE_INDUSTRY');
  return isEnabled('TERMS_ENFORCE_CONSUMER');
}

function currentVersionFor(termType: TermType) {
  if (termType === 'artist_base') return process.env.TERM_VERSION_ARTIST_BASE?.trim() || 'v1';
  if (termType === 'industry_base') return process.env.TERM_VERSION_INDUSTRY_BASE?.trim() || 'v1';
  return process.env.TERM_VERSION_CONSUMER_BASE?.trim() || 'v1';
}

export async function validateTermsAcceptance(input: {
  userId: string;
  termType: TermType;
}): Promise<boolean> {
  return hasAcceptedTerms({
    userId: input.userId,
    termType: input.termType,
    termVersion: currentVersionFor(input.termType),
  });
}

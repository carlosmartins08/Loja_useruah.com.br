import type { PayoutReconciliationFailureCode } from '@/lib/payout-reconciliation-codes';

export type PayoutFailureCodeExtended =
  | PayoutReconciliationFailureCode
  | 'not_found'
  | 'invalid_transition'
  | 'status_not_approved'
  | 'not_ready';

export interface PayoutFailurePlaybookEntry {
  code: PayoutFailureCodeExtended;
  action: string;
  owner: 'finance_admin' | 'platform_admin' | 'support_agent' | 'supplier';
  severity: 'high' | 'medium' | 'low';
}

const PLAYBOOK: Record<PayoutFailureCodeExtended, PayoutFailurePlaybookEntry> = {
  missing_commission_link: {
    code: 'missing_commission_link',
    action: 'Revisar vínculo payout->commissionIds antes de nova tentativa de liquidação.',
    owner: 'finance_admin',
    severity: 'high',
  },
  commission_owner_mismatch: {
    code: 'commission_owner_mismatch',
    action: 'Corrigir ownership das comissões vinculadas para o mesmo owner do payout.',
    owner: 'finance_admin',
    severity: 'high',
  },
  commission_not_available: {
    code: 'commission_not_available',
    action: 'Executar reconciliação de disponibilidade e validar status das comissões.',
    owner: 'finance_admin',
    severity: 'medium',
  },
  insufficient_commission_balance: {
    code: 'insufficient_commission_balance',
    action: 'Ajustar valor do payout ou recompor comissões vinculadas para cobrir saldo.',
    owner: 'finance_admin',
    severity: 'high',
  },
  not_found: {
    code: 'not_found',
    action: 'Validar existência do payout e consistência do identificador enviado.',
    owner: 'platform_admin',
    severity: 'medium',
  },
  invalid_transition: {
    code: 'invalid_transition',
    action: 'Revisar estado atual e aplicar transição válida antes da liquidação.',
    owner: 'finance_admin',
    severity: 'medium',
  },
  status_not_approved: {
    code: 'status_not_approved',
    action: 'Concluir etapas de aprovação financeira antes de tentar marcar como pago.',
    owner: 'finance_admin',
    severity: 'low',
  },
  not_ready: {
    code: 'not_ready',
    action: 'Executar precheck completo e resolver bloqueios apontados.',
    owner: 'finance_admin',
    severity: 'medium',
  },
};

export function getPayoutFailurePlaybook(code: string | undefined | null) {
  if (!code) return null;
  return PLAYBOOK[code as PayoutFailureCodeExtended] ?? null;
}

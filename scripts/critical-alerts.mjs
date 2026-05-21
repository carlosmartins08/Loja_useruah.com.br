const criticalItems = [
  {
    id: 'CRIT-PAY-REAL-001',
    title: 'Definir e homologar gateway real de pagamento',
    why: 'Sem provedor real validado, o fluxo financeiro de producao permanece incompleto.',
    unblock: [
      'Escolher provedor de pagamento oficial',
      'Configurar PAYMENT_PROVIDER=gateway_real e credenciais',
      'Executar cutover runbook com smoke + rollback',
    ],
  },
  {
    id: 'CRIT-PAY-REAL-002',
    title: 'Fechar persistencia final de pagamentos em ambiente gerenciado',
    why: 'Sem persistencia final definida, conciliacao e operacao financeira ficam em risco.',
    unblock: [
      'Definir banco alvo de producao para pagamentos',
      'Validar reconciliação por providerReference',
      'Executar QA de pagamentos no ambiente de homologacao',
    ],
  },
];

console.log('=== ALERTA CRITICO DE EXECUCAO ===');
console.log(`Data: ${new Date().toISOString()}`);
console.log('');

for (const item of criticalItems) {
  console.log(`[${item.id}] ${item.title}`);
  console.log(`Motivo: ${item.why}`);
  console.log('Para destravar:');
  for (const step of item.unblock) {
    console.log(`- ${step}`);
  }
  console.log('');
}

console.log('Referencia: docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md');

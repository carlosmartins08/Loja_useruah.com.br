import OwnerFinanceWorkspace from '@/components/operations/finance/OwnerFinanceWorkspace';

export default function CommunityRevenuePage() {
  return (
    <OwnerFinanceWorkspace
      workspaceLabel="Ambiente comunidade"
      title="Receita, repasse e payout"
      description="Este ambiente consolida a leitura financeira da comunidade em cima do ledger real do papel. Entram saldo pendente, valor disponivel para repasse e historico de solicitacoes."
      forbiddenMessage="Este ambiente depende do papel community_manager para exibir receita e payout."
      loadErrorMessage="Nao foi possivel carregar o ledger financeiro da comunidade agora."
      campaignBreakdown={{
        title: 'Receita por campanha',
        description:
          'Aqui entra a composicao da receita por campanha com base na atribuicao real de pedidos e comissoes ja emitidas para a comunidade.',
        emptyMessage: 'Nenhuma campanha com receita atribuida por enquanto.',
        loadErrorMessage: 'Nao foi possivel carregar a atribuicao de receita por campanha agora.',
      }}
    />
  );
}

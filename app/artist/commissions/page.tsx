import OwnerFinanceWorkspace from '@/components/operations/finance/OwnerFinanceWorkspace';

export default function ArtistCommissionsPage() {
  return (
    <OwnerFinanceWorkspace
      workspaceLabel="Ambiente artista"
      title="Comissoes e payout"
      description="O ambiente financeiro agora reflete o runtime real do papel. Aqui entram saldo pendente, disponibilidade para saque e historico de payout, sem depender da carteira do cliente."
      forbiddenMessage="Este ambiente depende do papel artist para exibir saldo e payout."
      loadErrorMessage="Nao foi possivel carregar o ledger autoral agora."
    />
  );
}

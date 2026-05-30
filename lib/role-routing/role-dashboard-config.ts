import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Factory,
  FileSearch,
  Landmark,
  LifeBuoy,
  Link2,
  Megaphone,
  Package,
  PackageSearch,
  Palette,
  ScrollText,
  ShieldAlert,
  Truck,
  Wallet,
} from 'lucide-react';

export type RoleDashboardCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type RoleDashboardConfig = {
  label: string;
  title: string;
  description: string;
  cards: RoleDashboardCard[];
};

export const ROLE_DASHBOARD_CONFIG = {
  artist: {
    label: 'Ambiente Artista',
    title: 'Dashboard de Criacao',
    description: 'Gerencie sua vitrine autoral, acompanhe pedidos vinculados e monitore comissoes com clareza operacional.',
    cards: [
      { title: 'Portfolio e Curadoria', description: 'Revise pecas, status de aprovacao e performance por colecao.', href: '/artist/portfolio', icon: Palette },
      { title: 'Comissoes e Payout', description: 'Acompanhe saldo disponivel, historico e solicitacoes financeiras.', href: '/artist/commissions', icon: Wallet },
      { title: 'Pedidos Vinculados', description: 'Veja o impacto da sua arte nas ordens em andamento e concluidas.', href: '/artist/orders', icon: Package },
    ],
  },
  community_manager: {
    label: 'Ambiente Comunidade',
    title: 'Dashboard de Campanhas',
    description: 'Acompanhe campanhas ativas, performance de conversao e resultados financeiros da sua comunidade.',
    cards: [
      { title: 'Campanhas Ativas', description: 'Priorize campanhas, metas e ativos criativos por periodo.', href: '/community/campaigns', icon: Megaphone },
      { title: 'Pedidos e Conversao', description: 'Analise volume de pedidos e funil gerado por cada acao da comunidade.', href: '/account/orders', icon: BarChart3 },
      { title: 'Repasse e Saldo', description: 'Monitore comissoes, repasses e previsao de recebimento por campanha.', href: '/account/wallet', icon: Wallet },
    ],
  },
  supplier: {
    label: 'Ambiente Fornecedor',
    title: 'Operacao de Fornecimento',
    description: 'Controle producao, pedidos e expedicao com visao operacional clara para manter SLA e qualidade.',
    cards: [
      { title: 'Fila de Producao', description: 'Acesse jobs, etapas e bloqueios para manter previsibilidade da operacao.', href: '/supplier/production', icon: Factory },
      { title: 'Pedidos em Carteira', description: 'Priorize ordens por prazo, status de pagamento e dependencia tecnica.', href: '/supplier/orders', icon: PackageSearch },
      { title: 'Retornos e Entregas', description: 'Gerencie ocorrencias de retorno e confirme entregas concluidas.', href: '/supplier/shipments', icon: Truck },
    ],
  },
  affiliate: {
    label: 'Ambiente Affiliate',
    title: 'Dashboard de Performance',
    description: 'Centralize seus links, acompanhe conversao e controle ganhos com transparencia.',
    cards: [
      { title: 'Links e Ativos', description: 'Organize links, codigos e materiais para execucao de campanhas.', href: '/affiliate/links', icon: Link2 },
      { title: 'Conversao e Pedidos', description: 'Monitore pedidos gerados, taxa de conversao e desempenho por canal.', href: '/account/orders', icon: BarChart3 },
      { title: 'Comissoes', description: 'Acompanhe saldo, historico e previsao de repasse das comissoes.', href: '/account/wallet', icon: Wallet },
    ],
  },
  curator: {
    label: 'Ambiente Curadoria',
    title: 'Mesa de Revisao',
    description: 'Conduza revisoes de conteudo com criterio, SLA e rastreabilidade de decisao.',
    cards: [
      { title: 'Fila de Obras', description: 'Analise obras pendentes e mantenha a cadencia de aprovacao.', href: '/curation/artworks', icon: FileSearch },
      { title: 'Impact Reviews', description: 'Acompanhe itens com risco operacional para decisao coordenada.', href: '/admin/impact-reviews', icon: ShieldAlert },
      { title: 'Politicas Ativas', description: 'Consulte criterios de aprovacao e guardrails editoriais.', href: '/policies', icon: ScrollText },
    ],
  },
  support_agent: {
    label: 'Ambiente Suporte',
    title: 'Central de Atendimento',
    description: 'Atue em tickets com contexto completo de pedido, risco e historico de atendimento.',
    cards: [
      { title: 'Tickets', description: 'Localize e trate tickets ativos com prioridade operacional.', href: '/support/tickets', icon: LifeBuoy },
      { title: 'Escalacoes', description: 'Gerencie casos criticos com dependencia de outras areas.', href: '/support/escalations', icon: ShieldAlert },
      { title: 'Impact Reviews', description: 'Verifique risco pendente que afeta resposta ao cliente.', href: '/admin/impact-reviews', icon: ScrollText },
    ],
  },
  production_operator: {
    label: 'Ambiente Producao',
    title: 'Operacao de Fulfillment',
    description: 'Controle fila de jobs, status de fabrica e capacidade por janela operacional.',
    cards: [
      { title: 'Jobs de Producao', description: 'Acompanhe fila, bloqueios e throughput por status.', href: '/production/jobs', icon: Factory },
      { title: 'Pedidos Relacionados', description: 'Consulte pedidos conectados aos jobs ativos.', href: '/account/orders', icon: Package },
      { title: 'Ocorrencias', description: 'Mapeie desvios e trate escalacoes de operacao.', href: '/support/escalations', icon: ShieldAlert },
    ],
  },
  finance_admin: {
    label: 'Ambiente Financeiro',
    title: 'Controle Financeiro',
    description: 'Monitore payouts, conformidade e decisoes de risco com trilha de auditoria.',
    cards: [
      { title: 'Dashboard Financeiro', description: 'Visao consolidada de volume, risco e liquidacao.', href: '/finance/dashboard', icon: Landmark },
      { title: 'Payouts', description: 'Aprove, rejeite e acompanhe ciclo de pagamentos.', href: '/finance/payouts', icon: Wallet },
      { title: 'Impact Reviews', description: 'Acompanhe revisoes que afetam receita e compliance.', href: '/admin/impact-reviews', icon: ShieldAlert },
    ],
  },
} as const;

export type DashboardRole = keyof typeof ROLE_DASHBOARD_CONFIG;

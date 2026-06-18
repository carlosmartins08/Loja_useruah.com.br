import { HomeFaqItem, HomeTestimonial } from '@/components/home/home-types';

export const HOME_FAQ: HomeFaqItem[] = [
  {
    q: 'O que significa Ruah?',
    a: 'Ruah é um termo hebraico ligado a sopro, vento e espírito. Na marca, ele funciona como a ideia central de uma moda cristã com linguagem contemplativa e direção visual própria.',
  },
  {
    q: 'Como funciona a produção sob demanda?',
    a: 'As peças publicadas entram em produção depois da compra. Isso reduz estoque parado, evita excesso de material e mantém a operação alinhada ao catálogo realmente disponível.',
  },
  {
    q: 'Posso personalizar para meu grupo ou pastoral?',
    a: 'Ainda não existe um fluxo self-service de personalização. Hoje a experiência pública trabalha com catálogo publicado; se surgir uma demanda de grupo, ela depende de análise e atendimento fora da jornada padrão da loja.',
  },
  {
    q: 'Como funciona para artistas e parceiros?',
    a: 'O cadastro já serve para concentrar interesse de parceiros e futuras colaborações, mas ativação comercial e publicação ainda passam por curadoria interna. Melhor isso do que prometer entrada automática que não existe.',
  },
];

export const HOME_TESTIMONIALS: HomeTestimonial[] = [
  {
    name: 'Autoral',
    city: 'Leitura de coleção',
    quote: 'Peças com traço mais expressivo, contraste forte e presença visual para quem quer sair do lugar-comum sem perder referência cristã.',
    image: '/assets/editorial/portrait-ana.svg',
  },
  {
    name: 'Contemplativo',
    city: 'Leitura de coleção',
    quote: 'Uma direção mais silenciosa, com ritmo limpo e foco em mensagem, textura e uso cotidiano sem excesso de informação.',
    image: '/assets/editorial/portrait-marcos.svg',
  },
  {
    name: 'Comunidade',
    city: 'Leitura de coleção',
    quote: 'Recortes que ajudam grupos e lideranças a encontrar linguagem visual próxima da própria realidade, mesmo sem customização aberta no site.',
    image: '/assets/editorial/portrait-julia.svg',
  },
  {
    name: 'Presença',
    city: 'Leitura de coleção',
    quote: 'A proposta aqui não é vender espetáculo. É oferecer um catálogo coerente para quem quer vestir convicção com forma e sobriedade.',
    image: '/assets/editorial/portrait-pedro.svg',
  },
];

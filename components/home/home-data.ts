import { HomeCategory, HomeFaqItem, HomeProduct, HomeTestimonial } from '@/components/home/home-types';

export const HOME_FAQ: HomeFaqItem[] = [
  {
    q: 'O que significa Ruah?',
    a: 'Ruah é um termo hebraico que significa sopro, vento ou espírito. Para nós, representa o fôlego de vida que o Criador sopra sobre cada obra de arte e sobre cada um de nós.',
  },
  {
    q: 'Como funciona a produção sob demanda?',
    a: 'Para honrar a criação e evitar o desperdício têxtil, produzimos cada peça apenas após o seu pedido. Isso garante exclusividade e uma cadeia de produção muito mais consciente e sustentável.',
  },
  {
    q: 'Posso personalizar para meu grupo ou pastoral?',
    a: 'Sim! Através do Ruah Lab AI, você pode selecionar sua identidade (Coroinhas, Vicentinos, Jovens etc) e nossa tecnologia ajuda a criar o design perfeito para sua missão coletiva.',
  },
  {
    q: 'Como ser um artista parceiro?',
    a: 'Se você respira arte cristã, pode se tornar um Designer Ruah. Você cria a estampa, nós cuidamos da produção e logística, e você recebe por cada sopro de criatividade vendido.',
  },
];

export const HOME_PRODUCTS: HomeProduct[] = [
  { id: '1', name: 'Camiseta Respiro', category: 'Autoral', price: 89.9, image: 'https://picsum.photos/seed/ruah-p1/800/1000', badge: 'Popular' },
  { id: '2', name: 'Moletom Fé Viva', category: 'Campanha', price: 159.9, image: 'https://picsum.photos/seed/ruah-p2/800/1000' },
  { id: '3', name: 'Bolsa Sopro', category: 'Acessórios', price: 45, image: 'https://picsum.photos/seed/ruah-p3/800/1000', badge: 'Novo' },
  { id: '4', name: 'Camiseta Geração', category: 'Artistas', price: 95, image: 'https://picsum.photos/seed/ruah-p4/800/1000' },
];

export const HOME_CATEGORIES: HomeCategory[] = [
  { name: 'Autoral', image: 'https://picsum.photos/seed/ruah-cat-1/600/800', link: '/shop' },
  { name: 'Artistas', image: 'https://picsum.photos/seed/ruah-cat-2/600/800', link: '/shop' },
  { name: 'Grupos', image: 'https://picsum.photos/seed/ruah-cat-3/600/800', link: '/shop' },
];

export const HOME_TESTIMONIALS: HomeTestimonial[] = [
  {
    name: 'Ana Silva',
    city: 'Rio de Janeiro, RJ',
    quote: 'A qualidade do tecido me surpreendeu, mas o propósito por trás da estampa é o que realmente me conectou com a marca.',
    image: 'https://picsum.photos/seed/ruah-user-1/200/200',
  },
  {
    name: 'Marcos Oliveira',
    city: 'Belo Horizonte, MG',
    quote: 'Comprei para o meu grupo de oração e todos amaram. É uma forma linda e contemporânea de evangelizar no dia a dia.',
    image: 'https://picsum.photos/seed/ruah-user-2/200/200',
  },
  {
    name: 'Julia Costa',
    city: 'Curitiba, PR',
    quote: 'O atendimento do Concierge Ruah foi impecável. Senti o cuidado e o carinho em cada detalhe do pedido até a entrega.',
    image: 'https://picsum.photos/seed/ruah-user-3/200/200',
  },
  {
    name: 'Pedro Santos',
    city: 'Recife, PE',
    quote: 'Design autêntico que foge do óbvio. Finalmente uma marca que une fé e estática de alto nível.',
    image: 'https://picsum.photos/seed/ruah-user-4/200/200',
  },
];





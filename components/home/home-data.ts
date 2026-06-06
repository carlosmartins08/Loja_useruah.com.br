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
  {
    id: '1',
    name: 'Camiseta Respiro',
    category: 'Autoral',
    price: 89.9,
    image: '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-front.png',
    hoverImage: '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-left-3q.png',
    badge: 'Popular',
  },
  {
    id: '2',
    name: 'Moletom Fé Viva',
    category: 'Campanha',
    price: 159.9,
    image: '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-front.png',
    hoverImage: '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-left-3q.png',
  },
  {
    id: '3',
    name: 'Bolsa Sopro',
    category: 'Acessórios',
    price: 45,
    image: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-front.png',
    hoverImage: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-left-3q.png',
    badge: 'Novo',
  },
  {
    id: '4',
    name: 'Boné Presença',
    category: 'Artistas',
    price: 95,
    image: '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-front.png',
    hoverImage: '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-left-3q.png',
  },
];

export const HOME_CATEGORIES: HomeCategory[] = [
  { name: 'Autoral', image: '/assets/products/mockups/camiseta-regular/preto-presenca/mockup-camiseta-regular-preto-presenca-front.png', link: '/shop' },
  { name: 'Artistas', image: '/assets/products/mockups/moletom-unissex/offwhite-oracao/mockup-moletom-unissex-offwhite-oracao-front.png', link: '/shop' },
  { name: 'Grupos', image: '/assets/products/mockups/ecobag/preto-presenca/mockup-ecobag-preto-presenca-front.png', link: '/shop' },
];

export const HOME_TESTIMONIALS: HomeTestimonial[] = [
  {
    name: 'Ana Silva',
    city: 'Rio de Janeiro, RJ',
    quote: 'A qualidade do tecido me surpreendeu, mas o propósito por trás da estampa é o que realmente me conectou com a marca.',
    image: '/assets/editorial/portrait-ana.svg',
  },
  {
    name: 'Marcos Oliveira',
    city: 'Belo Horizonte, MG',
    quote: 'Comprei para o meu grupo de oração e todos amaram. É uma forma linda e contemporânea de evangelizar no dia a dia.',
    image: '/assets/editorial/portrait-marcos.svg',
  },
  {
    name: 'Julia Costa',
    city: 'Curitiba, PR',
    quote: 'O atendimento do Concierge Ruah foi impecável. Senti o cuidado e o carinho em cada detalhe do pedido até a entrega.',
    image: '/assets/editorial/portrait-julia.svg',
  },
  {
    name: 'Pedro Santos',
    city: 'Recife, PE',
    quote: 'Design autêntico que foge do óbvio. Finalmente uma marca que une fé e estática de alto nível.',
    image: '/assets/editorial/portrait-pedro.svg',
  },
];





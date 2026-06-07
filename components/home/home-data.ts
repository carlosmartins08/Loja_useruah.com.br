import { HomeCategory, HomeFaqItem, HomeProduct, HomeTestimonial } from '@/components/home/home-types';
import { BRAND_CATEGORY_CARDS, BRAND_HOME_PRODUCTS } from '@/lib/brand-assets';

export const HOME_FAQ: HomeFaqItem[] = [
  {
    q: 'O que significa Ruah?',
    a: 'Ruah é um termo hebraico que significa sopro, vento ou espírito. Para nós, representa o fôlego de vida que o Criador sopra sobre cada obra de arte e sobre cada um de nós.',
  },
  {
    q: 'Como funciona a produção sob demanda?',
    a: 'Para honrar a criação e evitar o desperdício têxtil, produzimos cada peça apenas após o seu pedido. Isso garante exclusividade e uma cadeia de produção mais consciente.',
  },
  {
    q: 'Posso personalizar para meu grupo ou pastoral?',
    a: 'Sim. Hoje a loja prioriza direção editorial e curadoria de coleção. O próximo passo é transformar isso em fluxo de personalização real sem depender de promessa vazia.',
  },
  {
    q: 'Como ser um artista parceiro?',
    a: 'Se você respira arte cristã, pode se tornar um Designer Ruah. Você cria a estampa, nós cuidamos da produção e logística, e você recebe por cada criação vendida.',
  },
];

export const HOME_PRODUCTS: HomeProduct[] = BRAND_HOME_PRODUCTS;

export const HOME_CATEGORIES: HomeCategory[] = BRAND_CATEGORY_CARDS;

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
    quote: 'O atendimento do Concierge Ruah foi impecável. Senti o cuidado em cada detalhe do pedido até a entrega.',
    image: '/assets/editorial/portrait-julia.svg',
  },
  {
    name: 'Pedro Santos',
    city: 'Recife, PE',
    quote: 'Design autêntico que foge do óbvio. Finalmente uma marca que une fé e estética de alto nível.',
    image: '/assets/editorial/portrait-pedro.svg',
  },
];

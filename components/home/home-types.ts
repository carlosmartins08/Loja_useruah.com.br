export interface HomeFaqItem {
  q: string;
  a: string;
}

export interface HomeProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  badge?: string;
}

export interface HomeCategory {
  name: string;
  image: string;
  link: string;
}

export interface HomeTestimonial {
  name: string;
  city: string;
  quote: string;
  image: string;
}

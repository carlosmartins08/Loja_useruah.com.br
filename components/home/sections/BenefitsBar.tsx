import { Cpu, Star, Truck, UserCircle } from 'lucide-react';
import { TrustBadgeGrid } from '@/components/shared/TrustBadgeGrid';

const BENEFITS = [
  { label: 'Arte com Propósito', detail: 'Curadoria Crist?', icon: Star },
  { label: 'Produção Consciente', detail: 'Sob Demanda em SP', icon: Cpu },
  { label: 'Entrega Sagrada', detail: 'Pacto de Qualidade', icon: Truck },
  { label: 'Impacto Real', detail: 'Apoio a Evangelização', icon: UserCircle },
];

export function BenefitsBar() {
  return (
    <section className="bg-ruah-50 py-12 border-b border-ruah-100">
      <div className="section-container">
        <TrustBadgeGrid items={BENEFITS} iconSize={16} compact />
      </div>
    </section>
  );
}




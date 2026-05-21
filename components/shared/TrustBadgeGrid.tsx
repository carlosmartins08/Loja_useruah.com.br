import { LucideIcon } from 'lucide-react';

interface TrustBadgeItem {
  label: string;
  detail: string;
  icon: LucideIcon;
}

interface TrustBadgeGridProps {
  items: TrustBadgeItem[];
  iconSize?: number;
  compact?: boolean;
}

export function TrustBadgeGrid({ items, iconSize = 16, compact = false }: TrustBadgeGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center text-center lg:items-start lg:text-left gap-2 group cursor-default">
          <item.icon size={iconSize} className="text-accent-gold mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-ruah-950">{item.label}</span>
          <span className={`${compact ? 'text-[8px]' : 'text-[9px]'} text-ruah-300 font-bold uppercase tracking-[0.2em]`}>{item.detail}</span>
        </div>
      ))}
    </div>
  );
}

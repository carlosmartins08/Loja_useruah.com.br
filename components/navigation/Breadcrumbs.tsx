'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center gap-3 overflow-x-auto no-scrollbar py-2 pr-4 ${className}`}
      id="breadcrumb-nav"
    >
      <Link 
        href="/" 
        className="flex items-center gap-2 text-ruah-400 hover:text-ruah-950 transition-colors shrink-0"
        id="breadcrumb-home"
      >
        <Home size={12} />
        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Home</span>
      </Link>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={10} className="text-ruah-200 shrink-0" />
          {index === items.length - 1 ? (
            <span 
              className="text-[10px] font-bold uppercase tracking-widest text-ruah-950 whitespace-nowrap truncate max-w-[150px] md:max-w-none"
              id={`breadcrumb-item-active-${index}`}
            >
              {item.label}
            </span>
          ) : (
            <Link 
              href={item.href || '#'}
              className="text-[10px] font-bold uppercase tracking-widest text-ruah-400 hover:text-ruah-950 transition-colors whitespace-nowrap"
              id={`breadcrumb-item-${index}`}
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}


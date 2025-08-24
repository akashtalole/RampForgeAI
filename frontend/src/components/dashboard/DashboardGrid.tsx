import React from 'react';
import { DashboardCard, type DashboardCardProps } from './DashboardCard';
import { cn } from '@/lib/utils';

export interface DashboardGridProps {
  cards: DashboardCardProps[];
  className?: string;
}

export function DashboardGrid({ cards, className }: DashboardGridProps) {
  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      className
    )}>
      {cards.map((card, index) => (
        <DashboardCard
          key={`${card.title}-${index}`}
          {...card}
        />
      ))}
    </div>
  );
}
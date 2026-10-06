import * as React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from '@/components/ui/card/Card';
import { Text } from '@/components/ui/typography/Typography';

interface StatTrend {
  value: string;
  direction: 'up' | 'down';
  label: string;
}

export interface StatCardProps {
  featured?: boolean;
  title: string;
  value: string;
  trend: StatTrend;
  icon: React.ReactNode;
  iconClassName: string;
}

export function StatCard({ title, value, trend, icon, iconClassName, featured = false }: StatCardProps) {
  const isUp = trend.direction === 'up';

  return (
    <Card className={featured ? 'border-0 bg-gradient-to-br from-brand to-primary text-white' : undefined}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn('rounded-xl p-3 shrink-0', featured ? 'bg-white/15 text-white' : iconClassName)}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <Text size="sm" weight="medium" as="p" className={cn('truncate w-full', featured ? 'text-white/90' : 'text-muted-foreground')}>
              {title}
            </Text>
            <Text
              size="2xl"
              weight="bold"
              as="p"
              numeric
              className={cn('tracking-tight mt-1 leading-tight truncate w-full', featured && 'text-white')}
            >
              {value}
            </Text>
            <div
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium mt-2',
                featured ? 'text-white' : isUp ? 'text-success' : 'text-danger',
              )}
            >
              {isUp
                ? <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                : <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              }
              <span>{trend.value}</span>
              <span className={cn('font-normal', featured ? 'text-white/90' : 'text-muted-foreground')}>{trend.label}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

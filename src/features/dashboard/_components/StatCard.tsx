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
  title: string;
  value: string;
  trend: StatTrend;
  icon: React.ReactNode;
  iconClassName: string;
}

export function StatCard({ title, value, trend, icon, iconClassName }: StatCardProps) {
  const isUp = trend.direction === 'up';

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn('rounded-xl p-3 shrink-0', iconClassName)}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <Text size="sm" color="muted" weight="medium" as="p" className='truncate w-full'>
              {title}
            </Text>
            <Text
              size="2xl"
              weight="bold"
              as="p"
              numeric
              className="tracking-tight mt-1 leading-tight truncate w-full"
            >
              {value}
            </Text>
            <div
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium mt-2',
                isUp ? 'text-success' : 'text-danger',
              )}
            >
              {isUp
                ? <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                : <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              }
              <span>{trend.value}</span>
              <span className="text-muted-foreground font-normal ">{trend.label}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

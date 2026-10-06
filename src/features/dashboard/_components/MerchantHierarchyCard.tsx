import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card';
import type { DashboardSummary } from '../types/Dashboard.type';

export function MerchantHierarchyCard({ summary }: { summary: DashboardSummary }) {
  const levels = [
    { label: 'Master Merchant', count: summary.masterMerchantCount, unit: 'pháp nhân' },
    { label: 'Sub-merchant', count: summary.subMerchantCount, unit: 'đơn vị' },
    { label: 'Terminal (POS)', count: summary.terminalCount, unit: 'điểm bán' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mô hình 3 cấp của bạn</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {levels.map((level) => (
          <div key={level.label} className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3 text-sm">
            <span className="font-semibold">{level.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {level.count} {level.unit}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

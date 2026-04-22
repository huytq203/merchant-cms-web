import * as React from 'react';
import { Wallet, TrendingUp, CreditCard, Target } from 'lucide-react';
import { getServerSession } from '@/lib/auth/session';
import { Text } from '@/components/ui/typography/Typography';
import type { StatCardProps } from '../../../features/dashboard/_components/StatCard';
import { StatCard } from '../../../features/dashboard/_components/StatCard';
import { RecentTransactions } from '../../../features/dashboard/_components/RecentTransactions';
import RevenueChart from '@/features/dashboard/_components/RevenueChart';

function getVietnameseGreeting(): string {
  const vnHour = (new Date().getUTCHours() + 7) % 24;
  if (vnHour < 12) return 'buổi sáng';
  if (vnHour < 18) return 'buổi chiều';
  return 'buổi tối';
}

const STAT_CARDS: StatCardProps[] = [
  {
    title: 'Số dư hiện tại',
    value: '1.250.000.000 đ',
    trend: { value: '12%', direction: 'up', label: 'so với tháng trước' },
    icon: <Wallet className="w-5 h-5" />,
    iconClassName: 'bg-primary/10 text-primary',
  },
  {
    title: 'Doanh thu hôm nay',
    value: '45.800.000 đ',
    trend: { value: '5%', direction: 'up', label: 'hôm qua' },
    icon: <TrendingUp className="w-5 h-5" />,
    iconClassName: 'bg-success/10 text-success',
  },
  {
    title: 'Giao dịch thành công',
    value: '1.204',
    trend: { value: '2%', direction: 'down', label: 'hôm qua' },
    icon: <CreditCard className="w-5 h-5" />,
    iconClassName: 'bg-warning/10 text-warning',
  },
  {
    title: 'Tỷ lệ chuyển đổi',
    value: '94,2%',
    trend: { value: '0,5%', direction: 'up', label: 'hôm qua' },
    icon: <Target className="w-5 h-5" />,
    iconClassName: 'bg-danger/10 text-danger',
  },
];

const DashboardPage = async () => {
  const session = await getServerSession();
  const displayName = session?.username ?? 'Merchant';
  const greeting = getVietnameseGreeting();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Chào {greeting},{' '}
          <span className="text-primary">{displayName}</span>!
        </h2>
        <Text size="sm" color="muted" as="p" className="mt-1">
          Dưới đây là báo cáo vận hành hôm nay
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <RevenueChart />

      <RecentTransactions />
    </div>
  );
};

export default DashboardPage;

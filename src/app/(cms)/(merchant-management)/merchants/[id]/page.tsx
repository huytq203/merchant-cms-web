'use client';
import { MerchantDetail, MerchantDetailSkeleton } from '@/features/merchants/components/MerchantDetail';
import { useMerchantDetailQuery } from '@/features/merchants/hooks/use-merchant-detail-query';
import { AlertCircle } from 'lucide-react';
import { use } from 'react';

interface MerchantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MerchantDetailPage({ params }: MerchantDetailPageProps) {
  const { id } = use(params);
  const { data: merchant, isLoading, isError } = useMerchantDetailQuery(id);

  if (isLoading) return <MerchantDetailSkeleton />;

  if (isError || !merchant) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-medium text-muted-foreground">
          Không tìm thấy merchant
        </p>
      </div>
    );
  }

  return <MerchantDetail merchant={merchant} />;
}

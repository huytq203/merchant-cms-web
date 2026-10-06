"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button/Button";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { useKybDialogs } from "../hooks/use-kyb-dialogs";
import { kybQueries } from "../kyb-queries";
import { KybProgressCard } from "./KybProgressCard";
import { KybStatusHistory } from "./KybStatusHistory";
import { KybWizard } from "./KybWizard";
import { MerchantFormDialog } from "./MerchantFormDialog";
import { MerchantProfileCard } from "./MerchantProfileCard";

type Props = { merchantId: string };

export function KybContainer({ merchantId }: Props) {
  const dialogs = useKybDialogs();
  const profile = useQuery(kybQueries.profile(merchantId));
  const merchant = profile.data;
  const wallet = merchant?.enterpriseWallet;
  return (
    <div className="space-y-5">
      <header className="grid gap-1">
        <h1 className="text-2xl font-bold">Hồ sơ KYB và ĐVCNTT</h1>
        <p className="text-sm text-muted-foreground">
          Gửi yêu cầu xác thực doanh nghiệp, đăng ký đơn vị chấp nhận thanh toán và theo dõi tiến trình duyệt.
        </p>
      </header>
      {profile.isPending && (
        <div className="space-y-4" role="status" aria-label="Đang tải hồ sơ">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}
      {profile.isError && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-danger">
          <span>{profile.error.message}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void profile.refetch()}>
            Thử lại
          </Button>
        </div>
      )}
      {merchant && !wallet && (
        <p className="text-sm text-muted-foreground">
          Merchant này chưa gắn với ví doanh nghiệp nên chưa có hồ sơ KYB.
        </p>
      )}
      {merchant && wallet && (
        <>
          <KybProgressCard wallet={wallet} onOpenWizard={() => dialogs.open("kyb")} />
          <MerchantProfileCard merchant={merchant} onOpenForm={() => dialogs.open("merchant")} />
          <KybStatusHistory merchantId={merchantId} />
          {dialogs.active === "kyb" && (
            <KybWizard
              merchantId={merchantId}
              wallet={wallet}
              onClose={dialogs.close}
              onRefreshLinks={() => void profile.refetch()}
            />
          )}
          {dialogs.active === "merchant" && (
            <MerchantFormDialog
              merchant={merchant}
              onClose={dialogs.close}
              onRefreshLinks={() => void profile.refetch()}
            />
          )}
        </>
      )}
    </div>
  );
}

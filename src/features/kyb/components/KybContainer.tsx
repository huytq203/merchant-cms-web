"use client";

import { useQuery } from "@tanstack/react-query";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { ResultState } from "@/components/page/ResultState";
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
      <PageHeader
        title={getRouteTitle("/merchants")}
        description="Gửi yêu cầu xác thực doanh nghiệp, đăng ký đơn vị chấp nhận thanh toán và theo dõi tiến trình duyệt."
      />
      {profile.isPending ? <ResultState state="loading" loadingLabel="Đang tải hồ sơ" /> : null}
      {profile.isError ? <ResultState state="error" errorMessage={profile.error.message} onRetry={() => void profile.refetch()} /> : null}
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

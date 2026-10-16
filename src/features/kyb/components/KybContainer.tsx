"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { ResultState } from "@/components/page/ResultState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs/Tabs";
import { kybQueries } from "../kyb-queries";
import { KybTab } from "./KybTab";
import { MerchantTab } from "./MerchantTab";

/** `canManage` is MANAGE_SUB_MERCHANT, read on the server: without it the dossier is shown read only. */
type Props = { merchantId: string; canManage: boolean };

type TabName = "kyb" | "merchant";

export function KybContainer({ merchantId, canManage }: Props) {
  const profile = useQuery(kybQueries.profile(merchantId));
  const merchant = profile.data;
  const wallet = merchant?.enterpriseWallet;
  // Opens on the step that still needs doing: KYB until it is verified, then the ĐVCNTT dossier.
  const [tab, setTab] = useState<TabName | null>(null);
  const current: TabName = tab ?? (wallet?.verificationStatus === "VERIFIED" ? "merchant" : "kyb");
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
        <Tabs value={current} onValueChange={(value) => setTab(value === "merchant" ? "merchant" : "kyb")}>
          <TabsList>
            <TabsTrigger value="kyb">Xác thực KYB</TabsTrigger>
            <TabsTrigger value="merchant">Đăng ký ĐVCNTT</TabsTrigger>
          </TabsList>
          <TabsContent value="kyb" className="mt-4 rounded-xl border border-border bg-background p-5">
            <KybTab merchantId={merchantId} wallet={wallet} canManage={canManage} onRefreshLinks={() => void profile.refetch()} />
          </TabsContent>
          <TabsContent value="merchant" className="mt-4 rounded-xl border border-border bg-background p-5">
            <MerchantTab merchant={merchant} canManage={canManage} onRefreshLinks={() => void profile.refetch()} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

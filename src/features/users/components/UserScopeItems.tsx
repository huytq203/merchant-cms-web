"use client";

import { DetailItem, DetailList } from "@/components/modal/DetailModal";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import type { MerchantUser } from "../schemas/user.schema";
import { merchantLabel } from "../utils/user-mapper";
import { UserGroupChips } from "./UserGroupChips";

interface Props {
  user: Pick<MerchantUser, "merchantIds" | "subMerchantIds">;
  /** Every merchant id in the session, used to tell several merchants apart. */
  merchantIds: string[];
}

function SubMerchantValue({ ids }: { ids: string[] }) {
  const options = useSubMerchantOptions();
  if (ids.length === 0) return <span>Toàn bộ merchant</span>;
  if (options.isPending) return <span className="text-muted-foreground">Đang tải</span>;
  const names = ids.flatMap((id) => options.data?.find((option) => option.id === id)?.name ?? []);
  return names.length > 0 ? <UserGroupChips names={names} /> : <span>{ids.length} sub-merchant</span>;
}

/** Read-only scope shown in the detail modal and, as a reference, in the update form. */
export function UserScopeItems({ user, merchantIds }: Props) {
  const merchants = user.merchantIds.map((id) => merchantLabel(merchantIds, id)).join(", ");

  return (
    <DetailList>
      <DetailItem label="Merchant">{merchants || "Chưa có"}</DetailItem>
      <DetailItem label="Sub-merchant">
        <SubMerchantValue ids={user.subMerchantIds} />
      </DetailItem>
    </DetailList>
  );
}

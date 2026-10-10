"use client";

import { DetailItem, DetailList } from "@/components/modal/DetailModal";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import type { MerchantUser } from "../schemas/user.schema";
import type { SessionMerchant } from "@/types/auth";
import { merchantScopeLabel, merchantScopeNames } from "../utils/user-mapper";
import { UserGroupChips } from "./UserGroupChips";

interface Props {
  user: Pick<MerchantUser, "merchantIds" | "subMerchantIds">;
  /** Code and name of the session's merchants; the user's merchants are shown by name when all are known. */
  merchants?: SessionMerchant[];
}

function SubMerchantValue({ ids }: { ids: string[] }) {
  const options = useSubMerchantOptions();
  if (options.isPending) return <span className="text-muted-foreground">Đang tải</span>;
  const names = ids.flatMap((id) => options.data?.find((option) => option.id === id)?.name ?? []);
  return names.length > 0 ? <UserGroupChips names={names} /> : <span>{ids.length} sub-merchant</span>;
}

/**
 * Read-only scope shown in the detail modal and, as a reference, in the update form. A user with no
 * sub-merchant assignment is not limited to any Sub, so it reaches every Sub of its merchants.
 */
export function UserScopeItems({ user, merchants = [] }: Props) {
  const isLimited = user.subMerchantIds.length > 0;
  const merchantNames = merchantScopeNames(user.merchantIds, merchants);

  return (
    <DetailList>
      <DetailItem label="Merchant">
        {merchantNames ? <UserGroupChips names={merchantNames} /> : merchantScopeLabel(user.merchantIds)}
      </DetailItem>
      {isLimited ? (
        <DetailItem label="Chỉ truy cập sub-merchant">
          <SubMerchantValue ids={user.subMerchantIds} />
        </DetailItem>
      ) : (
        <DetailItem label="Sub-merchant">Tất cả sub-merchant</DetailItem>
      )}
    </DetailList>
  );
}

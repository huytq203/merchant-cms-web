import { StatusBadge } from "@/components/page/StatusBadge";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { RELEASE_STATUS } from "../constants/freeze-labels";
import type { RevenueFreeze } from "../types";

/**
 * The releases of one freeze, newest first as the BE sends them. Only amount, state and times: why a release was made
 * or refused is internal to FlexPay and the BE does not send it to the Portal.
 */
export function FreezeReleaseList({ freeze }: { freeze: RevenueFreeze }) {
  const label = `Các lần gỡ băng ${freeze.freezeCode ?? ""}`.trim();
  if (freeze.releases.length === 0) {
    return <p className="px-4 py-3 text-sm text-muted-foreground">Chưa có lần gỡ băng nào.</p>;
  }
  return (
    <div className="px-4 py-3">
      <h3 className="mb-2 text-sm font-semibold">Các lần gỡ băng</h3>
      <table className="w-full text-sm" aria-label={label}>
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="py-1 pr-4 font-medium">Thời điểm yêu cầu</th>
            <th className="py-1 pr-4 text-right font-medium">Số tiền gỡ</th>
            <th className="py-1 pr-4 font-medium">Trạng thái</th>
            <th className="py-1 font-medium">Hoàn tất lúc</th>
          </tr>
        </thead>
        <tbody>
          {freeze.releases.map((release, index) => (
            <tr key={`${release.createdAt}-${index}`} className="border-t border-border">
              <td className="py-1.5 pr-4 tabular-nums">{formatVnDateTime(release.createdAt)}</td>
              <td className="py-1.5 pr-4 text-right font-semibold tabular-nums">{formatAmount(release.amount)}</td>
              <td className="py-1.5 pr-4">
                <StatusBadge label={RELEASE_STATUS[release.status].label} tone={RELEASE_STATUS[release.status].tone} />
              </td>
              <td className="py-1.5 tabular-nums">{release.completedAt ? formatVnDateTime(release.completedAt) : "Chờ sổ cái xử lý"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { Select } from "@/components/ui/select/Select";
import { Switch } from "@/components/ui/switch/Switch";
import { useSession } from "@/features/auth/components/session-provider";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { cn } from "@/lib/utils/cn";
import { notificationConfigQueries } from "./notification-config-queries";
import type { NotificationConfigRow } from "./schemas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sub cần truyền cho BE: quyền toàn Master thì để trống (cấp Master); người chỉ được gán Sub phải truyền Sub,
 * nếu không BE trả 404. Nhiều Sub thì người dùng chọn, mặc định Sub đầu tiên.
 */
function useConfigScope() {
  const session = useSession();
  const isMaster = session.merchantIds.length > 0;
  const assigned = session.subMerchantIds;
  const [picked, setPicked] = useState<string>("");
  const subMerchantId = isMaster ? undefined : (assigned.includes(picked) ? picked : assigned[0]);
  return { subMerchantId, assigned, showPicker: !isMaster && assigned.length > 1, pick: setPicked };
}

/** Ô chọn Sub; chỉ dựng (và chỉ gọi danh sách Sub nhẹ) khi người dùng có nhiều Sub. */
function SubPicker({ assigned, value, onPick }: { assigned: string[]; value: string; onPick: (id: string) => void }) {
  const options = useSubMerchantOptions();
  // Tên Sub lấy từ danh sách nhẹ; không tra được (thiếu quyền, lỗi) thì dùng nhãn theo thứ tự.
  const choices = assigned.map((id, index) => {
    const found = options.data?.find((option) => option.id === id);
    return { label: found ? `${found.code} · ${found.name}` : `Sub-merchant ${index + 1}`, value: id };
  });
  return <Select label="Sub-merchant" options={choices} value={value} onChange={(id) => id && onPick(id)} clearable={false} />;
}

/** Một ô tick chỉ đọc: có/không là thông tin, không bấm được. */
function Tick({ on }: { on: boolean }) {
  return on
    ? <Check role="img" aria-label="Có" className="mx-auto h-4 w-4 text-primary" />
    : <span role="img" aria-label="Không" className="mx-auto block w-4 text-center text-muted-foreground">–</span>;
}

/**
 * Kênh thực sự được gửi (chỉ còn email, đã bỏ SMS theo quyết định 13/11): khi công tắc kênh ngoài web tắt, chỉ nhóm bắt buộc vẫn gửi email (Admin cũng không tắt được),
 * nên bảng hiển thị đúng điều đó thay vì cấu hình nằm im.
 */
function effectiveChannels(row: NotificationConfigRow, externalEnabled: boolean) {
  if (externalEnabled) return { email: row.channels.includes("EMAIL") };
  return { email: row.emailMandatory };
}

/** "Cài đặt thông báo": cấu hình thông báo hiệu lực của Master/Sub, chỉ đọc; muốn đổi phải liên hệ FlexPay. */
export function NotificationSettingsDialog({ open, onOpenChange }: Props) {
  const scope = useConfigScope();
  // Chỉ gọi khi hộp thoại mở, để menu đóng không phát sinh request.
  const query = useQuery({ ...notificationConfigQueries.effective(scope.subMerchantId), enabled: open });
  const config = query.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl space-y-3">
        <DialogHeader>
          <DialogTitle>Cài đặt thông báo</DialogTitle>
        </DialogHeader>

        {scope.showPicker && <SubPicker assigned={scope.assigned} value={scope.subMerchantId ?? ""} onPick={scope.pick} />}

        {query.isPending && <p className="text-sm text-muted-foreground">Đang tải cấu hình...</p>}
        {query.isError && <p role="alert" className="text-sm text-destructive">{query.error.message}</p>}

        {config && (
          <>
            <Switch checked={config.externalChannelsEnabled} disabled label="Gửi thông báo qua kênh ngoài web" />
            {!config.externalChannelsEnabled && (
              <p className="text-sm text-muted-foreground">Đang tắt gửi qua kênh ngoài web — chỉ còn email bắt buộc.</p>
            )}

            <div
              data-testid="notification-config-table"
              data-disabled={!config.externalChannelsEnabled}
              className={cn("overflow-hidden rounded-lg border border-border", !config.externalChannelsEnabled && "opacity-50")}
            >
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Nhóm thông báo</th>
                    <th scope="col" className="w-20 px-3 py-2 text-center font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {config.externalChannels.map((row) => {
                    const shown = effectiveChannels(row, config.externalChannelsEnabled);
                    return (
                      <tr key={row.kind} className="border-t border-border">
                        <th scope="row" className="px-3 py-2 text-left font-normal">
                          {row.label}
                          {row.emailMandatory && <span className="ml-2 text-xs text-muted-foreground">(email bắt buộc)</span>}
                        </th>
                        <td className="px-3 py-2"><Tick on={shown.email} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <section aria-label="Email nhận thông báo" className="space-y-1">
              <h3 className="text-sm font-medium">Email nhận thông báo</h3>
              {config.notificationEmails.length === 0
                ? <p className="text-sm text-muted-foreground">Chưa có email nhận thông báo.</p>
                : <ul className="list-disc pl-5 text-sm">{config.notificationEmails.map((email) => <li key={email}>{email}</li>)}</ul>}
            </section>
          </>
        )}

        <p className="text-sm text-muted-foreground">Liên hệ FlexPay để thay đổi cấu hình.</p>
      </DialogContent>
    </Dialog>
  );
}

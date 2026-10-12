import { Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card/Card";
import { domainErrorMessage } from "@/lib/be/errors";
import { getTerminalSnapshot } from "@/server/modules/dashboard/dashboard.service";
import { RegionError } from "./RegionError";
import { StatCard } from "./StatCard";

export async function TerminalStatCard() {
  const result = await getTerminalSnapshot();
  if (!result.success) {
    return (
      <Card>
        <RegionError compact message={`Không tải được Terminal. ${domainErrorMessage(result.error)}`} />
      </Card>
    );
  }
  const { active, total } = result.data;
  const paused = total - active;
  return (
    <StatCard
      title="Terminal hoạt động"
      value={`${active} / ${total}`}
      hint={paused > 0 ? `${paused} Terminal đang tạm dừng` : "tất cả đang hoạt động"}
      icon={<Smartphone aria-hidden />}
      tone="info"
      href="/terminals"
    />
  );
}

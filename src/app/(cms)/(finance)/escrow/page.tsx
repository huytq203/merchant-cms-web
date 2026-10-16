import { redirect } from "next/navigation";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { ServerResultState } from "@/components/page/ServerResultState";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { EscrowContributionsTable } from "@/features/escrow/components/EscrowContributionsTable";
import { EscrowLedgerTable } from "@/features/escrow/components/EscrowLedgerTable";
import { EscrowSection } from "@/features/escrow/components/EscrowSection";
import { EscrowStandingCard } from "@/features/escrow/components/EscrowStandingCard";
import { getServerSession } from "@/lib/auth/session";
import { domainErrorMessage } from "@/lib/be/errors";
import { getEscrowStanding, listEscrowContributions, listEscrowLedger } from "@/server/modules/escrow/escrow.service";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const LEDGER_PAGE_SIZE = 20;

function pageOf(value: string | string[] | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

/** Server-only: the portal can only read escrow, so the three independent reads run together on the server. */
export default async function EscrowPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  const masterId = user.merchantIds[0];
  // A session assigned only to Subs gets 404 from every escrow endpoint, so it is turned away here.
  if (!hasPermission(user.permissions, "VIEW_ESCROW") || !masterId) return <AccessDenied />;

  const page = pageOf((await searchParams).page);
  const [standing, contributions, ledger] = await Promise.all([
    getEscrowStanding(masterId),
    listEscrowContributions(masterId),
    listEscrowLedger(masterId, page, LEDGER_PAGE_SIZE),
  ]);
  const masterName = (standing.success ? standing.data.masterName : null) ?? user.merchants.find((merchant) => merchant.id === masterId)?.name ?? "Merchant";

  return (
    <div className="space-y-5">
      <PageHeader title={getRouteTitle("/escrow")} description={`${masterName}. Việc nạp hoặc hoàn trả ký quỹ do Flexpay thực hiện.`} />
      {standing.success ? <EscrowStandingCard standing={standing.data} /> : <ServerResultState state="error" message={domainErrorMessage(standing.error)} />}
      <EscrowSection id="escrow-contributions" title="Đóng góp theo bên">
        {contributions.success
          ? <EscrowContributionsTable rows={contributions.data} masterName={masterName} />
          : <ServerResultState state="error" message={domainErrorMessage(contributions.error)} bare />}
      </EscrowSection>
      <EscrowSection id="escrow-ledger" title="Sổ ký quỹ">
        {ledger.success
          ? <EscrowLedgerTable rows={ledger.data.rows} total={ledger.data.total} page={page} pageSize={LEDGER_PAGE_SIZE} />
          : <ServerResultState state="error" message={domainErrorMessage(ledger.error)} bare />}
      </EscrowSection>
    </div>
  );
}

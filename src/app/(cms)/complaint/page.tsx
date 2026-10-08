import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import {
  complaintQueries,
  parseComplaintSearchParams,
} from "@/features/complaints/complaint-queries";
import { ComplaintsContainer } from "@/features/complaints/components/ComplaintsContainer";
import { SampleDataBanner } from "@/features/sample-data/components/SampleDataBanner";
import { resolveModuleSource } from "@/lib/be/api-mode";
import { getServerSession } from "@/lib/auth/session";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { listComplaints } from "@/server/modules/complaints/complaint.service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ComplaintPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  const merchantId = user.merchantIds[0];
  if (!merchantId || !hasPermission(user.permissions, "VIEW_DISPUTE")) {
    return <AccessDenied />;
  }
  const filter = parseComplaintSearchParams(await searchParams);
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...complaintQueries.list(filter),
      queryFn: async () =>
        unwrapOrRedirect(await listComplaints({ ...filter, merchantId })),
    });
  });
  const abilities = {
    canReply: hasPermission(user.permissions, "REPLY_DISPUTE"),
    canCreate: hasPermission(user.permissions, "CREATE_DISPUTE"),
  };
  return (
    <div className="space-y-5">
      {resolveModuleSource("complaints") === "fixture" && <SampleDataBanner />}
      <HydrationBoundary state={state}>
        <ComplaintsContainer filter={filter} abilities={abilities} />
      </HydrationBoundary>
    </div>
  );
}

import { Badge } from "@/components/ui/badge/Badge";
import { changeRequestStatusLabel } from "../utils/bank-mapper";
import type { BankChangeRequest } from "../types";

type Props = { request: Pick<BankChangeRequest, "status"> };

const variants = {
  PENDING: "soft-warning",
  APPROVED: "soft-success",
  REJECTED: "soft-danger",
} as const;

export function BankChangeRequestBadge({ request }: Props) {
  return <Badge variant={variants[request.status]}>{changeRequestStatusLabel(request.status)}</Badge>;
}

"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet/Sheet";
import { Badge } from "@/components/ui/badge/Badge";
import { Separator } from "@/components/ui/separator/Separator";
import { formatAmount, formatDate } from "@/lib/utils/helper";
import { cn } from "@/lib/utils/cn";
import { ModuleQueryError } from "@/features/sample-data/components/ModuleQueryError";
import { complaintQueries } from "../complaint-queries";
import {
  COMPLAINT_PARTY_LABELS,
  COMPLAINT_REQUEST_SOURCE_LABELS,
  COMPLAINT_VERDICT_LABELS,
  reasonLabel,
} from "../constants/Complaint.constants";
import type { Complaint } from "../types/types";
import { complaintDetailActions } from "../utils/complaint-actions";
import { describeDeadline } from "../utils/complaint-deadline";
import { ComplaintAttachmentList } from "./ComplaintAttachmentList";
import { ComplaintChatPanel } from "./ComplaintChatPanel";
import { ComplaintReplyBox } from "./ComplaintReplyBox";
import { ComplaintSteps } from "./ComplaintSteps";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import { AlertCircle, Clock, CreditCard, FileText, Gavel, History, MessageSquare } from "lucide-react";
import { Text } from "@/components/ui";

interface ComplaintDetailProps {
  /** The list row: shown at once, then replaced by the detail (messages, attachments) once it arrives. */
  complaint: Complaint | null;
  open: boolean;
  canReply: boolean;
  onOpenChange: (open: boolean) => void;
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <Text size="sm" weight="bold" color="muted" className="uppercase tracking-widest">
        {title}
      </Text>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function Verdict({ complaint }: { complaint: Complaint }) {
  if (complaint.status !== "CLOSED") return null;
  return (
    <>
      <Separator />
      <section>
        <SectionTitle icon={Gavel} title="Kết luận" />
        <dl className="divide-y divide-border rounded-xl border border-border bg-muted/30 px-4 text-sm">
          {complaint.verdict && <Row label="Kết quả">{COMPLAINT_VERDICT_LABELS[complaint.verdict]}</Row>}
          {complaint.closedByParty && <Row label="Bên kết thúc">{COMPLAINT_PARTY_LABELS[complaint.closedByParty]}</Row>}
          {complaint.closedAt && <Row label="Thời gian kết thúc"><span className="tabular-nums">{formatDate(complaint.closedAt)}</span></Row>}
        </dl>
        {complaint.verdictContent && (
          <p className="mt-3 whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">{complaint.verdictContent}</p>
        )}
      </section>
    </>
  );
}

function DetailBody({ complaint, conversationReady }: { complaint: Complaint; conversationReady: boolean }) {
  const deadline = describeDeadline(complaint.deadlineAt, complaint.status, new Date());
  const attachments = complaint.attachments ?? [];
  const createdWith = attachments.filter((attachment) => !attachment.messageId);
  return (
    <SheetBody className="space-y-5">
      {deadline && complaint.deadlineAt && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
            deadline.tone === "late" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning",
          )}
        >
          <Clock className="h-4 w-4 shrink-0" />
          <span>Hạn xử lý: {formatDate(complaint.deadlineAt)} · {deadline.label}</span>
          {deadline.tone === "late" && <AlertCircle className="ml-auto h-4 w-4 shrink-0" />}
        </div>
      )}

      <section>
        <SectionTitle icon={CreditCard} title="Giao dịch" />
        <dl className="divide-y divide-border rounded-xl border border-border bg-muted/30 px-4 text-sm">
          {complaint.transactionCode && (
            <Row label="Mã giao dịch">
              <Text copyable className="font-mono text-sm font-medium">{complaint.transactionCode}</Text>
            </Row>
          )}
          {complaint.transactionAmount != null && (
            <Row label="Số tiền"><span className="tabular-nums">{formatAmount(complaint.transactionAmount)}</span></Row>
          )}
          {complaint.transactionCreatedAt && (
            <Row label="Thời gian giao dịch"><span className="tabular-nums">{formatDate(complaint.transactionCreatedAt)}</span></Row>
          )}
          {complaint.subMerchantName && <Row label="Sub-merchant">{complaint.subMerchantName}</Row>}
        </dl>
      </section>

      <Separator />

      <section>
        <SectionTitle icon={FileText} title="Nội dung khiếu nại" />
        <dl className="mb-3 divide-y divide-border rounded-xl border border-border bg-muted/30 px-4 text-sm">
          <Row label="Lý do">{reasonLabel(complaint.reasonCode)}</Row>
          <Row label="Người gửi">
            {complaint.reporterName ? `${complaint.reporterName} (${COMPLAINT_PARTY_LABELS[complaint.reporterType]})` : COMPLAINT_PARTY_LABELS[complaint.reporterType]}
          </Row>
          {complaint.requestSource && <Row label="Nguồn yêu cầu">{COMPLAINT_REQUEST_SOURCE_LABELS[complaint.requestSource]}</Row>}
          <Row label="Thời gian tạo"><span className="tabular-nums">{formatDate(complaint.createdAt)}</span></Row>
        </dl>
        {complaint.content && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <Text size="sm" className="whitespace-pre-wrap">{complaint.content}</Text>
          </div>
        )}
        <ComplaintAttachmentList complaintId={complaint.id} attachments={createdWith} className="mt-3" />
      </section>

      <Verdict complaint={complaint} />

      <Separator />

      <section>
        <SectionTitle icon={History} title="Tiến trình" />
        <ComplaintSteps complaint={complaint} />
      </section>

      <Separator />

      <section>
        <SectionTitle icon={MessageSquare} title="Trao đổi xử lý" />
        {conversationReady ? (
          <ComplaintChatPanel complaintId={complaint.id} messages={complaint.messages ?? []} attachments={attachments} />
        ) : (
          <p role="status" className="py-6 text-center text-sm text-muted-foreground">Đang tải trao đổi...</p>
        )}
      </section>
    </SheetBody>
  );
}

export function ComplaintDetail({ complaint: row, open, canReply, onOpenChange }: ComplaintDetailProps) {
  const detail = useQuery({ ...complaintQueries.detail(row?.id ?? ""), enabled: open && row !== null });
  // The fetched detail wins over the row: after a reply or reject it carries the new status.
  const complaint = detail.data ?? row;
  const actions = complaint ? complaintDetailActions(complaint, canReply) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg">
        <SheetHeader>
          <div className="grid gap-1.5">
            <SheetTitle className="font-mono text-base text-primary">#{complaint?.complaintCode}</SheetTitle>
            {complaint && (
              <div className="flex flex-wrap items-center gap-2">
                <ComplaintStatusBadge complaint={complaint} />
                <Badge variant="secondary" size="sm">{COMPLAINT_PARTY_LABELS[complaint.reporterType]}</Badge>
              </div>
            )}
          </div>
        </SheetHeader>

        {complaint && (
          <>
            {detail.isError ? (
              <SheetBody>
                <ModuleQueryError error={detail.error} onRetry={() => void detail.refetch()} />
              </SheetBody>
            ) : (
              <DetailBody complaint={complaint} conversationReady={detail.isSuccess} />
            )}
            {detail.isSuccess && actions?.canAct ? (
              <SheetFooter className="flex-col items-stretch">
                <ComplaintReplyBox complaint={complaint} />
              </SheetFooter>
            ) : detail.isSuccess && actions?.note ? (
              <SheetFooter className="flex-col items-stretch">
                <p className="text-sm text-muted-foreground">{actions.note}</p>
              </SheetFooter>
            ) : null}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ComplaintDetail;

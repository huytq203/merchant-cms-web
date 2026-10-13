"use client";
import React from "react";
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
import { formatDate } from "@/lib/utils/helper";
import { cn } from "@/lib/utils/cn";
import { COMPLAINT_SOURCE_OPTIONS } from "../constants/Complaint.constants";
import type { Complaint } from "../types/types";
import { describeDeadline } from "../utils/complaint-deadline";
import { ComplaintChatPanel } from "./ComplaintChatPanel";
import { ComplaintReplyBox } from "./ComplaintReplyBox";
import { ComplaintSteps } from "./ComplaintSteps";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import { AlertCircle, Clock, CreditCard, FileText, History, MessageSquare } from "lucide-react";
import { Text } from "@/components/ui";

interface ComplaintDetailProps {
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

function ClosedNote({ complaint }: { complaint: Complaint }) {
  const text = complaint.status === "resolved" ? "Khiếu nại đã xử lý xong" : "Khiếu nại đã bị từ chối";
  return <p className="text-sm text-muted-foreground">{text}, không thể phản hồi thêm.</p>;
}

export function ComplaintDetail({ complaint, open, canReply, onOpenChange }: ComplaintDetailProps) {
  const sourceOption = complaint ? COMPLAINT_SOURCE_OPTIONS.find((option) => option.value === complaint.source) : undefined;
  const deadline = complaint ? describeDeadline(complaint.deadline, complaint.status, new Date()) : null;
  const isClosed = complaint?.status === "resolved" || complaint?.status === "rejected";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg">
        <SheetHeader>
          <div className="grid gap-1.5">
            <SheetTitle className="font-mono text-base text-primary">#{complaint?.ticketCode}</SheetTitle>
            {complaint && (
              <div className="flex flex-wrap items-center gap-2">
                <ComplaintStatusBadge status={complaint.status} />
                {sourceOption && <Badge variant={sourceOption.variant} size="sm">{sourceOption.label}</Badge>}
              </div>
            )}
          </div>
        </SheetHeader>

        {complaint && (
          <>
            <SheetBody className="space-y-5">
              {deadline && complaint.deadline && (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                    deadline.tone === "late" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning",
                  )}
                >
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Hạn xử lý: {formatDate(complaint.deadline)} · {deadline.label}</span>
                  {deadline.tone === "late" && <AlertCircle className="ml-auto h-4 w-4 shrink-0" />}
                </div>
              )}

              <section>
                <SectionTitle icon={CreditCard} title="Giao dịch" />
                <dl className="divide-y divide-border rounded-xl border border-border bg-muted/30 px-4 text-sm">
                  {complaint.transactionCode && (
                    <div className="flex items-center justify-between gap-4 py-2.5">
                      <dt className="text-muted-foreground">Mã giao dịch</dt>
                      <dd><Text copyable className="font-mono text-sm font-medium">{complaint.transactionCode}</Text></dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground">Sub-merchant</dt>
                    <dd className="text-right font-medium">{complaint.subMerchantName}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground">Thời gian tạo khiếu nại</dt>
                    <dd className="font-medium tabular-nums">{formatDate(complaint.createdAt)}</dd>
                  </div>
                </dl>
              </section>

              <Separator />

              <section>
                <SectionTitle icon={FileText} title="Nội dung khiếu nại" />
                <div className="space-y-3">
                  <Text weight="bold" className="text-sm">{complaint.note ?? complaint.reason}</Text>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <Text size="sm" color="muted" italic>&ldquo;{complaint.content}&rdquo;</Text>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <SectionTitle icon={History} title="Tiến trình" />
                <ComplaintSteps complaint={complaint} />
              </section>

              <Separator />

              <section>
                <SectionTitle icon={MessageSquare} title="Trao đổi xử lý" />
                <ComplaintChatPanel messages={complaint.messages} />
              </section>
            </SheetBody>
            {isClosed ? (
              <SheetFooter className="flex-col items-stretch">
                <ClosedNote complaint={complaint} />
              </SheetFooter>
            ) : canReply ? (
              <SheetFooter className="flex-col items-stretch">
                <ComplaintReplyBox />
              </SheetFooter>
            ) : null}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ComplaintDetail;

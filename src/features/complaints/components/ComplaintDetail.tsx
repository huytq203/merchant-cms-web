"use client";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from "@/components/ui/sheet/Sheet";
import { Badge } from "@/components/ui/badge/Badge";
import { Separator } from "@/components/ui/separator/Separator";
import { formatDate } from "@/lib/utils/helper";
import { COMPLAINT_STATUS_OPTIONS } from "../constants/Complaint.constants";
import type { Complaint } from "../types/types";
import { ComplaintChatPanel } from "./ComplaintChatPanel";
import { AlertCircle, Clock, CreditCard, FileText, History, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Text } from "@/components/ui";

interface ComplaintDetailProps {
  complaint: Complaint | null;
  open: boolean;
  canReply: boolean;
  onOpenChange: (open: boolean) => void;
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <Text
        size="sm"
        weight="bold"
        color="muted"
        className="uppercase tracking-widest"
      >
        {title}
      </Text>
    </div>
  );
}

export function ComplaintDetail({
  complaint,
  open,
  canReply,
  onOpenChange,
}: ComplaintDetailProps) {
  const statusOption = complaint
    ? COMPLAINT_STATUS_OPTIONS.find((o) => o.value === complaint.status)
    : undefined;

  const isOverdue = complaint?.deadline
    ? new Date(complaint.deadline) < new Date()
    : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg">
        <SheetHeader>
          <div className="flex items-center gap-2.5 flex-wrap">
            <SheetTitle className="font-mono text-base">
              #{complaint?.ticketCode}
            </SheetTitle>
            {statusOption && (
              <Badge
                variant={statusOption.variant}
                size="sm"
                pulse={complaint?.status === "processing"}
              >
                {statusOption.label}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {complaint && (
          <SheetBody className="space-y-5">
            {/* Deadline */}
            {complaint.deadline && (
              <div
                className={cn(
                  "flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2",
                  isOverdue
                    ? "bg-danger/10 text-danger"
                    : "bg-warning/10 text-warning",
                )}
              >
                <Clock className="h-4 w-4 shrink-0" />
                <span>Hạn xử lý: {formatDate(complaint.deadline)}</span>
                {isOverdue && (
                  <AlertCircle className="h-4 w-4 ml-auto shrink-0" />
                )}
              </div>
            )}

            {/* Transaction info */}
            {complaint.transactionCode && (
              <section>
                <SectionTitle icon={CreditCard} title="Thông tin giao dịch" />
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <Text size="xs" color="muted">
                      Mã giao dịch
                    </Text>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Text copyable className="text-sm font-mono font-medium">
                        {complaint.transactionCode}
                      </Text>
                    </div>
                  </div>
                  <div className="flex flex-col gap-y-1">
                    <Text size="xs" color="muted">
                      Thời gian GD
                    </Text>
                    <Text size="sm" className="mt-0.5">
                      {formatDate(complaint.createdAt)}
                    </Text>
                  </div>
                </div>
              </section>
            )}

            <Separator />

            {/* Complaint content */}
            <section>
              <SectionTitle icon={FileText} title="Nội dung khiếu nại" />
              <div className="space-y-3">
                {complaint.note && (
                  <div className="flex flex-col gap-y-1">
                    <Text size="xs" color="muted">
                      Lý do
                    </Text>
                    <Text weight="bold" color="primary" className="text-sm">
                      {complaint.note}
                    </Text>
                  </div>
                )}
                <div className="p-3 border border-border/60 rounded-lg border-2">
                  <Text size="sm" color="muted" italic>
                    &ldquo;{complaint.content}&rdquo;
                  </Text>
                </div>
              </div>
            </section>

            <Separator />

            {/* Processing history */}
            <section>
              <SectionTitle icon={History} title="Lịch sử xử lý" />
              <div className="flex gap-3">
                <div className="flex flex-col items-center pt-1.5 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(complaint.createdAt)}
                  </p>
                  <p className="text-sm font-medium">
                    Hệ thống tiếp nhận khiếu nại từ khách hàng
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Chat */}
            <section>
              <SectionTitle icon={MessageSquare} title="Trao đổi xử lý" />
              <ComplaintChatPanel
                messages={complaint.messages}
                canReply={canReply}
              />
            </section>
          </SheetBody>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ComplaintDetail;

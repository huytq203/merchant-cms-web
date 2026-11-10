"use client";

import { FileText, ImageIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button/Button";
import type { StoredFile } from "../types";

type Props = {
  file: StoredFile;
  /** Extra action next to "Xem", for example "Thay tệp" in the edit form. */
  action?: ReactNode;
  /** Asks the parent to reload the detail when the signed link has expired. */
  onRefreshLinks?: () => void;
};

/** The signed (presigned) link of the BE is time-limited; an expired one must be refreshed, not opened. */
function isExpired(file: StoredFile) {
  return Boolean(file.urlExpiresAt) && new Date(file.urlExpiresAt as string).getTime() <= Date.now();
}

const isImage = (file: StoredFile) => Boolean(file.contentType?.startsWith("image/"));

/**
 * A saved legal document as a card: PDF or image icon, file name and a "Xem" link that opens the presigned URL
 * of `GET /merchant/merchants/{id}` in a new tab. Used by the read-only dossier and by the edit form (where the
 * user can swap the file), so both show the same thing for a file that is already on the server.
 */
export function StoredFileCard({ file, action, onRefreshLinks }: Props) {
  const Icon = isImage(file) ? ImageIcon : FileText;
  const kind = isImage(file) ? "Ảnh" : "PDF";
  const expired = isExpired(file);
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-background p-3">
      <Icon className="size-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground" title={file.filename ?? undefined}>
          {file.filename ?? "Tệp đã tải lên"}
        </p>
        <p className="text-xs text-muted-foreground">{kind}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-sm">
        {file.url && !expired && (
          <a className="font-medium text-primary underline" href={file.url} target="_blank" rel="noreferrer">
            Xem
          </a>
        )}
        {file.url && expired && onRefreshLinks && (
          <Button type="button" variant="link" size="sm" onClick={onRefreshLinks}>
            Liên kết đã hết hạn, tải lại
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}

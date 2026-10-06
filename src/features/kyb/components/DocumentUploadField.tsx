"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { FileUpload } from "@/components/ui/file-upload/FileUpload";
import { DOCUMENT_RULES, type DocumentType } from "../constants/document-rules";
import { useDocumentUpload } from "../hooks/use-document-upload";
import type { StoredFile } from "../types";
import { acceptedFormatsLabel, maxSizeLabel } from "../utils/document-validation";

type Props = {
  type: DocumentType;
  required?: boolean;
  multiple?: boolean;
  /** Files already saved on the server, shown until the user uploads a replacement. */
  existing?: StoredFile[];
  /** Error from the parent, for example a missing required document. */
  error?: string;
  disabled?: boolean;
  onChange: (stagingIds: string[]) => void;
  /** Asks the parent to reload the detail when a signed link has expired. */
  onRefreshLinks?: () => void;
};

function isExpired(file: StoredFile) {
  return Boolean(file.urlExpiresAt) && new Date(file.urlExpiresAt as string).getTime() <= Date.now();
}

function ExistingFiles({ files, onRefreshLinks }: { files: StoredFile[]; onRefreshLinks?: () => void }) {
  return (
    <ul className="grid gap-1 text-xs text-muted-foreground">
      {files.map((file) => (
        <li key={file.id} className="flex flex-wrap items-center gap-2">
          <span>Đã lưu: {file.filename ?? "tệp đã tải lên"}</span>
          {file.url && !isExpired(file) && (
            <a className="text-primary underline" href={file.url} target="_blank" rel="noreferrer">
              Xem tệp
            </a>
          )}
          {file.url && isExpired(file) && onRefreshLinks && (
            <Button type="button" variant="link" size="sm" onClick={onRefreshLinks}>
              Liên kết đã hết hạn, tải lại
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function DocumentUploadField(props: Props) {
  const { type, required, multiple, existing = [], error, disabled, onChange, onRefreshLinks } = props;
  const rule = DOCUMENT_RULES[type];
  const upload = useDocumentUpload({ type, multiple, onChange });
  const files = upload.items.map((item) => item.file);
  const handleChange = (next: File[]) => {
    if (next.length < files.length) {
      upload.remove(files.findIndex((file) => !next.includes(file)));
      return;
    }
    void upload.add(next.filter((file) => !files.includes(file)));
  };
  return (
    <div className="grid gap-2">
      <FileUpload
        label={required ? `${rule.label} *` : rule.label}
        size="sm"
        accept={rule.contentTypes.join(",")}
        multiple={multiple}
        value={files}
        onChange={handleChange}
        disabled={disabled || upload.isUploading}
        error={upload.error ?? error}
      >
        <Upload className="size-5 text-primary" aria-hidden />
        <p className="text-center font-medium text-foreground">
          {upload.isUploading ? "Đang tải lên..." : "Nhấn để tải lên"}
        </p>
        <p className="text-center text-muted-foreground">
          {acceptedFormatsLabel(type)} · tối đa {maxSizeLabel(type)}
        </p>
      </FileUpload>
      {files.length === 0 && existing.length > 0 && (
        <ExistingFiles files={existing} onRefreshLinks={onRefreshLinks} />
      )}
    </div>
  );
}

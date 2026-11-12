"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { FileUpload } from "@/components/ui/file-upload/FileUpload";
import { DOCUMENT_RULES, type DocumentType } from "../constants/document-rules";
import { useDocumentUpload } from "../hooks/use-document-upload";
import type { StoredFile } from "../types";
import { StoredFileCard } from "./StoredFileCard";
import { acceptedFormatsLabel, maxSizeLabel } from "../utils/document-validation";

type Props = {
  type: DocumentType;
  /** Overrides the default label of the document type, for example the Sub's own contract vs the Master's. */
  label?: string;
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

export function DocumentUploadField(props: Props) {
  const { type, label: customLabel, required, multiple, existing = [], error, disabled, onChange, onRefreshLinks } = props;
  const rule = DOCUMENT_RULES[type];
  const label = customLabel ?? rule.label;
  // With a file already saved, the slot shows its card; "Thay tệp" opens the empty upload box instead.
  // Remember which saved file the user chose to replace, so a new saved file (after save/refetch) shows its card again.
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const replacing = replacingId !== null && replacingId === existing[0]?.id;
  const upload = useDocumentUpload({ type, multiple, onChange });
  const files = upload.items.map((item) => item.file);
  const handleChange = (next: File[]) => {
    if (next.length < files.length) {
      upload.remove(files.findIndex((file) => !next.includes(file)));
      return;
    }
    void upload.add(next.filter((file) => !files.includes(file)));
  };
  if (existing.length > 0 && files.length === 0 && !replacing && !upload.isUploading) {
    return (
      <div className="grid gap-2">
        <p className="text-sm font-medium text-foreground">{required ? `${label} *` : label}</p>
        {existing.map((file, index) => (
          <StoredFileCard
            key={file.id}
            file={file}
            onRefreshLinks={onRefreshLinks}
            action={
              index === 0 && !disabled ? (
                <Button type="button" variant="outline" size="sm" aria-label={`Thay tệp ${file.filename ?? label}`} onClick={() => setReplacingId(existing[0]?.id ?? null)}>
                  Thay tệp
                </Button>
              ) : undefined
            }
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      <FileUpload
        label={required ? `${label} *` : label}
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
      {existing.length > 0 && files.length === 0 && (
        <Button type="button" variant="link" size="sm" className="justify-self-start" onClick={() => setReplacingId(null)}>
          Giữ tệp hiện tại
        </Button>
      )}
    </div>
  );
}

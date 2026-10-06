"use client";

import { useState } from "react";
import type { DocumentType } from "../constants/document-rules";
import { uploadKybDocument } from "../kyb-api";
import { validateDocumentFile } from "../utils/document-validation";

export type UploadedDocument = { file: File; stagingId: string };

type Options = {
  type: DocumentType;
  multiple?: boolean;
  /** Called with the staging ids that remain after a change; never with an empty id. */
  onChange: (stagingIds: string[]) => void;
};

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Tải tệp thất bại";
}

export function useDocumentUpload({ type, multiple = false, onChange }: Options) {
  const [items, setItems] = useState<UploadedDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const commit = (next: UploadedDocument[]) => {
    setItems(next);
    onChange(next.map((item) => item.stagingId));
  };

  const uploadOne = async (file: File): Promise<UploadedDocument> => {
    const invalid = validateDocumentFile(file, type);
    if (invalid) throw new Error(invalid);
    return { file, stagingId: await uploadKybDocument(file, type) };
  };

  const add = async (files: File[]) => {
    setError(null);
    setIsUploading(true);
    const uploaded: UploadedDocument[] = [];
    for (const file of files) {
      try {
        uploaded.push(await uploadOne(file));
      } catch (failure) {
        setError(messageOf(failure));
        break;
      }
    }
    setIsUploading(false);
    // A failed single upload keeps the previous file; a failed batch keeps what already uploaded.
    if (uploaded.length > 0) commit(multiple ? [...items, ...uploaded] : uploaded);
  };

  const remove = (index: number) => {
    setError(null);
    commit(items.filter((_, position) => position !== index));
  };

  return { items, error, isUploading, add, remove, setError };
}

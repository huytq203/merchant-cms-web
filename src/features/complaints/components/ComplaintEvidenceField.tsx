'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload/FileUpload';
import { EVIDENCE_ACCEPT, EVIDENCE_HINT } from '../constants/Complaint.constants';
import { checkEvidenceFiles } from '../utils/complaint-evidence';

type Props = {
  label?: string;
  value: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
};

/**
 * Evidence picker for a create or a reply. Limits are checked here with Vietnamese messages (the shared
 * upload component only has English ones), so it gets no `maxSize`/`maxFiles` of its own.
 */
export function ComplaintEvidenceField({ label = 'Chứng từ đính kèm', value, onChange, disabled }: Props) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (next: File[]) => {
    // A shorter list is a removal; a longer one carries newly picked files at the end.
    if (next.length <= value.length) {
      setError(null);
      onChange(next);
      return;
    }
    const checked = checkEvidenceFiles(value, next.slice(value.length));
    setError(checked.error);
    onChange(checked.files);
  };

  return (
    <FileUpload
      label={label}
      description={EVIDENCE_HINT}
      accept={EVIDENCE_ACCEPT}
      multiple
      value={value}
      onChange={handleChange}
      error={error ?? undefined}
      disabled={disabled}
      size="sm"
    />
  );
}

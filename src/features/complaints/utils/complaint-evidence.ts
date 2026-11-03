import { EVIDENCE_MAX_BYTES } from "../constants/Complaint.constants";
import { MAX_COMPLAINT_ATTACHMENTS } from "../schemas/complaint.schema";

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);

export type EvidenceCheck = { files: File[]; error: string | null };

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
}

/**
 * Keeps the newly picked files the BE would accept (.pdf/.jpg/.png, ≤ 10MB, ≤ 10 per send) and says in
 * Vietnamese why the others were left out. The BE checks the real content again; this only avoids a
 * pointless upload and replaces the English messages of the shared upload component.
 */
export function checkEvidenceFiles(current: File[], picked: File[]): EvidenceCheck {
  const errors: string[] = [];
  const accepted = picked.filter((file) => {
    if (!ALLOWED_EXTENSIONS.has(extensionOf(file.name))) {
      // Same wording as the BE upload error, so the user reads one message whoever catches it.
      errors.push(`"${file.name}": Định dạng file không hỗ trợ`);
      return false;
    }
    if (file.size > EVIDENCE_MAX_BYTES) {
      errors.push(`"${file.name}": Dung lượng file vượt quá 10MB`);
      return false;
    }
    return true;
  });
  const room = Math.max(0, MAX_COMPLAINT_ATTACHMENTS - current.length);
  if (accepted.length > room) errors.push(`Chỉ được đính kèm tối đa ${MAX_COMPLAINT_ATTACHMENTS} tệp`);
  return { files: [...current, ...accepted.slice(0, room)], error: errors.length > 0 ? errors.join(". ") : null };
}

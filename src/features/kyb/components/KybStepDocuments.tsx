"use client";

import { useWatch, type Control } from "react-hook-form";
import type { DocumentType } from "../constants/document-rules";
import type { EnterpriseWallet, KybDocumentKey, StoredFile, WalletFormValues } from "../types";
import { needsAuthorizationLetter } from "../utils/kyb-mapper";
import { StoredFileCard } from "./StoredFileCard";
import { DocumentUploadField } from "./DocumentUploadField";

type Slot = {
  key: KybDocumentKey;
  type: DocumentType;
  stored: keyof EnterpriseWallet;
};

const SLOTS: readonly Slot[] = [
  { key: "businessLicenseStagingId", type: "BUSINESS_LICENSE", stored: "businessLicense" },
  { key: "idCardFrontStagingId", type: "ID_CARD_FRONT", stored: "idCardFront" },
  { key: "idCardBackStagingId", type: "ID_CARD_BACK", stored: "idCardBack" },
];

const AUTHORIZATION_SLOT: Slot = {
  key: "authorizationLetterStagingId",
  type: "AUTHORIZATION_LETTER",
  stored: "authorizationLetter",
};

type Props = {
  wallet: EnterpriseWallet;
  control: Control<WalletFormValues>;
  /** Keys of documents the user still has to provide. */
  missing: readonly KybDocumentKey[];
  onStagingChange: (key: KybDocumentKey, stagingIds: string[]) => void;
  onRefreshLinks: () => void;
};

function storedFiles(wallet: EnterpriseWallet, slot: Slot): StoredFile[] {
  const file = wallet[slot.stored] as StoredFile | null | undefined;
  return file ? [file] : [];
}

export function KybStepDocuments({ wallet, control, missing, onStagingChange, onRefreshLinks }: Props) {
  const [managerName, representativeName] = useWatch({
    control,
    name: ["managerName", "legalRepresentativeName"],
  });
  const showLetter = needsAuthorizationLetter({
    managerName,
    legalRepresentativeName: representativeName,
  });
  const slots = showLetter ? [...SLOTS, AUTHORIZATION_SLOT] : SLOTS;
  return (
    <section className="grid gap-4" aria-labelledby="kyb-documents-title">
      <h3 id="kyb-documents-title" className="text-sm font-semibold text-foreground">
        Hồ sơ pháp lý
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {slots.map((slot) => (
          <DocumentUploadField
            key={slot.key}
            type={slot.type}
            required={slot.key !== "authorizationLetterStagingId" || showLetter}
            existing={storedFiles(wallet, slot)}
            error={missing.includes(slot.key) ? "Cần tải lên tệp này" : undefined}
            onChange={(ids) => onStagingChange(slot.key, ids)}
            onRefreshLinks={onRefreshLinks}
          />
        ))}
        {/* A letter already on file stays visible when the names now match; it is not needed, so it cannot be swapped. */}
        {!showLetter && wallet.authorizationLetter && (
          <div className="grid gap-2">
            <p className="text-sm font-medium text-foreground">Giấy uỷ quyền</p>
            <StoredFileCard file={wallet.authorizationLetter} onRefreshLinks={onRefreshLinks} />
          </div>
        )}
      </div>
    </section>
  );
}

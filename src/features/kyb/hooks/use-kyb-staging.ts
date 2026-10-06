import { useState } from "react";
import type { EnterpriseWallet, KybDocumentKey, StagingIds } from "../types";
import { missingDocuments } from "../utils/kyb-mapper";

/** Tracks freshly uploaded staging ids and which required documents are still absent. */
export function useKybStaging(wallet: EnterpriseWallet, needsLetter: boolean) {
  const [stagingIds, setStagingIds] = useState<StagingIds>({});

  const setStaging = (key: KybDocumentKey, ids: string[]) => {
    setStagingIds((current) => ({ ...current, [key]: ids[0] }));
  };

  // The letter slot unmounts when names match, so its stale id must not be sent.
  const effective: StagingIds = needsLetter
    ? stagingIds
    : { ...stagingIds, authorizationLetterStagingId: undefined };

  const missing: KybDocumentKey[] = missingDocuments(wallet, effective);
  const letterMissing = needsLetter
    && !effective.authorizationLetterStagingId
    && !wallet.authorizationLetter;
  if (letterMissing) missing.push("authorizationLetterStagingId");

  return {
    stagingIds: effective,
    missing,
    setStaging,
    /** Staged files are attached once saved; later saves must not resend them. */
    clearStaging: () => setStagingIds({}),
  };
}

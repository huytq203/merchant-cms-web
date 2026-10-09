import type { EnterpriseWallet, WalletFormValues } from "../types";

export type IdentityChanges = {
  legalName: boolean;
  taxCode: boolean;
  legalRepresentativeName: boolean;
};

const same = (stored: string | null | undefined, typed: string) => (stored ?? "").trim() === typed.trim();

/**
 * The three fields the BE treats as identity: changing one on a verified dossier sends it back to
 * review. Compared with what is stored, so retyping the same value is not a change.
 */
export function identityChanges(
  wallet: Pick<EnterpriseWallet, "legalName" | "taxCode" | "legalRepresentativeName">,
  values: Pick<WalletFormValues, "legalName" | "taxCode" | "legalRepresentativeName">,
): IdentityChanges {
  return {
    legalName: !same(wallet.legalName, values.legalName),
    taxCode: !same(wallet.taxCode, values.taxCode),
    legalRepresentativeName: !same(wallet.legalRepresentativeName, values.legalRepresentativeName),
  };
}

export const hasIdentityChange = (changes: IdentityChanges): boolean => Object.values(changes).some(Boolean);

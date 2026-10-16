/** A Sub the session may pick on a screen that shows one Sub at a time. */
export interface SubMerchantChoice {
  id: string;
  label: string;
}

/** The requested Sub when the session may choose it, otherwise the first one; null when there is none. */
export function pickSubMerchantId(choices: readonly SubMerchantChoice[], requested: string | undefined): string | null {
  if (requested && choices.some((choice) => choice.id === requested)) return requested;
  return choices[0]?.id ?? null;
}

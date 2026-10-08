/**
 * How many leading chips fit whole on a single line.
 * Chips that do not fit are hidden completely (never cut mid-label).
 * At least one chip stays visible so a row is never empty.
 */
export function countFittingChips(containerWidth: number, chipWidths: readonly number[], gap: number): number {
  let used = 0;
  let count = 0;
  for (const width of chipWidths) {
    const next = count === 0 ? width : used + gap + width;
    if (next > containerWidth) break;
    used = next;
    count += 1;
  }
  return chipWidths.length > 0 ? Math.max(count, 1) : 0;
}

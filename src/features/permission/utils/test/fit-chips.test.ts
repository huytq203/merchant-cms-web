import { describe, expect, it } from 'vitest';
import { countFittingChips } from '../fit-chips';

describe('countFittingChips', () => {
  it('counts only whole chips that fit on one line, including the gaps between them', () => {
    expect(countFittingChips(200, [80, 80, 80], 6)).toBe(2);
    expect(countFittingChips(166, [80, 80, 80], 6)).toBe(2);
    expect(countFittingChips(165, [80, 80, 80], 6)).toBe(1);
  });

  it('fits everything when the container is wide enough', () => {
    expect(countFittingChips(1000, [80, 80, 80], 6)).toBe(3);
  });

  it('returns zero for no chips and keeps at least one chip visible in a very narrow container', () => {
    expect(countFittingChips(300, [], 6)).toBe(0);
    expect(countFittingChips(40, [80, 80], 6)).toBe(1);
  });

  it('stops at the first chip that does not fit even if a later one is narrower', () => {
    expect(countFittingChips(150, [80, 120, 20], 6)).toBe(1);
  });
});

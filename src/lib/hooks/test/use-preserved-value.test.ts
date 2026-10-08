// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePreservedValue } from '../use-preserved-value';

describe('usePreservedValue', () => {
  it('returns null until a value has been provided', () => {
    const { result } = renderHook(({ value }) => usePreservedValue(value), { initialProps: { value: null as string | null } });
    expect(result.current).toBeNull();
  });

  it('keeps the last value after it becomes null so closing content does not go blank', () => {
    const { result, rerender } = renderHook(({ value }) => usePreservedValue(value), { initialProps: { value: 'CSKH' as string | null } });
    expect(result.current).toBe('CSKH');
    rerender({ value: null });
    expect(result.current).toBe('CSKH');
  });

  it('switches to the newest value when a new one arrives', () => {
    const { result, rerender } = renderHook(({ value }) => usePreservedValue(value), { initialProps: { value: 'CSKH' as string | null } });
    rerender({ value: null });
    rerender({ value: 'Kế toán' });
    expect(result.current).toBe('Kế toán');
  });
});

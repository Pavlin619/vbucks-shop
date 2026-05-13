import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ToastProvider, useToast } from '@/contexts/ToastContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no toasts', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(result.current.toasts).toEqual([]);
  });

  it('push adds a toast with a generated id', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.push({ variant: 'success', message: 'Saved' });
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Saved');
    expect(result.current.toasts[0].variant).toBe('success');
    expect(typeof result.current.toasts[0].id).toBe('string');
  });

  it('dismiss removes a toast by id', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.push({ variant: 'error', message: 'Boom' });
    });
    const id = result.current.toasts[0].id;
    act(() => result.current.dismiss(id));
    expect(result.current.toasts).toEqual([]);
  });

  it('auto-dismisses after 4 seconds', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.push({ variant: 'info', message: 'Hi' });
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.toasts).toEqual([]);
  });

  it('caps the queue at 3 toasts (oldest dropped)', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.push({ variant: 'info', message: 'a' });
      result.current.push({ variant: 'info', message: 'b' });
      result.current.push({ variant: 'info', message: 'c' });
      result.current.push({ variant: 'info', message: 'd' });
    });
    expect(result.current.toasts.map((t) => t.message)).toEqual(['b', 'c', 'd']);
  });

  it('useToast throws when used outside ToastProvider', () => {
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used inside ToastProvider',
    );
  });
});

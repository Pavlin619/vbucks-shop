import { describe, it, expect } from 'vitest';
import { escHtml } from '@/lib/html-escape';

describe('escHtml', () => {
  it('passes through safe strings unchanged', () => {
    expect(escHtml('NinjaPlayer99')).toBe('NinjaPlayer99');
    expect(escHtml('Drift-Skin_v2')).toBe('Drift-Skin_v2');
  });

  it('escapes &', () => {
    expect(escHtml('A&B')).toBe('A&amp;B');
  });

  it('escapes <', () => {
    expect(escHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes >', () => {
    expect(escHtml('a>b')).toBe('a&gt;b');
  });

  it('escapes "', () => {
    expect(escHtml('"value"')).toBe('&quot;value&quot;');
  });

  it("escapes '", () => {
    expect(escHtml("it's")).toBe('it&#39;s');
  });

  it('escapes a full XSS payload', () => {
    const payload = '<img src=x onerror=alert(1)>';
    expect(escHtml(payload)).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('escapes all five characters in one string', () => {
    expect(escHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});

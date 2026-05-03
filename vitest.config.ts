import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['__tests__/unit/**/*.test.ts', '__tests__/unit/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      // `server-only` / `client-only` ship runtime guards that throw on the
      // wrong side of the bundler boundary. In Vitest there is no boundary,
      // so we replace both with no-op stubs to keep server modules importable
      // from unit tests (the boundary is still enforced by Next at build).
      'server-only': resolve(__dirname, '__tests__/stubs/empty.ts'),
      'client-only': resolve(__dirname, '__tests__/stubs/empty.ts'),
    },
  },
});
